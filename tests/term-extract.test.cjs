// PDF·사진에서 단어 찾기: candidate extraction (www/quick_capture/term-extract.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {extractCandidates, splitSentences} = require('../www/quick_capture/term-extract.js');

const terms = (text, mode) => extractCandidates(text, mode ? {mode} : undefined).map(candidate => candidate.term);
const find = (text, term, mode) => extractCandidates(text, mode ? {mode} : undefined).find(candidate => candidate.term === term);

test('모든 단어 (default): every English word except grammar words', () => {
  const found = terms('The engineer measured the impedance and the area of the circuit at a high frequency.');
  for (const term of ['engineer', 'measured', 'impedance', 'area', 'circuit', 'high', 'frequency']) assert.ok(found.includes(term), term);
  for (const word of ['the', 'and', 'of', 'at', 'a']) assert.ok(!found.includes(word), word);
});

test('전공용어 위주: everyday words and their inflected forms are left out too', () => {
  const text = 'It causes losses. The area was reduced and the largest values increased quickly at high impedance.';
  const found = terms(text, 'major');
  for (const word of ['causes', 'reduced', 'largest', 'increased', 'quickly', 'values', 'area', 'high']) assert.ok(!found.includes(word), word);
  assert.ok(found.includes('impedance') && found.includes('losses'));
  // The same words are all there in 모든 단어.
  for (const word of ['causes', 'reduced', 'largest', 'area', 'high', 'impedance']) assert.ok(terms(text).includes(word), word);
});

test('only single words: no 2–3 word phrases', () => {
  const text = 'The skin effect matters. The skin effect grows. Power factor correction is common.';
  for (const mode of ['all', 'major']) {
    const found = extractCandidates(text, {mode});
    assert.ok(found.every(candidate => !/\s/.test(candidate.term)), mode + ': ' + found.map(c => c.term));
  }
  assert.equal(find(text, 'skin').count, 2);
  assert.equal(find(text, 'effect').count, 2);
});

test('contractions, short words and letter runs without a vowel are never candidates', () => {
  const found = terms("Don't touch it. We can't go. An ox ran by. Tbl xyz rhythm.");
  for (const word of ["don't", "can't", 'ox', 'by', 'tbl']) assert.ok(!found.includes(word), word);
  assert.ok(found.includes('touch') && found.includes('rhythm'));
});

test('words broken by a hyphen at a line end are joined; hyphenated compounds stay whole', () => {
  const found = terms('The induc-\ntance of the coil and the cross-sectional area of the conduc-\n  tor.');
  assert.ok(found.includes('inductance'));
  assert.ok(found.includes('conductor'));
  assert.ok(found.includes('cross-sectional'));
  assert.ok(!found.includes('induc') && !found.includes('tance'));
});

test('a line break inside a sentence does not split it; a blank line does', () => {
  assert.deepEqual(splitSentences('The rotor turns\nin the field.\n\nNext paragraph here'),
    ['The rotor turns in the field.', 'Next paragraph here']);
});

test('duplicates are merged: case, plural forms and possessives', () => {
  const text = 'Transistors switch fast. A transistor amplifies. The Transistor is small. The transistor\'s gate.';
  const found = extractCandidates(text).filter(candidate => /transistor/.test(candidate.term));
  assert.equal(found.length, 1);
  assert.equal(found[0].term, 'transistor');
  assert.equal(found[0].count, 4);
  assert.equal(find('Batteries die. A battery lasts. Boxes and a box.', 'battery').count, 2);
  assert.equal(find('Batteries die. A battery lasts. Boxes and a box.', 'box').count, 2);
});

test('acronyms keep capitals; names keep a capital only when written with one mid-sentence', () => {
  const found = terms('The MOSFETs and the MOSFET switch. Use an IGBT here. Capacitors store charge. We cite Faraday here.');
  assert.ok(found.includes('MOSFET'));
  assert.ok(found.includes('IGBT'));
  assert.ok(found.includes('capacitors'));
  assert.ok(found.includes('Faraday'));
});

test('each candidate keeps the first sentence it appears in (≤ 600 characters, around the word)', () => {
  const text = 'Eddy currents heat the core. Eddy currents are reduced by laminations.';
  assert.equal(find(text, 'laminations').sentence, 'Eddy currents are reduced by laminations.');
  const long = 'Filler words go here. '.repeat(40).trim().replace(/\.$/, '') + ' and finally the hysteresis loop appears.';
  const candidate = find(long, 'hysteresis');
  assert.ok(candidate.sentence.length <= 600);
  assert.ok(candidate.sentence.includes('hysteresis'));
});

test('links, e-mail addresses and Korean text give no candidates', () => {
  assert.deepEqual(terms('See https://example.com/impedance or me@example.com. 전류와 전압.'), ['see']);
  assert.deepEqual(extractCandidates(''), []);
  assert.deepEqual(extractCandidates(null), []);
});

test('candidates are sorted by count, then alphabetically', () => {
  const list = extractCandidates('Rotor and stator. Stator again. Stator here. Rotor too.');
  assert.deepEqual(list.map(candidate => [candidate.term, candidate.count]),
    [['stator', 3], ['rotor', 2], ['again', 1]]);   // "here", "and", "too" are grammar words
});

test('the scan page keeps the file local: no upload, no storage of the full text', () => {
  const scan = fs.readFileSync('www/quick_capture/scan.js', 'utf8');
  assert.doesNotMatch(scan, /fetch\(|XMLHttpRequest|localStorage/);
  assert.match(scan, /cacheMethod: 'none'/);
  // Only the picked words and their sentences are handed to the input page.
  assert.match(scan, /const words = \[\.\.\.selected\.values\(\)\]\.map\(pick => \(\{\s*term: pick\.term\.slice\(0, 120\),\s*sentence: pick\.sentence\.slice\(0, 600\)\s*\}\)\)/);
  // OCR keeps only confidently recognised words.
  assert.match(scan, /MIN_WORD_CONFIDENCE = 85/);
  for (const file of ['quick_capture/scan.html', 'quick_capture/scan.js', 'quick_capture/term-extract.js', 'licenses.html']) {
    assert.match(fs.readFileSync('www/sw.js', 'utf8'), new RegExp('"' + file.replace('.', '\\.') + '",'));
  }
});

test('bundled libraries have their licence files and are listed on the licence page', () => {
  for (const file of ['www/vendor/pdfjs/LICENSE.txt', 'www/vendor/tesseract/LICENSE-tesseract.js.txt',
    'www/vendor/tesseract/LICENSE-tesseract.js-core.txt']) {
    assert.match(fs.readFileSync(file, 'utf8'), /Apache License\s+Version 2\.0/);
  }
  const page = fs.readFileSync('www/licenses.html', 'utf8');
  for (const name of ['PDF.js', 'Tesseract.js', 'tesseract.js-core', 'eng.traineddata']) assert.ok(page.includes(name), name);
  for (const file of ['pdfjs/pdf.min.js', 'pdfjs/pdf.worker.min.js', 'tesseract/tesseract.min.js', 'tesseract/worker.min.js',
    'tesseract/tesseract-core-lstm.js', 'tesseract/tesseract-core-lstm.wasm', 'tesseract/tesseract-core-simd-lstm.js',
    'tesseract/tesseract-core-simd-lstm.wasm', 'tesseract/lang/eng.traineddata.gz']) {
    assert.ok(fs.existsSync('www/vendor/' + file), file);
  }
});
