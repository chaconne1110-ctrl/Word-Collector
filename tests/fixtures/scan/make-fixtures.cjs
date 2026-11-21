// Builds the small test files for "PDF·사진에서 단어 찾기" (scan-words-browser.cjs):
//   text.pdf     – 1 page with a text layer
//   scanned.pdf  – 1 page that is only an image (no text layer)
//   photo.jpg    – a "photo" of an English sentence (for OCR)
//   pages.pdf    – 3 pages with different text (only the chosen page is read)
// Run: CHROMIUM_PATH=<chromium or msedge> node tests/fixtures/scan/make-fixtures.cjs
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

const SENTENCES = [
  'The skin effect increases the resistance of the conductor.',
  'At high frequency the skin effect reduces the area of the conductor.',
  'Power factor correction uses capacitors.'
];

function pdf(objects) {
  // objects: array of Buffer|string bodies, numbered from 1. Object 1 must be the catalog.
  const parts = [Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', 'binary')];
  const offsets = [];
  let length = parts[0].length;
  objects.forEach((body, i) => {
    offsets.push(length);
    const chunk = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), Buffer.isBuffer(body) ? body : Buffer.from(body, 'binary'), Buffer.from('\nendobj\n')]);
    parts.push(chunk);
    length += chunk.length;
  });
  const xref = ['xref', `0 ${objects.length + 1}`, '0000000000 65535 f ',
    ...offsets.map(offset => String(offset).padStart(10, '0') + ' 00000 n '), 'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`, 'startxref', String(length), '%%EOF', ''].join('\n');
  parts.push(Buffer.from(xref));
  return Buffer.concat(parts);
}
const stream = (dict, data) => Buffer.concat([Buffer.from(`<< ${dict} /Length ${data.length} >>\nstream\n`), data, Buffer.from('\nendstream')]);

function textPdf() {
  const lines = SENTENCES.map((line, i) => `BT /F1 14 Tf 50 ${740 - i * 24} Td (${line}) Tj ET`).join('\n');
  return pdf([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    stream('', Buffer.from(lines)),
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ]);
}

// One text page per entry of PAGES.
const PAGES = [
  ['Page one is about the skin effect in a conductor.'],
  ['The hysteresis loop shows the hysteresis loss of the core.', 'A wide hysteresis loop means a large loss.'],
  ['The armature winding carries the armature current.', 'Each armature winding is insulated.']
];
function pagesPdf() {
  const count = PAGES.length;
  const kids = PAGES.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', `<< /Type /Pages /Kids [${kids}] /Count ${count} >>`];
  const font = 3 + count * 2;
  PAGES.forEach((lines, i) => {
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${4 + i * 2} 0 R >>`);
    objects.push(stream('', Buffer.from(lines.map((line, k) => `BT /F1 14 Tf 50 ${740 - k * 24} Td (${line}) Tj ET`).join('\n'))));
  });
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  return pdf(objects);
}

function scannedPdf(jpeg, width, height) {
  const w = 612, h = Math.round(612 * height / width);
  return pdf([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>`,
    stream('', Buffer.from(`q ${w} 0 0 ${h} 0 0 cm /Im1 Do Q`)),
    stream(`/Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, jpeg)
  ]);
}

(async () => {
  const out = __dirname;
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport: {width: 1100, height: 260}});
    await page.setContent(`<body style="margin:0;background:#fff"><div style="padding:30px 40px;font:32px/1.5 Arial,sans-serif;color:#111">${SENTENCES.join('<br>')}</div></body>`);
    const jpeg = await page.screenshot({type: 'jpeg', quality: 85});
    fs.writeFileSync(path.join(out, 'photo.jpg'), jpeg);
    fs.writeFileSync(path.join(out, 'scanned.pdf'), scannedPdf(jpeg, 1100, 260));
    fs.writeFileSync(path.join(out, 'text.pdf'), textPdf());
    fs.writeFileSync(path.join(out, 'pages.pdf'), pagesPdf());
    for (const name of ['text.pdf', 'scanned.pdf', 'photo.jpg', 'pages.pdf']) {
      console.log(name, fs.statSync(path.join(out, name)).size, 'bytes');
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
