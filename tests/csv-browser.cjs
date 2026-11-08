const {chromium} = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const assert = require('node:assert/strict');
(async () => {
  const directory = process.env.WC_TEST_ARTIFACTS || await fs.mkdtemp(path.join(os.tmpdir(), 'wc-export-'));
  await fs.mkdir(directory, {recursive: true});
  const root = path.join(__dirname, '../www');
  const server = http.createServer(async (request, response) => {
    try {
      const name = new URL(request.url, 'http://localhost').pathname;
      const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
      if (!file.startsWith(root + path.sep)) throw new Error('Path');
      const bytes = await fs.readFile(file);
      response.writeHead(200, {'Content-Type': {'.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.woff2': 'font/woff2'}[path.extname(file)] || 'application/octet-stream'});
      response.end(bytes);
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.locator('[data-word-export-link]').click();
    await page.waitForURL('**/export.html');
    assert.equal(await page.locator('#count').textContent(), '9개 단어 · 8열');
    await page.locator('#course').selectOption('circuit-theory');
    assert.equal(await page.locator('#count').textContent(), '4개 단어 · 8열');
    const fixture = {
      courses: {em: ['전자기학', 'EM'], circuit: ['회로이론', 'Circuits']},
      terms: {
        a: {course: 'em', en: '=HYPERLINK("x")', ko: '와전류 😀', discipline: '전기공학',
          enDef: 'A, "quoted" definition\r\nnext line', koDef: '  공백 <태그> & 기호  ',
          exampleEn: 'A sentence.', exampleKo: '예문 번역', pos: 'noun', originalTerm: '와전류'},
        b: {course: 'circuit', en: 'Impedance', ko: '임피던스'}
      }, saved: ['a']
    };
    await page.evaluate(state => localStorage.setItem('lexicon-word-collector-v1', JSON.stringify(state)), fixture);
    await page.reload();
    await page.locator('#course').selectOption('em');
    async function download(format, filename) {
      const pending = page.waitForEvent('download');
      await page.locator('[data-format="' + format + '"]').click();
      const result = await pending;
      assert.ok(result.suggestedFilename().endsWith('.' + format));
      await result.saveAs(path.join(directory, filename));
    }
    await download('csv', 'basic.csv');
    await download('xlsx', 'basic.xlsx');
    const csv = await fs.readFile(path.join(directory, 'basic.csv'), 'utf8');
    assert.ok(csv.startsWith('\uFEFF')); assert.ok(csv.includes('와전류')); assert.ok(!csv.includes('Impedance'));
    await page.locator('#layout').selectOption('ai');
    await download('csv', 'ai.csv'); await download('xlsx', 'ai.xlsx');
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('lexicon-word-collector-v1'));
      state.terms.a.ko = '최신 수정'; localStorage.setItem('lexicon-word-collector-v1', JSON.stringify(state));
    });
    await download('csv', 'latest.csv');
    assert.ok((await fs.readFile(path.join(directory, 'latest.csv'), 'utf8')).includes('최신 수정'));
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).terms.a.ko), '최신 수정');
    await page.evaluate(() => localStorage.setItem('lexicon-word-collector-v1', '{invalid'));
    await page.locator('#refresh').click();
    assert.equal(await page.locator('#export-xlsx').isDisabled(), true);
    assert.equal(await page.evaluate(() => localStorage.getItem('lexicon-word-collector-v1')), '{invalid');
    assert.equal(await page.locator('#preview').inputValue(), '');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

    const native = await browser.newPage();
    await native.addInitScript(() => {
      window.calls = [];
      window.Capacitor = {getPlatform: () => 'android', Plugins: {WordExport: {save: async options => {
        window.calls.push(options); return {cancelled: window.cancelExport || false};
      }}}};
    });
    await native.goto(base + '/export.html');
    await native.locator('#export-xlsx').click();
    await native.waitForFunction(() => document.querySelector('#status').textContent === '파일을 저장했습니다.');
    const options = await native.evaluate(() => calls[0]);
    assert.equal(options.mimeType, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const bytes = Buffer.from(options.base64, 'base64');
    assert.equal(bytes.readUInt32LE(0), 0x04034b50);
    await fs.writeFile(path.join(directory, 'native-bridge.xlsx'), bytes);
    await native.evaluate(() => { window.cancelExport = true; });
    await native.locator('#export').click();
    await native.waitForFunction(() => document.querySelector('#status').textContent === '저장을 취소했습니다.');
    const csvOptions = await native.evaluate(() => calls[1]);
    assert.equal(csvOptions.mimeType, 'text/csv');
    assert.equal(Buffer.from(csvOptions.base64, 'base64').subarray(0, 3).toString('hex'), 'efbbbf');
    await native.evaluate(() => { delete Capacitor.Plugins.WordExport; });
    await native.locator('#export').click();
    assert.match(await native.locator('#status').textContent(), /최신 APK/);
    await native.evaluate(() => {
      Capacitor.Plugins.WordExport = {save: async () => { throw new Error('저장 위치 오류'); }};
    });
    await native.locator('#export-xlsx').click();
    assert.match(await native.locator('#status').textContent(), /저장 위치 오류/);
    assert.equal(await native.evaluate(() => localStorage.getItem('lexicon-word-collector-v1')), null);
    assert.deepEqual(errors, []);
    console.log('PASS: home entry, course filters, CSV/XLSX downloads, both layouts, latest saved data, malformed storage, native bridge payload/cancel/failure');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
    if (!process.env.WC_TEST_ARTIFACTS) await fs.rm(directory, {recursive: true, force: true});
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
