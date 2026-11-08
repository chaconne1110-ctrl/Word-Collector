const {test} = require('node:test');
const assert = require('node:assert/strict');
const {toRows, toXlsx, toCsv} = require('../www/word-export.js');
const fixture = () => ({courses: {em: ['전자기학', 'EM']}, terms: {
  a: {course: 'em', en: '=HYPERLINK("x")', ko: '와전류 😀', discipline: '전기공학',
    enDef: 'A, "quoted" definition\r\nnext line', koDef: '  공백 <태그> & 기호  ',
    exampleEn: 'A sentence.', exampleKo: '예문 번역', pos: 'noun', originalTerm: '와전류',
    diagram: 'DO_NOT_EXPORT', context: 'DO_NOT_EXPORT', history: 'DO_NOT_EXPORT'}
}});
function entries(bytes) {
  const buffer = Buffer.from(bytes), result = {};
  let offset = 0;
  while (buffer.readUInt32LE(offset) === 0x04034b50) {
    assert.equal(buffer.readUInt16LE(offset + 8), 0, 'ZIP uses portable STORE compression');
    const length = buffer.readUInt32LE(offset + 18), nameLength = buffer.readUInt16LE(offset + 26);
    const extra = buffer.readUInt16LE(offset + 28), start = offset + 30 + nameLength + extra;
    result[buffer.subarray(offset + 30, offset + 30 + nameLength).toString()] = buffer.subarray(start, start + length).toString();
    offset = start + length;
  }
  assert.equal(buffer.readUInt32LE(offset), 0x02014b50);
  return result;
}
test('XLSX is a real OOXML ZIP with text cells, Korean and eight columns', () => {
  const state = fixture(), before = JSON.stringify(state), result = toXlsx(state);
  assert.ok(result.bytes instanceof Uint8Array); assert.equal(result.count, 1);
  const files = entries(result.bytes);
  assert.equal(Object.keys(files).length, 6);
  assert.ok(files['[Content_Types].xml'].includes('spreadsheetml.sheet.main+xml'));
  const sheet = files['xl/worksheets/sheet1.xml'];
  assert.ok(sheet.includes('ref="A1:H2"')); assert.equal((sheet.match(/<c /g) || []).length, 16);
  assert.ok(sheet.includes('t="inlineStr"')); assert.ok(sheet.includes('=HYPERLINK(&quot;x&quot;)'));
  assert.ok(!sheet.includes('<f>')); assert.ok(sheet.includes('와전류 😀'));
  assert.ok(sheet.includes('&#13;\n')); assert.ok(sheet.includes('  공백 &lt;태그&gt; &amp; 기호  '));
  assert.ok(!sheet.includes('DO_NOT_EXPORT')); assert.equal(JSON.stringify(state), before);
});
test('Both formats use the same eight fields with blank handling and course filtering', () => {
  const state = fixture();
  assert.equal(toRows(state, '', 'basic')[1][3], '전자기학');
  assert.equal(toRows(state, '', 'ai')[1][0], '와전류');
  assert.equal(toRows(state, '', 'ai')[1][3], 'noun');
  delete state.terms.a.originalTerm;
  assert.equal(toRows(state, '', 'ai')[1][0], '');
  assert.equal(toXlsx(state, 'other').count, 0); assert.equal(toCsv(state, 'other').count, 0);
  assert.ok(entries(toXlsx({courses: {}, terms: {}}).bytes)['xl/worksheets/sheet1.xml'].includes('A1:H1'));
});
test('Unsupported or overlong XLSX text fails without truncating or changing storage', () => {
  const state = fixture(); state.terms.a.ko = 'x'.repeat(32768);
  assert.throws(() => toXlsx(state), /32,767/); assert.equal(state.terms.a.ko.length, 32768);
  state.terms.a.ko = 'a\u0000b'; assert.throws(() => toXlsx(state), /제어 문자/);
  state.terms.a.ko = {}; assert.throws(() => toRows(state), /문자열/);
  assert.throws(() => toXlsx(null)); assert.throws(() => toRows(fixture(), '', 'invalid'));
});
