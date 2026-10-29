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
        assert.ok(await page.evaluate(() => window.__canvasFrames > 0));
        await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
        const frames = await page.evaluate(() => window.__canvasFrames);
        await page.waitForTimeout(100);
        assert.equal(await page.evaluate(() => window.__canvasFrames), frames, 'Hidden tabs must stop drawing particles');
        await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
      }
      // Freeze only the screenshot, so animation timing and random particles do not mask visual regressions.
      await page.evaluate(() => { document.getAnimations().forEach(a => { a.pause(); a.currentTime = 0; }); document.querySelector('canvas').style.visibility = 'hidden'; });
      await page.waitForTimeout(150);
      const layout = await page.locator('main > section, header, footer').evaluateAll(es => es.map(e => ({ className: e.className.replace(/\s*animations-paused/g, ''), width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height })));
      await page.screenshot({ path: path.join(output, `${baseline ? 'before' : 'after'}-${name}.png`) });
      if (!baseline) {
        const baselinePath = path.join(output, 'baseline.json');
        if (fs.existsSync(baselinePath)) {
          const previous = JSON.parse(fs.readFileSync(baselinePath))[name];
          assert.deepEqual(layout, previous.layout, `${name}: section geometry changed`);
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
      results[name] = { intro, hero, scrollReads, layout };
      await page.close();
    }
    fs.writeFileSync(path.join(output, baseline ? 'baseline.json' : 'optimized.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ output, results }, null, 2));
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
