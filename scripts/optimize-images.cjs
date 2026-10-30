// Run with NODE_PATH pointing to a Sharp installation. Originals remain available for pixel verification.
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const sharp = require('sharp');

(async () => {
  const sources = ['src/main.jsx', 'src/styles.css'];
  const contents = await Promise.all(sources.map(file => fs.readFile(file, 'utf8')));
  const paths = [...new Set(contents.flatMap(text => [...text.matchAll(/\/assets\/[^'"`\n]+?\.(?:png|webp)/g)].map(match => match[0])))];
  let before = 0;
  let after = 0;
  for (const url of paths) {
    const original = `public${decodeURIComponent(url).replace(/\.webp$/, '.png')}`;
    try { await fs.access(original); } catch (error) {
      if (url.endsWith('.webp') && error.code === 'ENOENT') continue; // Generated WebP assets may have no PNG source in public/.
      throw error;
    }
    const optimized = original.replace(/\.png$/, '.webp');
    await sharp(original).webp({ lossless: true, effort: 6 }).toFile(optimized);
    const [a, b] = await Promise.all([sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true }), sharp(optimized).ensureAlpha().raw().toBuffer({ resolveWithObject: true })]);
    assert.equal(a.info.width, b.info.width);
    assert.equal(a.info.height, b.info.height);
    for (let i = 0; i < a.data.length; i += 4) {
      assert.equal(a.data[i + 3], b.data[i + 3], `${url}: alpha changed`);
      if (a.data[i + 3]) assert.ok(a.data.subarray(i, i + 3).equals(b.data.subarray(i, i + 3)), `${url}: visible pixel changed`);
    }
    const originalSize = (await fs.stat(original)).size;
    const optimizedSize = (await fs.stat(optimized)).size;
    before += originalSize;
    after += Math.min(originalSize, optimizedSize);
    if (optimizedSize >= originalSize) { await fs.unlink(optimized); continue; }
    for (let i = 0; i < contents.length; i++) contents[i] = contents[i].replaceAll(url, url.replace(/\.(?:png|webp)$/, '.webp'));
    console.log(`${url}: ${originalSize} -> ${optimizedSize} bytes; visible pixels identical`);
  }
  for (let i = 0; i < sources.length; i++) await fs.writeFile(sources[i], contents[i]);
  console.log(JSON.stringify({ before, after, saved: before - after, percent: Math.round((1 - after / before) * 100) }));
})().catch(error => { console.error(error); process.exitCode = 1; });
