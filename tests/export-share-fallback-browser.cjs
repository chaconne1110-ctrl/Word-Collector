// 출력 on the web: when the browser says files can be shared but then refuses
// (Edge/Chrome on Windows: NotAllowedError "Permission denied"), the file is downloaded instead;
// closing the share sheet (AbortError) saves nothing. The file name has the device's local date.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');
(async () => {
  const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
    const page = await browser.newPage({acceptDownloads: true, timezoneId: 'Asia/Seoul'});
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'canShare', {value: () => true, configurable: true});
      Object.defineProperty(Navigator.prototype, 'share', {configurable: true, value: async () => {
        throw new DOMException(window.__shareError || 'Permission denied', window.__shareError === 'Share canceled' ? 'AbortError' : 'NotAllowedError');
      }});
    });
    await page.goto(base + '/index.html');
    await page.evaluate(() => localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({courses: {c: ['회로이론', '']}, terms: {a: {course: 'c', en: 'A', ko: '가'}}, saved: ['a']})));
    await page.goto(base + '/_6/code.html');
    const today = await page.evaluate(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); });
    for (const format of ['csv', 'xlsx']) {
      await page.selectOption('#exportFormat', format);
      const download = page.waitForEvent('download');
      await page.locator('#exportActionBtn').click();
      const file = await download;
      assert.equal(file.suggestedFilename(), `wordcollector-${today}.${format}`);
      assert.ok(fs.statSync(await file.path()).size > 0);
      assert.equal(await page.locator('#exportStatus').textContent(), '파일 다운로드를 요청했습니다. 브라우저의 다운로드 목록을 확인하세요.');
    }
    // Closing the share sheet is a cancel, not a download.
    await page.evaluate(() => { window.__shareError = 'Share canceled'; });
    let downloaded = false; page.on('download', () => { downloaded = true; });
    await page.locator('#exportActionBtn').click();
    await page.waitForFunction(() => document.querySelector('#exportStatus').textContent === '저장을 취소했습니다.');
    await page.waitForTimeout(500);
    assert.equal(downloaded, false);
    assert.deepEqual(errors, []);
    console.log('PASS: share refused (Permission denied) -> CSV/XLSX downloaded with the local date; share cancelled -> nothing saved.');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
