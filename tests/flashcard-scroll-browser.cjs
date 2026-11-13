const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');

(async () => {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox']});
    const context = await browser.newContext({viewport: {width: 320, height: 568}, isMobile: true, hasTouch: true});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/index.html');
    await page.evaluate(() => {
      const terms = Object.fromEntries(['a', 'b', 'c'].map(id => [id, {
        course: 'electromagnetics', en: `Word ${id}`, ko: '검증 단어',
        enDef: 'A long definition that needs scrolling. '.repeat(60), koDef: '정의',
        exampleEn: 'An example sentence. '.repeat(100), exampleKo: '예문 번역'
      }]));
      localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({courses: {electromagnetics: ['검증 단어장', 'Test']}, terms, saved: ['a', 'b']}));
    });
    const selected = async () => { await page.waitForFunction(() => !document.querySelector('#cardsScrollContainer').hasAttribute('aria-busy')); return page.locator('#cardsScrollContainer > article').getAttribute('data-term-id'); };
    const open = async id => {
      await page.goto(base + '/flashcard.html?term=' + id);
      await page.waitForSelector('.card-front');
      await page.mouse.move(140, 340);
    };
    const bottom = async face => {
      await page.waitForFunction(() => !document.querySelector('#cardsScrollContainer').hasAttribute('aria-busy'));
      await page.locator(face).evaluate(e => { e.scrollTop = e.scrollHeight; });
      await page.waitForTimeout(220); // A separate wheel/swipe gesture.
    };
    await open('a');
    await page.mouse.wheel(0, 150);
    await page.waitForTimeout(100);
    assert.equal(await selected(), 'a', 'scrolling long content must retain the word');
    assert.ok(await page.locator('.card-front').evaluate(e => e.scrollTop > 0));
    await bottom('.card-front');
    await page.mouse.wheel(0, 80);
    await page.waitForFunction(() => document.querySelector('article[data-term-id]')?.dataset.termId === 'b');
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 20);
      await page.waitForTimeout(20);
    }
    assert.equal(await selected(), 'b', 'momentum must not skip additional words');
    assert.equal(await page.locator('.card-front').evaluate(e => e.scrollTop), 0);
    await page.mouse.wheel(0, -80);
    await page.waitForFunction(() => document.querySelector('article[data-term-id]')?.dataset.termId === 'a');
    await selected();
    await page.waitForTimeout(220);
    await page.mouse.wheel(0, -80);
    assert.equal(await selected(), 'a', 'the first word must not wrap');
    await open('c');
    await bottom('.card-front');
    await page.mouse.wheel(0, 80);
    assert.equal(await selected(), 'c', 'the last word must not wrap');

    const session = await context.newCDPSession(page);
    async function swipe(fromY, toY) {
      await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: 140, y: fromY}]});
      for (let i = 1; i <= 8; i++) {
        await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: 140, y: fromY + (toY - fromY) * i / 8}]});
        await page.waitForTimeout(35);
      }
      await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
      await page.waitForTimeout(200);
    }
    for (const width of [320, 390]) {
      await page.setViewportSize({width, height: 568});
      await open('a');
      await swipe(430, 240);
      assert.equal(await selected(), 'a');
      assert.ok(await page.locator('.card-front').evaluate(e => e.scrollTop > 0), 'native touch scrolling must still work');
      await bottom('.card-front');
      await swipe(430, 240);
      assert.equal(await selected(), 'b', 'upward edge swipe must advance');
      await swipe(240, 430);
      assert.equal(await selected(), 'a', 'downward top swipe must go back');
      await page.locator('.card-front [data-action=flip]').last().click();
      await bottom('.card-back');
      await swipe(430, 240);
      assert.equal(await selected(), 'b', 'back-face edge swipe must advance too');
    }
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('lexicon-word-collector-v1'));
      for (const term of Object.values(state.terms)) term.enDef = 'A short definition.';
      localStorage.setItem('lexicon-word-collector-v1', JSON.stringify(state));
    });
    await page.setViewportSize({width: 390, height: 1200});
    await open('a');
    assert.ok(await page.locator('.card-front').evaluate(e => e.scrollHeight <= e.clientHeight + 1));
    await swipe(430, 240);
    assert.equal(await selected(), 'b', 'a fully visible card must advance directly on a swipe');
    await page.mouse.move(140, 340);
    await page.mouse.wheel(0, 80);
    await page.waitForFunction(() => document.querySelector('article[data-term-id]')?.dataset.termId === 'c');
    assert.deepEqual(errors, []);
    console.log('PASS: wheel and touch edge navigation, readable long front/back content, one word per gesture, no boundary wrap at 320/390px');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
