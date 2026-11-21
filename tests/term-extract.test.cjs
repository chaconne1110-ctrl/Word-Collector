// PDF·사진에서 단어 찾기: candidate extraction (www/quick_capture/term-extract.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {extractCandidates, splitSentences} = require('../www/quick_capture/term-extract.js');

const terms = text => extractCandidates(text).map(candidate => candidate.term);
const find = (text, term) => extractCandidates(text).find(candidate => candidate.term === term);

test('common everyday words and grammar words are left out, major terms stay', () => {
  const found = terms('The engineer measured the impedance and the capacitance of the circuit at a high frequency.');
  for (const term of ['impedance', 'capacitance', 'circuit', 'frequency', 'engineer']) assert.ok(found.includes(term), term);
  for (const word of ['the', 'and', 'of', 'at', 'a', 'high']) assert.ok(!found.includes(word), word);
});

test('inflected forms of everyday words are everyday too', () => {
  const found = terms('It causes losses. The area was reduced and the largest values increased quickly.');
  for (const word of ['causes', 'reduced', 'largest', 'increased', 'quickly', 'values']) assert.ok(!found.includes(word), word);
  assert.ok(found.includes('losses') || found.includes('loss'));
});

test('2–3 word phrases that repeat are recognised, with their count', () => {
  const text = 'The skin effect matters. The skin effect grows with frequency. ' +
    'Power factor correction is common. We need power factor correction. The power factor is low.';
  assert.equal(find(text, 'skin effect').count, 2);
  assert.equal(find(text, 'skin effect').kind, 'phrase');
  assert.equal(find(text, 'power factor correction').count, 2);
  assert.equal(find(text, 'power factor').count, 3);
  // Once only and made of everyday words: not a phrase candidate.
  assert.equal(find('The power factor is low.', 'power factor'), undefined);
});

test('a phrase inside a longer phrase with the same count is dropped', () => {
  const text = 'Power factor correction helps. Power factor correction is cheap.';
  const found = terms(text);
  assert.ok(found.includes('power factor correction'));
  assert.ok(!found.includes('power factor') && !found.includes('factor correction'));
});

test('phrases never cross punctuation, numbers or grammar words', () => {
  const found = terms('Use copper, wire and copper; wire. The coil of wire. The coil of wire. Ohm 5 resistor, Ohm 5 resistor.');
  assert.ok(!found.includes('copper wire'));
  assert.ok(!found.includes('coil of wire'));
  assert.ok(!found.includes('ohm resistor'));
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
  const losses = extractCandidates('Core losses heat it. The core loss is measured. Core losses again.')
    .filter(candidate => candidate.kind === 'phrase');
  assert.deepEqual(losses.map(candidate => [candidate.term, candidate.count]), [['core loss', 3]]);
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

test('links, e-mail addresses, noise without vowels and Korean text give no candidates', () => {
  const found = terms('See https://example.com/impedance or me@example.com. Tbl rhythm 전류와 전압.');
  assert.deepEqual(found, ['rhythm']);
  assert.deepEqual(extractCandidates(''), []);
  assert.deepEqual(extractCandidates(null), []);
});

test('candidates are sorted by count, phrases first on ties', () => {
  const list = extractCandidates('Skin effect and inductance. Skin effect again. Inductance again. Rotor.');
  assert.deepEqual(list.map(candidate => [candidate.term, candidate.count]),
    [['skin effect', 2], ['effect', 2], ['inductance', 2], ['rotor', 1]]);
});

test('the scan page keeps the file local: no upload, no storage of the full text', () => {
  const scan = fs.readFileSync('www/quick_capture/scan.js', 'utf8');
  assert.doesNotMatch(scan, /fetch\(|XMLHttpRequest|localStorage/);
  assert.match(scan, /cacheMethod: 'none'/);
  // Only the picked words and their sentences are handed to the input page.
  assert.match(scan, /words = \[\.\.\.selected\][\s\S]*term: candidates\[index\]\.term[\s\S]*sentence: candidates\[index\]\.sentence/);
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
