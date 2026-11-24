// One-off: shrinks the photos made by tools/generate-seed-photos.mjs exactly as the app does
// when it saves a photo (www/photo-store.js: longest side 720 px, white background, JPEG 0.78)
// and writes them to www/assets/seed-photos/<termId>.jpg.
// Usage: CHROMIUM_PATH=<browser> node tools/compress-seed-photos.cjs <rawDir>
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

(async () => {
  const rawDir = process.argv[2];
  if (!rawDir) throw new Error('usage: node tools/compress-seed-photos.cjs <rawDir>');
  const outDir = path.join(__dirname, '..', 'www', 'assets', 'seed-photos');
  fs.mkdirSync(outDir, {recursive: true});
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
  const page = await browser.newPage();
  let total = 0, count = 0;
  for (const name of fs.readdirSync(rawDir).sort()) {
    const match = name.match(/^(term_[a-f0-9-]{36})\.(jpg|png|webp)$/);
    if (!match) continue;
    const mimeType = match[2] === 'jpg' ? 'image/jpeg' : 'image/' + match[2];
    const data = fs.readFileSync(path.join(rawDir, name)).toString('base64');
    const jpegBase64 = await page.evaluate(async ({mimeType, data}) => {
      const img = new Image();
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = `data:${mimeType};base64,${data}`; });
      const ratio = Math.min(1, 720 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.78).split(',')[1];
    }, {mimeType, data});
    const bytes = Buffer.from(jpegBase64, 'base64');
    fs.writeFileSync(path.join(outDir, match[1] + '.jpg'), bytes);
    total += bytes.length; count++;
  }
  await browser.close();
  console.log(`${count} photos, ${(total / 1024 / 1024).toFixed(2)} MB in ${outDir}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
