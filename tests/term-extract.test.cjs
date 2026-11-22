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

test('전공용어 위주: the ~3,900 most common English words (SCOWL size 10) are everyday too', () => {
  const text = 'The background noise in the measured signal was reduced by the engineer. ' +
    'Current flows through the semiconductor junction when a forward bias voltage is applied. ' +
    'Touch the electrode carefully. The plasmonic effect enhances absorption in graphene.';
  const major = terms(text, 'major');
  for (const word of ['background', 'measured', 'engineer', 'reduced', 'flows', 'forward', 'applied', 'touch', 'carefully']) {
    assert.ok(!major.includes(word), word + ' is everyday');
    assert.ok(terms(text).includes(word), word + ' is still in 모든 단어');
  }
  // Everyday words that are basic electrical/semiconductor terms stay.
  for (const word of ['current', 'noise', 'signal', 'voltage', 'bias', 'junction', 'semiconductor', 'electrode',
    'plasmonic', 'graphene', 'absorption']) {
    assert.ok(major.includes(word), word + ' kept');
  }
  assert.ok(terms('Charges move. The charged plate. Currents flow.', 'major').includes('charges'), 'inflected forms of kept words stay');
});

test('the everyday list ships with the app and its licence notice', () => {
  const words = require('../www/quick_capture/common-words.js');
  assert.ok(words.length > 3500 && words.includes('background') && !words.includes('plasmonic'));
  assert.match(fs.readFileSync('www/vendor/scowl/Copyright.txt', 'utf8'), /Kevin Atkinson/);
  assert.match(fs.readFileSync('www/licenses.html', 'utf8'), /SCOWL[\s\S]*vendor\/scowl\/Copyright\.txt/);
  const scan = fs.readFileSync('www/quick_capture/scan.html', 'utf8');
  assert.ok(scan.indexOf('common-words.js') > 0 && scan.indexOf('common-words.js') < scan.indexOf('term-extract.js'));
  assert.match(fs.readFileSync('www/sw.js', 'utf8'), /"quick_capture\/common-words\.js",/);
});

test('2–3 word terms that appear at least twice are candidates, with their count', () => {
  const text = 'The plasmonic effect matters. The plasmonic effect grows with light. ' +
    'Power factor correction is common. We need power factor correction. The power factor is low.';
  for (const mode of ['all', 'major']) {
    assert.equal(find(text, 'plasmonic effect', mode).count, 2, mode);
    assert.equal(find(text, 'plasmonic effect', mode).kind, 'phrase');
    assert.equal(find(text, 'power factor correction', mode).count, 2, mode);
    assert.equal(find(text, 'power factor', mode).count, 3, mode);
  }
  // The single words stay too.
  assert.equal(find(text, 'plasmonic').count, 2);
  assert.equal(find(text, 'plasmonic').kind, 'word');
  // Once only: not a phrase candidate.
  assert.equal(find('The dark current is small.', 'dark current'), undefined);
});

test('a phrase inside a longer phrase with the same count is dropped', () => {
  const found = terms('Power factor correction helps. Power factor correction is cheap.');
  assert.ok(found.includes('power factor correction'));
  assert.ok(!found.includes('power factor') && !found.includes('factor correction'));
});

test('phrases never cross punctuation, numbers, grammar words or an unreadable word (…)', () => {
  const found = terms('Use copper, wire and copper; wire. The coil of wire. The coil of wire. ' +
    'Ohm 5 resistor, Ohm 5 resistor. Dark … current here. Dark … current there.');
  for (const phrase of ['copper wire', 'coil of wire', 'coil wire', 'ohm resistor', 'dark current']) {
    assert.ok(!found.includes(phrase), phrase);
  }
});

test('repeated phrases of everyday words stay in 전공용어 위주 (they can be terms)', () => {
  const text = 'The dark current is small. The dark current grows. The power factor is low. The power factor rises.';
  for (const phrase of ['dark current', 'power factor']) assert.ok(terms(text, 'major').includes(phrase), phrase);
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

test('English terms written in Title Case inside Korean text stay lower case (not names)', () => {
  const text = '전력변환(Power Conversion)은 정류기(Rectifier)와 인버터(Inverter)를 씁니다. 저항(Resistance)과 MOSFET(Metal-Oxide-Semiconductor Field-Effect Transistor). ' +
    '옴의 법칙(Ohm’s Law)과 Faraday 법칙.';
  const found = terms(text);
  for (const word of ['power', 'conversion', 'rectifier', 'inverter', 'resistance', 'transistor']) assert.ok(found.includes(word), word + ' in ' + found);
  assert.ok(found.includes('MOSFET'));
  assert.ok(found.includes('Faraday'), 'a lone capitalised word mid-sentence is still a name');
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

test('candidates are sorted by count, phrases first on ties, then alphabetically', () => {
  const list = extractCandidates('Skin effect and inductance. Skin effect again. Inductance here.');
  assert.deepEqual(list.slice(0, 4).map(candidate => candidate.term), ['skin effect', 'effect', 'inductance', 'skin']);
});

test('single words are sorted by count, then alphabetically', () => {
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

test('OCR repair: cut-off words are restored, stray short pieces dropped, real terms kept', () => {
  const {repairOcrText} = require('../www/quick_capture/term-extract.js');
  const dictionary = require('../www/quick_capture/english-words.js');
  const fix = text => repairOcrText(text, dictionary);
  // Letters cut at the start or end of a dictionary word.
  assert.equal(fix('The apacitance of the emical vapor deposition.'), 'The capacitance of the chemical vapor deposition.');
  assert.equal(fix('High oltage here.'), 'High voltage here.');
  // A piece that fits several words equally is dropped; unknown 3-letter pieces too.
  assert.doesNotMatch(fix('the ent ina side'), /\bent\b|\bina\b/);
  // One letter misread: fixed only to a word found elsewhere in the same text.
  assert.equal(fix('Thermal noise and shot hoise.'), 'Thermal noise and shot noise.');
  assert.equal(fix('A hoise here.'), 'A hoise here.', 'no guess without the word in the text');
  // Real terms missing from the dictionary, acronyms, mixed case and short words stay.
  const terms = 'The plasmonic effect in graphene, the Schottky barrier, MOSFET, ZnO, photodiode, bandgap, snubber, dopant and a big I.';
  assert.equal(fix(terms), terms);
  assert.equal(fix('cross-sectional area'), 'cross-sectional area');
  // Without a dictionary the text is unchanged.
  assert.equal(repairOcrText('apacitance', []), 'apacitance');
});
