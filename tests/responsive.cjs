// Requires Playwright and Chrome; NODE_PATH may point to the workspace runtime.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

(async () => {
  const inspect = process.argv.includes('--inspect');
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5195', '--strictPort'], { stdio: 'pipe' });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      server.stdout.on('data', data => { if (data.toString().includes('Local:')) resolve(); });
      server.once('error', reject);
      server.once('exit', code => reject(new Error(`Vite exited: ${code}`)));
    });
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const directory = path.join(os.tmpdir(), 'hexwartz-responsive');
    fs.mkdirSync(directory, { recursive: true });
    for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 740 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 900, height: 700 }, { width: 960, height: 768 }, { width: 1024, height: 768 }, { width: 1280, height: 720 }, { width: 1920, height: 1080 }, { width: 844, height: 390 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:5195');
      await page.evaluate(() => document.fonts.ready);
      const button = page.getByRole('button', { name: 'Enter HexWartz Hackathon', exact: true });
      const introBox = await button.boundingBox();
      assert.ok(introBox.x >= -1 && introBox.y >= -1 && introBox.x + introBox.width <= viewport.width + 1 && introBox.y + introBox.height <= viewport.height + 1, `Enter button must fit the viewport: ${JSON.stringify({ viewport, introBox })}`);
      if (!inspect) {
        assert.equal(await button.evaluate(e => getComputedStyle(e).filter), 'none');
        assert.equal(await button.locator('img').evaluate(e => getComputedStyle(e).filter), 'none');
        assert.equal(await button.locator('img').getAttribute('src'), '/assets/intro/enter-button-transparent.webp');
        assert.ok(introBox.height >= 44, 'The Enter button must remain easy to tap');
      }
      await page.screenshot({ path: path.join(directory, `${inspect ? 'before' : 'after'}-intro-${viewport.width}.png`), animations: 'disabled' });
      await page.getByRole('button', { name: 'Skip cinematic prologue' }).click();
      await page.locator('.cinematic-intro-overlay').waitFor({ state: 'detached' });
      const issues = await page.evaluate(() => {
        const selectors = '.landing-brand, .landing-nav a, .landing-nav button, .hero-brand-lockup, .hero-titles-wrap, .hero-action-row a, .section-title-3d, .codex-pill-item, .codex-card, .proper-coming-soon-badge, .proper-probe-btn, .faq-question-btn, .prophet-logo-text, .prophet-action-strip > a, .footer-links-row';
        return [...document.querySelectorAll(selectors)].filter(e => e.checkVisibility()).flatMap(e => {
          const r = e.getBoundingClientRect();
          return r.left < -1 || r.right > innerWidth + 1 || e.scrollWidth > e.clientWidth + 2 ? [{ element: e.className, text: e.textContent.trim().slice(0, 45), left: r.left, right: r.right, overflow: e.scrollWidth - e.clientWidth }] : [];
        });
      });
      const menu = page.getByRole('button', { name: 'Open navigation' });
      if (await menu.isVisible()) {
        await menu.click();
        const navigation = await page.locator('.landing-nav').boundingBox();
        assert.ok(navigation.x >= 0 && navigation.x + navigation.width <= viewport.width);
        assert.ok(navigation.y + navigation.height <= viewport.height, 'Open navigation must fit the screen height');
        await page.locator('.landing-nav').getByRole('link', { name: 'FAQ', exact: true }).click();
        assert.equal(await page.locator('.landing-menu-toggle').getAttribute('aria-expanded'), 'false');
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForFunction(() => !document.querySelector('.scrolling-seal-guide').classList.contains('is-guiding'));
      }
      await page.screenshot({ path: path.join(directory, `${inspect ? 'before' : 'after'}-hero-${viewport.width}.png`), animations: 'disabled' });
      console.log(JSON.stringify({ viewport, introBox, issues }));
      if (!inspect) assert.deepEqual(issues, [], 'Content must not be clipped outside the viewport');
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
