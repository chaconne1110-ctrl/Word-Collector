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
    assert.deepEqual([s.terms.old.exampleSource, s.terms.old.exampleEn, s.terms.old.exampleKo],
      ['reference', 'The voltage across R is 6 V.', 'R 양단 전압은 6V이다.'], 'stored like newer words once edited');
    // 4) Clearing the legacy example never brings the hidden generated example back.
    await editTab.evaluate(key => { const s = JSON.parse(localStorage.getItem(key));
      s.terms.old2 = {course: 'book', en: 'power', ko: '전력', enDef: 'Rate of energy.', koDef: '에너지율.', exampleEn: 'Hidden generated example.', exampleKo: '숨은 예문.',
        referenceSentence: 'The power is 10 W.', referenceTranslation: '전력은 10W이다.'}; localStorage.setItem(key, JSON.stringify(s)); }, KEY);
    await editTab.goto(base + '/edit.html?term=old2');
    await editTab.fill('#exampleSentenceEn', '');
    await editTab.fill('#exampleSentenceKo', '');
    await editTab.click('button[aria-label="단어 변경사항 저장"]');
    await editTab.waitForURL('**/flashcard.html**');
    await editTab.locator('.card-back').first().waitFor({state: 'attached'});
    assert.ok(!(await editTab.locator('.card-back').first().textContent()).includes('Hidden generated example.'), 'old example not shown');
    // 4b) Typing an example again after emptying it shows it on the card.
    await editTab.goto(base + '/edit.html?term=old2');
    await editTab.fill('#exampleSentenceEn', 'The power is 20 W.');
    await editTab.fill('#exampleSentenceKo', '전력은 20W이다.');
    await editTab.click('button[aria-label="단어 변경사항 저장"]');
    await editTab.waitForURL('**/flashcard.html**');
    await editTab.locator('.card-back').first().waitFor({state: 'attached'});
    const example = editTab.locator('.card-back [data-field="exampleEn"]').first();
    assert.equal((await example.textContent()).trim(), 'The power is 20 W.');
    assert.equal(await example.evaluate(node => node.parentElement.hidden), false, 'example box shown again');
    // 4d) Words built from an English or a Korean reference sentence: empty the example,
    // type a new one, and the card shows the new one (not the original reference sentence).
    for (const [id, reference, translation] of [['refEn', 'The field is 3 T.', '자기장은 3T이다.'], ['refKo', '자기장은 3T이다.', 'The field is 3 T.']]) {
      await editTab.evaluate(([key, id, reference, translation]) => { const s = JSON.parse(localStorage.getItem(key));
        s.terms[id] = {course: 'book', en: 'field', ko: '자기장', enDef: 'Region of force.', koDef: '힘이 미치는 영역.', exampleSource: 'reference',
          exampleEn: 'The field is 3 T.', exampleKo: '자기장은 3T이다.', referenceSentence: reference, referenceTranslation: translation};
        localStorage.setItem(key, JSON.stringify(s)); }, [KEY, id, reference, translation]);
      for (const [en, ko] of [['', ''], ['The field is 5 T.', '자기장은 5T이다.']]) {
        await editTab.goto(base + '/edit.html?term=' + id);
        await editTab.fill('#exampleSentenceEn', en);
        await editTab.fill('#exampleSentenceKo', ko);
        await editTab.click('button[aria-label="단어 변경사항 저장"]');
        await editTab.waitForURL('**/flashcard.html**');
      }
      await editTab.locator('.card-back').first().waitFor({state: 'attached'});
      const shown = editTab.locator('.card-back [data-field="exampleEn"]').first();
      assert.equal((await shown.textContent()).trim(), 'The field is 5 T.', id + ': new example shown');
      assert.equal((await editTab.locator('.card-back [data-field="exampleKo"]').first().textContent()).trim(), '자기장은 5T이다.', id);
      assert.equal(await shown.evaluate(node => node.parentElement.hidden), false, id);
    }
    // 4c) Delete on an edit page whose word was deleted in another tab: notice, no error.
    await editTab.goto(base + '/edit.html?term=old2');
    await otherTab.evaluate(key => { const s = JSON.parse(localStorage.getItem(key)); delete s.terms.old2; localStorage.setItem(key, JSON.stringify(s)); }, KEY);
    const notices = []; const onDialog = dialog => { notices.push(dialog.message()); dialog.accept(); };
    editTab.on('dialog', onDialog);
    await editTab.click('button[aria-label="단어 삭제"]');
    await editTab.waitForURL('**/words.html**');
    editTab.off('dialog', onDialog);
    assert.deepEqual(notices, ['이 단어는 다른 화면에서 삭제되었습니다.']);
    // 5) The same word edited in two tabs: each tab writes only what it changed.
    const tabA = editTab, tabB = otherTab;
    await tabA.goto(base + '/edit.html?term=t2');
    await tabB.goto(base + '/edit.html?term=t2');
    await tabA.fill('#englishDefArea', 'Opposition to current.');
    await tabA.click('button[aria-label="단어 변경사항 저장"]');
    await tabA.waitForURL('**/flashcard.html**');
    await tabB.fill('#koreanTermInput', '저항(抵抗)');
    await tabB.click('button[aria-label="단어 변경사항 저장"]');
    await tabB.waitForURL('**/flashcard.html**');
    s = await read(tabB);
    assert.deepEqual([s.terms.t2.enDef, s.terms.t2.ko], ['Opposition to current.', '저항(抵抗)'], 'both tabs\' changes kept');
    // 6) Bookmarking a word deleted in another tab stores nothing invalid; backup stays possible.
    await tabA.goto(base + '/flashcard.html?term=t2');
    await tabA.locator('.card-back').first().waitFor({state: 'attached'});
    await tabB.evaluate(key => { const s = JSON.parse(localStorage.getItem(key)); delete s.terms.t2; s.saved = s.saved.filter(id => id !== 't2'); localStorage.setItem(key, JSON.stringify(s)); }, KEY);
    tabA.once('dialog', dialog => dialog.accept());
    await tabA.evaluate(() => toggleBookmark('t2'));
    s = await read(tabB);
    assert.ok(!s.saved.includes('t2') && s.saved.every(id => s.terms[id]), 'no bookmark for a deleted word');
    await tabB.goto(base + '/backup.html');
    await tabB.waitForTimeout(400);
    assert.equal(await tabB.locator('#export').isDisabled(), false, 'JSON backup still possible');
    assert.deepEqual(errors, []);
    console.log('PASS: edit save/delete keep notebooks, words and bookmarks from another tab; legacy reference sentences are edited where the card shows them.');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
