// Run with NODE_PATH pointing to a Playwright installation; no app dependency is added.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

(async () => {
  const baseline = process.argv.includes('--baseline');
  const output = path.join(os.tmpdir(), 'hexwartz-performance');
  fs.mkdirSync(output, { recursive: true });
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...(process.argv.includes('--production') ? ['preview'] : []), '--host', '127.0.0.1', '--port', '5193', '--strictPort'], { stdio: 'pipe' });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      server.stdout.on('data', data => { if (data.toString().includes('Local:')) resolve(); });
      server.once('exit', code => reject(new Error(`Vite exited: ${code}`)));
      server.once('error', reject);
    });
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const results = {};
    for (const [name, viewport] of Object.entries({ desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } })) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.__reads = 0;
        window.__canvasFrames = 0;
        const clear = CanvasRenderingContext2D.prototype.clearRect;
        CanvasRenderingContext2D.prototype.clearRect = function (...args) { window.__canvasFrames++; return clear.apply(this, args); };
        const getRect = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = function () { window.__reads++; return getRect.call(this); };
        window.__audioContexts = 0;
        const AudioCtx = window.AudioContext;
        if (AudioCtx) window.AudioContext = new Proxy(AudioCtx, { construct(target, args) { window.__audioContexts++; return Reflect.construct(target, args); } });
      });
      await page.goto('http://127.0.0.1:5193');
      await page.evaluate(() => document.fonts.ready);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Performance.enable');
      const sample = async () => {
        const before = (await cdp.send('Performance.getMetrics')).metrics;
        const reads = await page.evaluate(() => window.__reads);
        await page.waitForTimeout(2000);
        const after = (await cdp.send('Performance.getMetrics')).metrics;
        return { layoutReads: await page.evaluate(() => window.__reads) - reads,
          ...Object.fromEntries(after.filter(m => ['TaskDuration', 'LayoutCount', 'LayoutDuration', 'ScriptDuration'].includes(m.name)).map(m => [m.name, m.value - before.find(b => b.name === m.name).value])) };
      };
      const intro = await sample();
      if (!baseline) {
        assert.equal(await page.evaluate(() => window.__canvasFrames), 0, 'Particles must not render behind the intro');
        assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').filter(r => r.name.endsWith('/music/theme.mp3')).length), 0, 'Music must not compete with initial assets');
      }
      await page.getByRole('button', { name: 'Skip cinematic prologue' }).click();
      await page.locator('.cinematic-intro-overlay').waitFor({ state: 'detached' });
      await page.waitForTimeout(500);
      const hero = await sample();
      if (!baseline) {
        assert.equal(await page.locator('canvas').count(), 0, 'The ambient background must not use a per-frame canvas');
        assert.equal(await page.locator('.enchanted-atmosphere').isVisible(), true);
        assert.equal(await page.locator('.magic-mote').count(), 14);
        assert.ok(await page.locator('.hero-floating-candles').evaluate(image => image.complete && image.naturalWidth > 0));
        assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some(r => r.name.includes('Gemini_Generated_Image_izvipmizvipmizvi'))), false, 'The old large backdrop must not download');
        assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some(r => r.name.includes('moonlit-castle'))), false, 'The removed castle image must not download');
        if (name === 'mobile') {
          const candle = await page.locator('.hero-floating-candles').boundingBox();
          const guidelines = await page.locator('.hero-btn-secondary').boundingBox();
          assert.ok(candle.y >= guidelines.y + guidelines.height, 'Candles must not overlap the mobile actions');
        } else {
          await page.locator('.landing-nav-cta').hover();
          assert.equal(await page.locator('.landing-nav-cta').evaluate(e => getComputedStyle(e).color), 'rgb(33, 23, 10)');
          await page.mouse.move(0, 0);
        }
      }
      // Freeze only the screenshot, so animation timing and random particles do not mask visual regressions.
      await page.evaluate(() => { const atmosphere = document.querySelector('.enchanted-atmosphere, canvas'); if (atmosphere) atmosphere.style.visibility = 'hidden'; });
      await page.waitForTimeout(150);
      const layout = await page.locator('main > section, header, footer').evaluateAll(es => es.map(e => ({ className: e.className.replace(/\s*animations-paused/g, ''), width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height })));
      const cutoutHeight = await page.locator('.section-cutout').count() ? await page.locator('.section-cutout').first().evaluate(image => image.offsetHeight + parseFloat(getComputedStyle(image).marginBottom)) : 0;
      await page.screenshot({ path: path.join(output, `${baseline ? 'before' : 'after'}-${name}.png`), animations: 'disabled' });
      if (!baseline) {
        const baselinePath = path.join(output, 'baseline.json');
        if (fs.existsSync(baselinePath)) {
          const previous = JSON.parse(fs.readFileSync(baselinePath))[name];
          // The cinematic venue deliberately gets more scroll space; the information sections stay intact.
          const information = rows => rows.filter(row => !row.className.includes('campus-showcase'));
          const expected = previous.layout.map(row => /challenge-section|tournament-codex-section|prizes-section/.test(row.className) ? { ...row, height: row.height + cutoutHeight - (previous.cutoutHeight || 0) } : row);
          assert.deepEqual(information(layout), information(expected), `${name}: information section geometry changed beyond the artwork space`);
        }
        assert.equal(intro.layoutReads, 0, 'Hidden envelope must not measure layout during the intro');
        assert.equal(hero.LayoutCount, 0, 'Offscreen animations must not cause idle layout');
      }
      const scrollReads = await page.evaluate(async () => {
        const start = window.__reads;
        for (let i = 0; i < 60; i++) { window.scrollTo({ top: i * 75, behavior: 'instant' }); await new Promise(requestAnimationFrame); }
        return window.__reads - start;
      });
      if (!baseline) assert.ok(scrollReads < 150, `Scroll performs too many layout reads: ${scrollReads}`);
      if (!baseline) {
        const positions = await page.locator('.cinematic-journey').evaluate(section => {
          const stage = section.querySelector('.cinematic-stage');
          const top = section.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(stage).top);
          return { top, distance: section.offsetHeight - stage.offsetHeight };
        });
        const letterPositions = [];
        assert.equal(await page.locator('.journey-scene').count(), 2);
        for (const [chapter, progress] of [[0, 0.2], [1, 0.78]]) {
          await page.evaluate(({ top, distance, progress }) => window.scrollTo({ top: top + distance * progress, behavior: 'instant' }), { ...positions, progress });
          await page.waitForTimeout(100);
          assert.equal(await page.locator('.journey-chapter').nth(chapter).getAttribute('aria-pressed'), 'true');
          assert.equal(await page.locator('.journey-scene').nth(chapter).getAttribute('aria-hidden'), 'false');
          assert.equal(await page.locator('.scrolling-seal-guide').isVisible(), true, 'Keep the letter visible throughout the scroll journey');
          letterPositions.push(await page.locator('.scrolling-seal-guide').evaluate(e => getComputedStyle(e).transform));
          const music = await page.locator('.floating-music-orb').boundingBox();
          const chapterBar = await page.locator('.journey-chapters').boundingBox();
          assert.ok(music.y + music.height <= chapterBar.y, 'Music controls must not overlap the chapter controls');
          await page.waitForFunction(index => { const image = document.querySelectorAll('.journey-scene img')[index]; return image.complete && image.naturalWidth > 0; }, chapter);
          assert.ok(await page.locator('.journey-scene img').nth(chapter).evaluate(e => new DOMMatrix(getComputedStyle(e).transform).a > 1.03), 'The active scene should zoom with scrolling');
          await page.screenshot({ path: path.join(output, `scene-${chapter + 1}-${name}.png`) });
        }
        assert.ok(new Set(letterPositions).size > 1, 'The letter must fly as the page scrolls');
        await page.locator('.journey-chapter').first().click();
        await page.waitForFunction(() => document.querySelector('.journey-chapter').getAttribute('aria-pressed') === 'true');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForFunction(() => getComputedStyle(document.querySelector('.journey-scene img')).transform === 'none');
        assert.equal(await page.locator('.journey-scene img').first().evaluate(e => getComputedStyle(e).transform), 'none');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.locator('.journey-next').click();
        await page.waitForFunction(() => Math.abs(document.querySelector('#houses').getBoundingClientRect().top) < 200);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'The story must not create horizontal overflow');
      }
      if (!baseline) {
        assert.equal(await page.locator('.section-cutout').count(), 3);
        for (const id of ['challenge', 'journey', 'prizes']) {
          const section = page.locator(`#${id}`);
          await section.locator('.has-section-cutout').evaluate(header => header.scrollIntoView({ block: 'start', behavior: 'instant' }));
          await page.waitForFunction(sectionId => { const image = document.querySelector(`#${sectionId} .section-cutout`); return image.complete && image.naturalWidth > 0; }, id);
          const image = section.locator('.section-cutout');
          assert.equal(await image.getAttribute('aria-hidden'), 'true');
          assert.equal(await image.evaluate(e => getComputedStyle(e).pointerEvents), 'none');
          const artBox = await image.boundingBox();
          const titleBox = await section.locator('h2').boundingBox();
          assert.ok(artBox.y + artBox.height <= titleBox.y, 'Section art must not overlap its heading');
          assert.ok(await page.locator('.scrolling-seal-guide').evaluate(e => e.offsetWidth > 56), 'Preserve the full-size flying letter');
          assert.notEqual(await page.locator('.scrolling-seal-guide').evaluate(e => getComputedStyle(e).transform), 'none');
          assert.equal(await page.locator('.letter-guide-label').evaluate(e => getComputedStyle(e).opacity), '1');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
          await page.screenshot({ path: path.join(output, `cutout-${id}-${name}.png`), animations: 'disabled' });
        }
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForFunction(() => !document.querySelector('.scrolling-seal-guide').classList.contains('is-guiding'));
        assert.ok(await page.locator('.scrolling-seal-guide').evaluate(e => e.offsetWidth > 56), 'The guide must return to its hero size');
      }
      await page.getByRole('button', { name: 'Tap to probe the enchanted vault lock' }).click();
      assert.ok(await page.locator('.proper-probe-btn').evaluate(e => e.classList.contains('is-resonating')));
      const faq = page.locator('.faq-question-btn').nth(1);
      await faq.click();
      assert.equal(await faq.getAttribute('aria-expanded'), 'true');
      await faq.click();
      assert.equal(await faq.getAttribute('aria-expanded'), 'false');
      await page.getByRole('button', { name: 'Play enchanted invitation chime' }).click();
      if (!baseline) assert.equal(await page.evaluate(() => window.__audioContexts), 1, 'Sound effects must reuse one audio context');
      await page.locator('.floating-music-orb').click();
      await page.waitForFunction(() => !document.querySelector('audio').paused);
      await page.locator('.floating-music-orb').click();
      assert.equal(await page.locator('audio').evaluate(audio => audio.paused), true);
      if (name === 'mobile') {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.getByRole('button', { name: 'Open navigation' }).click();
        assert.equal(await page.locator('.landing-menu-toggle').getAttribute('aria-expanded'), 'true');
        await page.locator('.landing-nav').getByRole('link', { name: 'Houses & tracks' }).click();
        assert.equal(await page.locator('.landing-menu-toggle').getAttribute('aria-expanded'), 'false');
      }
      assert.deepEqual(errors, []);
      if (!baseline) {
        await page.reload();
        // The button deliberately floats continuously, so Playwright's stability check never settles.
        await page.getByRole('button', { name: 'Enter HexWartz Hackathon', exact: true }).click({ force: true });
        await page.locator('.cinematic-intro-overlay').waitFor({ state: 'detached', timeout: 15000 });
        assert.ok(await page.locator('.landing-hero').isVisible());
      }
      assert.deepEqual(errors, []);
      if (!baseline) {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        assert.equal(await page.locator('.magic-mote').first().evaluate(e => getComputedStyle(e).animationName), 'none');
        assert.equal(await page.locator('.hero-floating-candles').evaluate(e => getComputedStyle(e).animationName), 'none');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
      }
      results[name] = { intro, hero, scrollReads, layout, cutoutHeight };
      await page.close();
    }
    fs.writeFileSync(path.join(output, baseline ? 'baseline.json' : 'optimized.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ output, results }, null, 2));
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
