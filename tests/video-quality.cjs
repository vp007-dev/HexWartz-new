// Compare the displayed video with its decoded frame using the existing PNG tooling.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { PNG } = require('pngjs');
const { chromium } = require('playwright');

(async () => {
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5196', '--strictPort'], { stdio: 'pipe' });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      server.stdout.on('data', data => { if (data.toString().includes('Local:')) resolve(); });
      server.once('error', reject);
      server.once('exit', code => reject(new Error(`Vite exited: ${code}`)));
    });
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://127.0.0.1:5196');
    await page.getByRole('button', { name: 'Enter HexWartz Hackathon', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('video')?.currentTime >= 1.2);
    await page.locator('video').evaluate(video => video.pause());
    const clip = { x: 80, y: 120, width: 1200, height: 650 };
    const displayed = await page.screenshot({ clip });
    const source = await page.locator('video').evaluate(video => {
      const canvas = document.createElement('canvas');
      canvas.id = 'decoded-video-reference';
      canvas.width = 1920;
      canvas.height = 1080;
      canvas.style.cssText = 'position:fixed;inset:0;z-index:2147483647;width:1920px;height:1080px;pointer-events:none';
      canvas.getContext('2d').drawImage(video, 0, 0, 1920, 1080);
      document.body.append(canvas);
      return { width: video.videoWidth, height: video.videoHeight, time: video.currentTime };
    });
    const reference = await page.screenshot({ clip });
    const a = PNG.sync.read(displayed).data;
    const b = PNG.sync.read(reference).data;
    let difference = 0;
    for (let i = 0; i < a.length; i += 4) {
      difference += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    }
    const meanChannelDifference = difference / (a.length / 4 * 3);
    const directory = path.join(os.tmpdir(), 'hexwartz-video-quality');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, `${process.argv.includes('--inspect') ? 'before' : 'after'}-displayed.png`), displayed);
    fs.writeFileSync(path.join(directory, 'decoded-reference.png'), reference);
    console.log(JSON.stringify({ source, meanChannelDifference, directory }));
    if (!process.argv.includes('--inspect')) {
      assert.ok(meanChannelDifference < 2, 'The page must preserve the decoded video picture without added dimming or rescaling');
      assert.equal(await page.locator('video').evaluate(video => getComputedStyle(video).filter), 'none');
      assert.equal(await page.locator('.cinematic-intro-overlay').evaluate(e => getComputedStyle(e).transform), 'none');
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
