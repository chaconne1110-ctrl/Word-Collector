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
    const page = await browser.newPage();
    await page.addInitScript(() => { if(!localStorage.getItem('lexicon-word-collector-v1')) localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({courses:{electromagnetics:['검증 단어장','Test']},terms:{a:{course:'electromagnetics',en:'electricity',ko:'전기',pos:'noun',enDef:'Energy',exampleEn:'Electricity flows.'}},saved:[]})); });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [320, 390]) {
      await page.setViewportSize({width, height: 844});
      await page.goto(base + '/words.html?course=electromagnetics');
      await page.locator('#term-list [data-term-id]').first().click();
      await page.waitForSelector('#cardsScrollContainer > article');
      assert.equal(await page.locator('.card-front').isVisible(), true);
      assert.equal(await page.locator('.card-front [data-action="bookmark"]').count(), 1);
      await page.locator('.card-front [data-action="bookmark"]').click();
      const pressed = await page.locator('.card-front [data-action="bookmark"]').getAttribute('aria-pressed');
      assert.equal(await page.locator('.card-back [data-action="bookmark"]').getAttribute('aria-pressed'), pressed);
      // No front/back toggle any more: tapping the card flips it.
      await page.locator('.card-front [data-field="en"]').first().click();
        await page.waitForFunction(() => !document.querySelector('#cardsScrollContainer').hasAttribute('aria-busy'));
      assert.equal(await page.locator('.card-back').isVisible(), true);
      assert.equal(await page.getByRole('button', {name: 'AI 사진 생성 (유료 · 1회)', exact: true}).count(), 1);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: list-to-flashcard rendering, both bookmark buttons, face switching and photo panel at 320/390px');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
