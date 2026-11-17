// 출력 on the web: a computer always downloads the file (no share sheet). A phone uses the
// share sheet; if the browser refuses it (NotAllowedError "Permission denied") the file is
// downloaded instead, and closing the sheet (AbortError) saves nothing.
// The file name has the device's local date.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0';
(async () => {
  const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
    async function open(userAgent) {
      const context = await browser.newContext({acceptDownloads: true, timezoneId: 'Asia/Seoul', userAgent});
      const page = await context.newPage();
      page.errors = []; page.on('pageerror', error => page.errors.push(error.message));
      await page.addInitScript(() => {
        window.__shares = 0;
        // userAgentData is not overridden by the user agent string in Chromium: hide it so the string decides.
        Object.defineProperty(Navigator.prototype, 'userAgentData', {value: undefined, configurable: true});
        Object.defineProperty(Navigator.prototype, 'canShare', {value: () => true, configurable: true});
        Object.defineProperty(Navigator.prototype, 'share', {configurable: true, value: async () => {
          window.__shares++;
          const cancelled = window.__shareError === 'cancel';
          throw new DOMException(cancelled ? 'Share canceled' : 'Permission denied', cancelled ? 'AbortError' : 'NotAllowedError');
        }});
      });
      await page.goto(base + '/index.html');
      await page.evaluate(() => localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({courses: {c: ['회로이론', '']}, terms: {a: {course: 'c', en: 'A', ko: '가'}}, saved: ['a']})));
      await page.goto(base + '/_6/code.html');
      return page;
    }
    async function downloads(page, expectedShares) {
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
      assert.equal(await page.evaluate(() => window.__shares), expectedShares);
    }
    // Windows computer: downloads directly; the share sheet is never opened (even if canShare says yes).
    const computer = await open(WINDOWS);
    await downloads(computer, 0);
    // Android phone: the share sheet is tried first; refused -> download.
    const phone = await open(ANDROID);
    await downloads(phone, 2);
    // Closing the share sheet on the phone is a cancel, not a download.
    await phone.evaluate(() => { window.__shareError = 'cancel'; });
    let downloaded = false; phone.on('download', () => { downloaded = true; });
    await phone.locator('#exportActionBtn').click();
    await phone.waitForFunction(() => document.querySelector('#exportStatus').textContent === '저장을 취소했습니다.');
    await phone.waitForTimeout(500);
    assert.equal(downloaded, false);
    assert.deepEqual([...computer.errors, ...phone.errors], []);
    console.log('PASS: computer downloads CSV/XLSX without the share sheet; phone: share refused -> download, share closed -> nothing saved; file names use the local date.');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
