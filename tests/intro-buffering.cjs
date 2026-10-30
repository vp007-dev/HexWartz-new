// Verify slow-network playback without re-encoding or reducing the supplied video.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

(async () => {
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5197', '--strictPort'], { stdio: 'pipe' });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      server.stdout.on('data', data => { if (data.toString().includes('Local:')) resolve(); });
      server.once('error', reject);
      server.once('exit', code => reject(new Error(`Vite exited: ${code}`)));
    });
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    // Isolate video buffering from third-party fonts and the independent soundtrack download.
    await page.route('**/music/theme.mp3', route => route.abort());
    await page.route('https://fonts.**/*', route => route.abort());
    const requests = [];
    page.on('request', request => requests.push(new URL(request.url()).pathname));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 190000, uploadThroughput: 100000 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto('http://127.0.0.1:5197', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Enter HexWartz Hackathon', exact: true }).waitFor();
    await page.locator('video').evaluate(video => {
      window.introStalls = [];
      window.introFinished = false;
      video.addEventListener('waiting', () => { if (video.currentTime > 0.1) window.introStalls.push(video.currentTime); });
      video.addEventListener('ended', () => {
        const quality = video.getVideoPlaybackQuality();
        window.introFinished = { time: video.currentTime, total: quality.totalVideoFrames, dropped: quality.droppedVideoFrames };
      });
    });
    await page.getByRole('button', { name: 'Enter HexWartz Hackathon', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    assert.equal(await page.getByRole('button', { name: 'Enter HexWartz Hackathon', exact: true }).getAttribute('aria-busy'), 'true');
    assert.equal(await page.locator('video').evaluate(video => video.currentTime), 0, 'Wait for the complete clip instead of starting and freezing');
    assert.equal(await page.locator('.landing-hero').count(), 0, 'Do not mount hidden page artwork during video buffering');
    assert.ok(!requests.some(url => url.startsWith('/assets/v2/')), 'Hidden page images must not compete with the intro');
    await page.waitForFunction(() => document.querySelector('video')?.currentTime > 0.1, null, { timeout: 90000 });
    const localUrl = await page.locator('video').evaluate(video => video.currentSrc);
    const source = await page.locator('video').evaluate(video => ({ width: video.videoWidth, height: video.videoHeight, duration: video.duration, buffered: video.buffered.end(0) }));
    assert.equal(source.width, 1280);
    assert.equal(source.height, 720);
    assert.ok(await page.locator('video').evaluate(video => video.currentSrc.startsWith('blob:')), 'Play from the completed local download');
    assert.equal(requests.filter(url => url === '/video/hexwartz-intro.mp4').length, 1, 'Download the video only once');
    await page.locator('.cinematic-intro-overlay').waitFor({ state: 'detached', timeout: 20000 });
    const result = await page.evaluate(() => ({ stalls: window.introStalls, finished: window.introFinished }));
    assert.deepEqual(result.stalls, [], 'No buffering interruptions after playback begins');
    assert.ok(result.finished.time >= source.duration - 0.1, 'Play through the natural ending');
    assert.ok(result.finished.dropped / result.finished.total < 0.05, 'Keep frame drops below 5% with four-times CPU throttling');
    await page.locator('.scrolling-seal-guide').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(async url => {
      try { await fetch(url); return false; } catch { return true; }
    }, localUrl), true, 'Release the downloaded video after the intro');
    console.log(JSON.stringify({ source, ...result }));

    // Skip remains usable while buffering; late progress must not restart the intro.
    const skipPage = await browser.newPage();
    await skipPage.route('**/video/hexwartz-intro.mp4', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue().catch(() => {});
    });
    await skipPage.goto('http://127.0.0.1:5197', { waitUntil: 'domcontentloaded' });
    await skipPage.getByRole('button', { name: 'Enter HexWartz Hackathon', exact: true }).click();
    await skipPage.getByRole('button', { name: 'Skip cinematic prologue' }).click();
    await skipPage.locator('.cinematic-intro-overlay').waitFor({ state: 'detached' });
    await skipPage.waitForTimeout(3500);
    assert.equal(await skipPage.locator('video').count(), 0);
    await skipPage.locator('.landing-hero').waitFor({ state: 'visible' });
    console.log('Skip during buffering passes.');

    const failedPage = await browser.newPage();
    await failedPage.route('**/video/hexwartz-intro.mp4', route => route.fulfill({ status: 503, body: 'Unavailable' }));
    await failedPage.goto('http://127.0.0.1:5197', { waitUntil: 'domcontentloaded' });
    await failedPage.locator('.cinematic-intro-overlay').waitFor({ state: 'detached' });
    await failedPage.locator('.landing-hero').waitFor({ state: 'visible' });
    console.log('Download failure reveals the site.');
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
