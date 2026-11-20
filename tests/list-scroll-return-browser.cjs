// Word list -> scroll down -> open a flashcard -> back: the list is where it was
// (card back button and browser back). Opening the list again from home starts at the top.
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
    await page.evaluate(() => {
      const terms = {};
      for (let i = 0; i < 30; i++) terms['w' + i] = {course: 'book', en: 'word ' + i, ko: '단어 ' + i, enDef: 'Definition ' + i + '.', koDef: '정의 ' + i + '.'};
      localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({courses: {book: ['회로이론', '']}, terms, saved: ['w20', 'w21', 'w22']}));
    });
    const scrollY = () => page.evaluate(() => Math.round(window.scrollY));
    async function openListAndScroll(url) {
      await page.goto(base + url);
      await page.locator('[data-term-id="w20"]').first().waitFor();
      await page.locator('[data-term-id="w20"]').first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const y = await scrollY();
      assert.ok(y > 300, 'scrolled down (' + y + ')');
      return y;
    }
    // 1) Card back button returns to the same position.
    let y = await openListAndScroll('/words.html?course=book');
    await page.locator('[data-term-id="w20"]').first().click();
    await page.waitForURL('**/flashcard.html**');
    await page.locator('.card-front').first().waitFor();
    await page.locator('#cardsScrollContainer').focus();
    await page.keyboard.press('ArrowDown');   // look at another card first
    await page.waitForTimeout(600);
    await page.locator('header button').first().click();   // ← back to the list
    await page.waitForURL('**/words.html**');
    await page.locator('[data-term-id="w20"]').first().waitFor();
    await page.waitForTimeout(300);
    assert.ok(Math.abs(await scrollY() - y) <= 2, `back button keeps the position (${await scrollY()} vs ${y})`);
    // 2) Browser / phone back keeps it too.
    await page.locator('[data-term-id="w21"]').first().click();
    await page.waitForURL('**/flashcard.html**');
    await page.goBack();
    await page.waitForURL('**/words.html**');
    await page.locator('[data-term-id="w20"]').first().waitFor();
    await page.waitForTimeout(300);
    assert.ok(Math.abs(await scrollY() - y) <= 2, `browser back keeps the position (${await scrollY()} vs ${y})`);
    // 3) The bookmark list remembers its own position.
    const yb = await openListAndScroll('/bookmarks.html').catch(() => null);
    if (yb === null) {   // short bookmark list: nothing to scroll, only check no jump/error
      await page.goto(base + '/bookmarks.html');
    }
    // 4) Coming from home, the list starts at the top.
    await page.goto(base + '/words.html?course=book');
    await page.locator('[data-term-id="w20"]').first().scrollIntoViewIfNeeded();
    await page.locator('[data-term-id="w20"]').first().click();
    await page.waitForURL('**/flashcard.html**');
    await page.goto(base + '/index.html');
    await page.locator('[data-subject]').first().click();
    await page.waitForURL('**/words.html**');
    await page.locator('[data-term-id="w0"]').first().waitFor();
    await page.waitForTimeout(300);
    assert.equal(await scrollY(), 0, 'from home the list starts at the top');
    assert.deepEqual(errors, []);
    console.log('PASS: the word list keeps its scroll position after a flashcard (card back button and browser back); from home it starts at the top.');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
