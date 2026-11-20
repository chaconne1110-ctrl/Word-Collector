// Home person icon -> 참고 자료 (registered textbooks and papers with licences).
// Flashcard back: no "AI 예문 및 시각화 도해" label and no "word · 예문" title line.
// Related words: hidden in the word list, shown on the flashcard.
const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');
(async () => {
  const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/index.html');
    await page.evaluate(() => localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({courses: {book: ['회로이론', '']},
      terms: {t1: {course: 'book', en: 'current', ko: '전류', pron: '명사', enDef: 'Flow of charge.', koDef: '전하의 흐름.',
        exampleEn: 'The current is 2 A.', exampleKo: '전류는 2A이다.', related: 'voltage\nresistance', discipline: '전기공학'}}, saved: []})));
    // 참고 자료 from the home screen's person icon.
    await page.goto(base + '/index.html');
    await page.locator('a[aria-label="참고 자료"]').click();
    await page.waitForURL('**/references.html');
    assert.equal(await page.locator('h1').textContent(), '참고 자료');
    assert.equal(await page.locator('.ref').count(), 23, '20 textbooks/papers + 3 Korean dictionaries');
    const text = await page.locator('main').textContent();
    for (const expected of ['Lessons In Electric Circuits, Volume I - DC', 'Tony R. Kuphaldt', 'CC BY 4.0', 'CC BY-NC-SA 4.0', '전기공학', '반도체', '우리말샘', '온용어', '한국어기초사전', 'CC BY-SA 2.0 KR'])
      assert.ok(text.includes(expected), expected);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal overflow');
    await page.locator('a.back').click();
    await page.waitForURL('**/index.html');
    // Word list: no related words.
    await page.goto(base + '/words.html?course=book');
    await page.locator('[data-term-id="t1"]').first().waitFor();
    const row = page.locator('[data-term-id="t1"]').first();
    assert.ok(!(await row.innerText()).includes('voltage'), 'related words not in the list');
    // Flashcard: related words shown; back has no AI label or "word · 예문" title.
    await page.goto(base + '/flashcard.html?term=t1');
    await page.locator('.card-back').first().waitFor({state: 'attached'});
    const card = page.locator('.card-flipper').first();
    const front = await page.locator('.card-front').first().innerText();
    assert.ok(front.includes('voltage') && front.includes('resistance'), 'related words on the flashcard');
    const back = await page.locator('.card-back').first().textContent();
    assert.ok(!back.includes('AI 예문 및 시각화 도해'));
    assert.ok(!back.includes('current · 예문') && !back.includes('· 예문'));
    // One position counter (top bar); the word sits between the ⚡ icon and the 수정 button on both faces.
    assert.equal(await page.locator('.card-flipper [data-field="counter"]').count(), 0);
    assert.equal((await page.locator('#topActiveCounter').textContent()).trim(), '01 / 01');
    for (const face of ['.card-front', '.card-back']) {
      const header = page.locator(`${face} > :first-child > :first-child > :first-child`).first();
      assert.equal((await header.locator('[data-field="en"]').textContent()).trim(), 'current', face + ' word in the header');
      assert.equal(await header.locator('[data-action="edit"]').count(), 1, face + ' edit button in the same row');
    }
    assert.ok(back.includes('The current is 2 A.'), 'example still shown');
    assert.equal(await page.locator('.card-back [data-action="edit"]').first().count(), 1, 'edit button stays');
    assert.ok(await card.count() >= 1);
    // Long words never overlap the 수정/저장 buttons or get cut off (the buttons move below).
    for (const width of [320, 390]) {
      await page.setViewportSize({width, height: 844});
      await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lexicon-word-collector-v1'));
        s.terms.t1.en = 'electromagnetic induction magnetohydrodynamics'; localStorage.setItem('lexicon-word-collector-v1', JSON.stringify(s)); });
      await page.goto(base + '/flashcard.html?term=t1');
      await page.locator('.card-front [data-field="en"]').waitFor();
      const layout = await page.locator('.card-front').evaluate(face => {
        const word = face.querySelector('.card-head [data-field="en"]').getBoundingClientRect();
        const button = face.querySelector('.card-head [data-action="edit"]').getBoundingClientRect();
        const el = face.querySelector('.card-head [data-field="en"]');
        return {fits: el.scrollWidth <= el.clientWidth + 1,
          overlap: !(word.right <= button.left + 1 || button.bottom <= word.top || word.bottom <= button.top + 1)};
      });
      assert.deepEqual(layout, {fits: true, overlap: false}, 'long word at ' + width + 'px');
    }
    assert.deepEqual(errors, []);
    console.log('PASS: person icon opens 참고 자료 (20 sources with licences); flashcard back without AI label/title line; related words only on the flashcard.');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
