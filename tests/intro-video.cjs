// Requires Playwright and Chrome; NODE_PATH may point to the bundled workspace runtime.
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

(async () => {
  const inspect = process.argv.includes('--inspect');
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5194', '--strictPort'], { stdio: 'pipe' });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      server.stdout.on('data', data => { if (data.toString().includes('Local:')) resolve(); });
      server.once('error', reject);
      server.once('exit', code => reject(new Error(`Vite exited: ${code}`)));
    });
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const output = path.join(os.tmpdir(), 'hexwartz-intro');
    fs.mkdirSync(output, { recursive: true });
    for (const viewport of [{ width: 1920, height: 1080 }, { width: 2560, height: 1080 }, { width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:5194');
      await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
      const playedHash = await page.locator('video').evaluate(async video => {
        const bytes = await (await fetch(video.currentSrc)).arrayBuffer();
        return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
      });
      assert.equal(playedHash, createHash('sha256').update(fs.readFileSync('public/video/hexwartz-intro.mp4')).digest('hex'), 'Play the exact supplied video bytes without re-encoding');
      await page.locator('video').evaluate(video => {
        window.__introPlayback = { ended: false, lastTime: 0 };
        video.addEventListener('ended', () => { window.__introPlayback = { ended: true, lastTime: video.currentTime }; });
      });
      const initialSkip = await page.getByRole('button', { name: 'Skip cinematic prologue' }).boundingBox();
      const initial = await page.locator('video').evaluate(video => {
        const rect = video.getBoundingClientRect();
        return { duration: video.duration, sourceWidth: video.videoWidth, sourceHeight: video.videoHeight, width: rect.width, height: rect.height, left: rect.left, top: rect.top, fit: getComputedStyle(video).objectFit, paused: video.paused, error: video.error?.message };
      });
      await page.getByRole('button', { name: 'Enter HexWartz Hackathon', exact: true }).focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('video')?.currentTime > 0.3);
      await page.waitForTimeout(1000);
      const playback = await page.locator('video').evaluate(video => ({ currentTime: video.currentTime, paused: video.paused, quality: video.getVideoPlaybackQuality().toJSON?.() || { total: video.getVideoPlaybackQuality().totalVideoFrames, dropped: video.getVideoPlaybackQuality().droppedVideoFrames }, error: video.error?.message }));
      const skip = await page.getByRole('button', { name: 'Skip to castle' }).boundingBox();
      await page.screenshot({ path: path.join(output, `${inspect ? 'before' : 'after'}-${viewport.width}.png`) });
      if (!inspect) {
        assert.equal(playback.paused, false);
        assert.equal(initial.width, viewport.width);
        assert.equal(initial.height, viewport.height);
        assert.equal(initial.left, 0);
        assert.equal(initial.top, 0);
        assert.equal(initial.fit, 'cover', 'The video must fill the viewport without letterboxing');
        assert.equal(skip.y, initialSkip.y, 'Playing and initial skip buttons must use the same top offset');
        assert.ok(skip.x >= 0 && skip.y >= 0 && skip.x + skip.width <= viewport.width && skip.y + skip.height <= viewport.height, 'The skip control must remain inside the viewport');
        await page.waitForFunction(() => document.querySelector('video')?.currentTime >= 6.4);
        assert.equal(await page.locator('.cinematic-intro-overlay').evaluate(e => e.classList.contains('intro-fade-out')), false, 'Do not cut off the video at 5.8 seconds');
      }
      await page.locator('.cinematic-intro-overlay').waitFor({ state: 'detached', timeout: 15000 });
      if (!inspect) {
        const completion = await page.evaluate(() => window.__introPlayback);
        assert.equal(completion.ended, true, 'The video must finish naturally before revealing the site');
        assert.ok(completion.lastTime >= initial.duration - 0.1);
      }
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ viewport, initial, playback, skip }));
      await page.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
