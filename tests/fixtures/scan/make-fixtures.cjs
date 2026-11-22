// Builds the small test files for "PDF·사진에서 단어 찾기" (scan-words-browser.cjs):
//   text.pdf     – 1 page with a text layer
//   scanned.pdf  – 1 page that is only an image (no text layer)
//   photo.jpg    – a "photo" of an English sentence (for OCR)
//   pages.pdf    – 3 pages with different text (only the chosen page is read)
//   mixed-photo.jpg – phone-like photo of a Korean page with English sentences
//   korean-cid.pdf  – Korean text in a font that is not embedded (needs PDF.js CMaps)
//   garbled.pdf     – normal-looking English whose character codes are broken (read from the picture)
//   figure.pdf      – text page with a picture whose words are not in the text layer
// Run: CHROMIUM_PATH=<chromium or msedge> node tests/fixtures/scan/make-fixtures.cjs
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

const SENTENCES = [
  'The skin effect increases the resistance of the conductor.',
  'At high frequency the skin effect reduces the area of the conductor.',
  'Power factor correction uses capacitors.'
];
// The English sentences on the Korean textbook page (mixed-photo.jpg).
const MIXED_ENGLISH = [
  'The impedance of an RLC circuit depends on the frequency. At resonance, the inductive reactance equals the capacitive reactance, and the current is maximum.',
  'The power factor is the ratio of real power to apparent power. A low power factor increases line losses.'
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

// Korean document whose font is NOT embedded (like Word/HWP exports): the text uses the
// Adobe-Korea1 character collection with the UniKS-UCS2-H CMap, so PDF.js can only read it
// with its CMap files (www/vendor/pdfjs/cmaps). English terms sit in brackets in Title Case.
const KOREAN_LINES = [
  '전력변환(Power Conversion)은 정류기(Rectifier)와 인버터(Inverter)로 이루어집니다.',
  '커패시터(Capacitor)와 인덕터(Inductor)는 필터(Filter)에 쓰입니다.',
  '임피던스(Impedance)는 리액턴스(Reactance)와 저항(Resistance)으로 구성됩니다.'
];
function koreanCidPdf() {
  const ucs2 = text => '<' + [...text].map(ch => ch.codePointAt(0).toString(16).padStart(4, '0')).join('') + '>';
  // 9 pt: without width data every character counts 1 em wide; longer lines would run off the page.
  const content = KOREAN_LINES.map((line, k) => `BT /K1 9 Tf 30 ${740 - k * 20} Td ${ucs2(line)} Tj ET`).join('\n');
  return pdf([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /K1 5 0 R >> >> /Contents 4 0 R >>',
    stream('', Buffer.from(content)),
    '<< /Type /Font /Subtype /Type0 /BaseFont /HYSMyeongJo-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [6 0 R] >>',
    '<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYSMyeongJo-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> /FontDescriptor 7 0 R /DW 1000 >>',
    '<< /Type /FontDescriptor /FontName /HYSMyeongJo-Medium /Flags 6 /FontBBox [0 -148 1001 880] /ItalicAngle 0 /Ascent 880 /Descent -148 /CapHeight 880 /StemV 60 >>'
  ]);
}

// Broken character codes: the page shows normal English (Helvetica), but the ToUnicode map
// sends every letter to the private use area, so copied text is nonsense (like some HWP
// exports). The app must notice and read the page's picture instead.
const GARBLED_LINES = ['The transformer core uses laminated silicon steel.', 'Hysteresis loss and eddy current loss heat the core.',
  'The primary winding and secondary winding share the flux.'];
function garbledPdf() {
  const toUnicode = Buffer.from(['/CIDInit /ProcSet findresource begin', '12 dict begin', 'begincmap',
    '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def', '/CMapName /Garbled def', '/CMapType 2 def',
    '1 begincodespacerange', '<00> <FF>', 'endcodespacerange', '1 beginbfrange', '<20> <7E> <E020>', 'endbfrange',
    'endcmap', 'CMapName currentdict /CMap defineresource pop', 'end', 'end'].join('\n'));
  const content = GARBLED_LINES.map((line, k) => `BT /F1 16 Tf 50 ${740 - k * 26} Td (${line}) Tj ET`).join('\n');
  return pdf([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    stream('', Buffer.from(content)),
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /ToUnicode 6 0 R >>',
    stream('', toUnicode)
  ]);
}

// A normal text page with a picture (photo.jpg: "The skin effect increases the resistance…")
// that holds words found nowhere in the text layer.
const FIGURE_TEXT = ['Figure 3 shows a measurement of the armature winding.', 'The armature current was recorded at the test bench.'];
function figurePdf(jpeg, width, height) {
  const w = 460, h = Math.round(460 * height / width);
  const text = FIGURE_TEXT.map((line, k) => `BT /F1 13 Tf 60 ${740 - k * 22} Td (${line}) Tj ET`).join('\n');
  return pdf([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> /XObject << /Im1 6 0 R >> >> /Contents 4 0 R >>',
    stream('', Buffer.from(text + `\nq ${w} 0 0 ${h} 76 430 cm /Im1 Do Q`)),
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    stream(`/Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, jpeg)
  ]);
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
    fs.writeFileSync(path.join(out, 'korean-cid.pdf'), koreanCidPdf());
    fs.writeFileSync(path.join(out, 'garbled.pdf'), garbledPdf());
    fs.writeFileSync(path.join(out, 'figure.pdf'), figurePdf(jpeg, 1100, 260));
    // A phone-like photo of a Korean textbook page with English sentences: tilted,
    // shaded paper on a dark desk, slightly blurred. The English OCR model turns the
    // Korean lines into made-up words; only the English words may become candidates.
    const desk = await browser.newPage({viewport: {width: 1200, height: 1600}});
    await desk.setContent(`<body style="margin:0;background:linear-gradient(135deg,#6b5a48,#3d3128)"><div style="position:absolute;left:90px;top:120px;width:1000px;height:1350px;background:linear-gradient(90deg,#f4efe4,#e6dfd0);transform:rotate(-4deg);box-shadow:0 20px 60px #000;padding:60px;box-sizing:border-box;font:28px/1.7 'Malgun Gothic','Noto Sans CJK KR',serif;color:#222;filter:blur(0.8px)">
<h2 style="font-size:40px">제 3 장 교류 회로 (AC Circuits)</h2>
<p>교류 회로에서 임피던스(impedance)는 저항과 리액턴스의 합으로 나타낸다. 유도성 리액턴스는 주파수에 비례한다.</p>
<p>${MIXED_ENGLISH[0]}</p>
<p>예제 3.2 다음 회로의 역률(power factor)을 구하시오. 단, R = 10 Ω, X<sub>L</sub> = 20 Ω 이다.</p>
<p>${MIXED_ENGLISH[1]}</p>
<p style="font-size:22px;color:#555">그림 3-4 직렬 RLC 회로의 페이저도 · 32쪽</p></div></body>`);
    fs.writeFileSync(path.join(out, 'mixed-photo.jpg'), await desk.screenshot({type: 'jpeg', quality: 80}));
    for (const name of ['text.pdf', 'scanned.pdf', 'photo.jpg', 'pages.pdf', 'mixed-photo.jpg', 'korean-cid.pdf', 'garbled.pdf', 'figure.pdf']) {
      console.log(name, fs.statSync(path.join(out, name)).size, 'bytes');
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
