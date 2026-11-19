// "참고 자료" page: every registered source (rag/sources.json) is listed with its
// author, licence and link; the page is up to date with the generator; the person
// icon on home, bookmarks and export opens it.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('references page lists every registered source and matches the generator', async () => {
  const {render, registered} = await import('../rag/build-references.mjs');
  const html = fs.readFileSync('www/references.html', 'utf8');
  const lf = text => text.replace(/\r\n/g, '\n');
  assert.equal(lf(html), lf(render()), 'run: node rag/build-references.mjs');
  const sources = registered();
  assert.equal(sources.length, 20);
  for (const s of sources) {
    assert.match(html, new RegExp(`data-source-id="${s.id}"`), s.id);
    const esc = String(s.license).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    assert.ok(html.includes(esc), s.id + ' licence');
  }
  // Sources that are not registered are not listed.
  for (const id of ['lehtonen-power-generation-ch8', 'openstax-university-physics-2']) assert.doesNotMatch(html, new RegExp(id));
  assert.match(html, /<h1>참고 자료<\/h1>/);
  assert.match(fs.readFileSync('www/sw.js', 'utf8'), /"references\.html",/);
});

test('the person icon opens 참고 자료', () => {
  for (const [file, href] of [['www/index.html', 'references.html'], ['www/bookmarks.html', 'references.html'], ['www/_6/code.html', '../references.html']]) {
    assert.match(fs.readFileSync(file, 'utf8'), new RegExp(`<a href="${href.replace(/\./g, '\.')}" aria-label="참고 자료"[^>]*><span[^>]*>person</span></a>`), file);
  }
});

test('flashcard back: no "AI 예문 및 시각화 도해" or "word · 예문" title; word lists hide related words', () => {
  const card = fs.readFileSync('www/flashcard.html', 'utf8');
  assert.doesNotMatch(card, /AI 예문 및 시각화 도해/);
  const app = fs.readFileSync('www/app.js', 'utf8');
  assert.doesNotMatch(app, /backTitle/);
  // Position shown once (top bar); the word sits next to the ⚡ icon on both faces.
  assert.doesNotMatch(card, /data-field="counter"|data-field="backTitle"/);
  assert.equal((card.match(/electric_bolt<\/span>\r?\n<h2 [^>]*data-field="en"/g) || []).length, 12);
  assert.match(app, /\$\$\('\[data-field="related"\]', row\)\.forEach\(chip => \{ chip\.hidden = true; \}\);/);
});

test('edit screen: no placeholder labels, sync/draft notes, footer or memorise button', () => {
  const edit = fs.readFileSync('www/edit.html', 'utf8');
  for (const removed of ['(플래시카드)', 'FLASHCARD #EDIT MODE', '8대 표준 학술 용어 체계', '즉시 동기화됩니다', '항목 1-2', '항목 3-4', '항목 5-7',
    'ENG-EE', 'EE-CIR-204', 'CONTEXT READY', '대한전기학회 표준', '저장 버튼을 눌러 변경 내용을 적용하세요', 'REV. 05', 'DRAFT SAFE',
    '플래시카드로 열기 (암기 모드)', 'Lexicon Precision']) assert.ok(!edit.includes(removed), removed);
  // The fields and the save/delete actions stay.
  for (const id of ['disciplineInput', 'subjectSelect', 'englishTermInput', 'koreanTermInput', 'englishDefArea', 'koreanDefArea', 'exampleSentenceEn', 'exampleSentenceKo'])
    assert.match(edit, new RegExp(`id="${id}"`), id);
  assert.match(edit, /onclick="saveTermChanges\(\)"/);
  assert.match(edit, /onclick="openDeleteModal\(\)"/);
});
