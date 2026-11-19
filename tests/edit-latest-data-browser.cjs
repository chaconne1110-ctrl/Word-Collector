// Saving or deleting on a page that was opened earlier never drops data changed in
// another tab (notebooks, words, bookmarks). Legacy words (example shown from the
// reference sentence) are edited in the field the flashcard actually shows.
const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');
const KEY = 'lexicon-word-collector-v1';
(async () => {
  const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
    const context = await browser.newContext({viewport: {width: 390, height: 844}});
    const editTab = await context.newPage(), otherTab = await context.newPage();
    const errors = []; for (const p of [editTab, otherTab]) p.on('pageerror', e => errors.push(e.message));
    const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    await editTab.goto(base + '/index.html');
    await editTab.evaluate(key => localStorage.setItem(key, JSON.stringify({courses: {book: ['회로이론', '']}, saved: [],
      terms: {t1: {course: 'book', en: 'current', ko: '전류', enDef: 'Flow of charge.', koDef: '전하의 흐름.', exampleEn: 'Generated example.', exampleKo: '생성 예문.'},
        old: {course: 'book', en: 'voltage', ko: '전압', enDef: 'Potential difference.', koDef: '전위차.', exampleEn: 'Generated old example.', exampleKo: '생성된 옛 예문.',
          referenceSentence: 'The voltage across R is 5 V.', referenceTranslation: 'R 양단 전압은 5V이다.'}}})), KEY);
    // 1) Edit page open; another tab creates a notebook and adds a bookmark; then save the edit.
    await editTab.goto(base + '/edit.html?term=t1');
    await otherTab.goto(base + '/index.html');
    await otherTab.evaluate(key => { const s = JSON.parse(localStorage.getItem(key));
      s.courses.nb2 = ['새 단어장', '']; s.terms.t2 = {course: 'nb2', en: 'resistance', ko: '저항'}; s.saved = ['t2'];
      localStorage.setItem(key, JSON.stringify(s)); }, KEY);
    await editTab.fill('#koreanTermInput', '전류(電流)');
    await editTab.click('button[aria-label="단어 변경사항 저장"]');
    await editTab.waitForURL('**/flashcard.html**');
    let s = await read(editTab);
    assert.equal(s.terms.t1.ko, '전류(電流)', 'edit saved');
    assert.deepEqual(s.courses.nb2, ['새 단어장', ''], 'notebook made in the other tab is kept');
    assert.equal(s.terms.t2?.en, 'resistance', 'word added in the other tab is kept');
    assert.deepEqual(s.saved, ['t2'], 'bookmark made in the other tab is kept');
    // 2) Delete on an old edit page keeps another tab's new notebook.
    await editTab.goto(base + '/edit.html?term=t1');
    await otherTab.evaluate(key => { const s = JSON.parse(localStorage.getItem(key)); s.courses.nb3 = ['세 번째', '']; localStorage.setItem(key, JSON.stringify(s)); }, KEY);
    await editTab.evaluate(() => confirmDelete());
    await editTab.waitForURL('**/words.html**');
    s = await read(editTab);
    assert.equal(s.terms.t1, undefined, 'word deleted');
    assert.deepEqual(s.courses.nb3, ['세 번째', ''], 'notebook made in the other tab is kept after delete');
    // 3) Legacy word: the editor shows and edits the reference sentence the card shows.
    await editTab.goto(base + '/edit.html?term=old');
    assert.equal(await editTab.inputValue('#exampleSentenceEn'), 'The voltage across R is 5 V.');
    assert.equal(await editTab.inputValue('#exampleSentenceKo'), 'R 양단 전압은 5V이다.');
    await editTab.fill('#exampleSentenceEn', 'The voltage across R is 6 V.');
    await editTab.fill('#exampleSentenceKo', 'R 양단 전압은 6V이다.');
    await editTab.click('button[aria-label="단어 변경사항 저장"]');
    await editTab.waitForURL('**/flashcard.html**');
    await editTab.locator('.card-back').first().waitFor({state: 'attached'});
    const back = await editTab.locator('.card-back').first().textContent();
    assert.ok(back.includes('The voltage across R is 6 V.') && back.includes('R 양단 전압은 6V이다.'), 'the card shows the edited sentence');
    s = await read(editTab);
    assert.equal(s.terms.old.exampleEn, 'Generated old example.', 'the hidden generated example is not overwritten');
    assert.deepEqual(errors, []);
    console.log('PASS: edit save/delete keep notebooks, words and bookmarks from another tab; legacy reference sentences are edited where the card shows them.');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
