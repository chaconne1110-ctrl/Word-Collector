const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', 'www', file), 'utf8');

test('word input screen: no title, example placeholders, notebook notes or bottom notice', () => {
  const html = read('quick_capture/code.html');
  for (const text of ['학술 용어 수집기', '예: Permittivity', '(예: 전기공학', '예: 회로이론',
    '단어를 저장하면 이 이름의 단어장이', '아직 단어장이 없어요', '원서의 문장이나 논문 패러그래프',
    '분석 페이지에서 결과를 검토한 뒤']) {
    assert.ok(!html.includes(text), text);
  }
  assert.ok(html.includes('placeholder="전공명 또는 학과명"'));
  assert.equal((html.match(/placeholder=/g) || []).length, 1);
});

test('review screen: no note under the new notebook name', () => {
  assert.ok(!read('quick_capture/review.html').includes('이름은 고칠 수 있습니다'));
});

test('flashcard back: no Contextual badge in any template', () => {
  assert.ok(!read('flashcard.html').includes('Contextual'));
});
