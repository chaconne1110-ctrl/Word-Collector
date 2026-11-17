// Text boxes grow with long sentences (review, edit and input screens).
const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');
const {setupAnalysisClient} = require('./browser-client-fixture.cjs');
const LONG = 'When the switch is closed, electric current flows through the whole circuit, heats the filament and makes the lamp glow brightly. '.repeat(4);
// A box "fits" when its content needs no scrolling inside it.
const fits = locator => locator.evaluate(box => box.scrollHeight <= box.clientHeight + 2 && getComputedStyle(box).overflowY === 'hidden');
(async () => {
  const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
    for (const width of [320, 390]) {
      const page = await browser.newPage({viewport: {width, height: 800}});
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await setupAnalysisClient(page, () => {
        const long = 'When the switch is closed, electric current flows through the whole circuit, heats the filament and makes the lamp glow brightly. '.repeat(4);
        WordCollectorAI.request = async () => ({model: 'gemini-4-hydrogen', en: 'current', ko: '전류', discipline: '전기공학', pos: '명사',
          enDef: long, koDef: '스위치를 닫으면 전류가 회로 전체에 흘러 필라멘트를 데우고 전구를 밝게 빛나게 한다. '.repeat(4),
          exampleEn: long, exampleKo: '짧은 예문.', course: '회로이론', relatedWords: []});
      });
      await page.goto(base + '/index.html');
      await page.evaluate(() => localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({courses: {book: ['회로이론', '']}, terms: {}, saved: []})));
      // Input screen: the reference sentence box grows while typing, never below its first size.
      await page.goto(base + '/quick_capture/code.html?course=book');
      await page.evaluate(() => document.fonts.ready);
      const context = page.locator('#context-sentence-input');
      const first = await context.evaluate(box => box.getBoundingClientRect().height);
      await context.fill('Short.');
      assert.ok(await context.evaluate((box, first) => box.getBoundingClientRect().height >= first - 1, first), 'not smaller than before');
      await context.fill(LONG);
      assert.ok(await fits(context), 'reference box fits a long sentence');
      assert.ok(await context.evaluate((box, first) => box.getBoundingClientRect().height > first, first), 'reference box grew');
      // Review screen: long analysis text is shown in full; typing more grows the box.
      await page.locator('#term-unified-input').fill('current');
      await page.locator('#btn-meaning-major').click();
      await page.locator('#major-input').fill('전기공학');
      await page.locator('#submit-action-btn').click();
      await page.locator('#analysis-review').waitFor({state: 'visible'});
      await page.evaluate(() => document.fonts.ready);   // sizes are final once the web font is in
      for (const name of ['enDef', 'koDef', 'exampleEn']) assert.ok(await fits(page.locator(`[name=${name}]`)), name + ' fits');
      const short = page.locator('[name=exampleKo]');
      const before = await short.evaluate(box => box.getBoundingClientRect().height);
      await short.fill(LONG);
      assert.ok(await fits(short), 'typed text fits');
      assert.ok(await short.evaluate((box, before) => box.getBoundingClientRect().height > before, before), 'box grew while typing');
      await short.fill('짧게.');
      assert.ok(await short.evaluate((box, before) => Math.abs(box.getBoundingClientRect().height - before) <= 2, before), 'box shrinks back when text is deleted');
      await short.fill(LONG);
      await page.locator('#save-action-btn').click();
      await page.waitForURL('**/words.html?**');
      // Edit screen: saved long text fits when the page opens.
      const id = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).terms)[0]);
      await page.goto(base + '/edit.html?term=' + id);
      await page.evaluate(() => document.fonts.ready);
      const boxes = page.locator('textarea');
      const count = await boxes.count();
      assert.ok(count >= 3);
      for (let i = 0; i < count; i++) if (await boxes.nth(i).isVisible()) assert.ok(await fits(boxes.nth(i)), 'edit box ' + i + ' fits');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS: input, review and edit text boxes grow to fit long sentences at 320/390px (never smaller than the empty box; shrinks back when text is deleted).');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
