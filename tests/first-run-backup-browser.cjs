// A new installation starts with the three chosen notebooks (data.js). They must be
// saved like any other data, so the JSON backup works right away.
const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');

(async () => {
  const server = createServer({apiKey: 'test-only', fetchImpl: async () => { throw new Error('no API calls in this test'); }});
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const KEY = 'lexicon-word-collector-v1';
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
    const summary = '단어장 3개 · 단어 72개 · 북마크 0개';

    // 1. Backup opened first on a brand-new installation.
    let context = await browser.newContext({viewport: {width: 390, height: 844}});
    let page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/backup.html');
    await page.waitForFunction(() => document.getElementById('current').textContent !== '확인 중…');
    assert.ok((await page.locator('#current').textContent()).includes(summary), await page.locator('#current').textContent());
    assert.equal(await page.locator('#export').isDisabled(), false, 'backup is possible right away');
    await context.close();

    // 2. Home first: the first-run notebooks are written to storage once.
    context = await browser.newContext({viewport: {width: 390, height: 844}});
    page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/index.html');
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    assert.ok(saved, 'first-run data is saved');
    assert.deepEqual(Object.values(saved.courses).map(([name]) => name).sort(), ['전기기기', '전력공학', '회로이론']);
    assert.equal(Object.keys(saved.terms).length, 72);
    await page.goto(base + '/backup.html');
    await page.waitForFunction(() => document.getElementById('current').textContent !== '확인 중…');
    assert.ok((await page.locator('#current').textContent()).includes(summary));
    assert.equal(await page.locator('#export').isDisabled(), false);

    // 3. After the user deletes every notebook, nothing comes back.
    await page.evaluate(key => localStorage.setItem(key, JSON.stringify({courses: {}, terms: {}, saved: []})), KEY);
    await page.goto(base + '/index.html');
    assert.equal(await page.locator('[data-subject]:visible').count(), 0);
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY), {courses: {}, terms: {}, saved: []});
    await context.close();

    assert.deepEqual(errors, []);
    console.log('PASS: first-run notebooks are saved once; backup works on a new installation (opened first or after home); deleted notebooks are not re-created.');
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
