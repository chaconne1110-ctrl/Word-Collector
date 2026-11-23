// 출력: the 북마크 group selects bookmarked words; the file has a 북마크 column and each word once.
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
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/index.html');
    await page.evaluate(() => localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({
      courses: {machine: ['전기기기', ''], circuit: ['회로이론', '']}, saved: ['D'],
      terms: {A: {course: 'machine', en: 'A', ko: '가'}, B: {course: 'machine', en: 'B', ko: '나'},
        C: {course: 'machine', en: 'C', ko: '다'}, D: {course: 'circuit', en: 'D', ko: '라'}}})));
    async function exportCsv() {
      await page.evaluate(() => { window.__file = null; window.WordCollectorSave = async bytes => { window.__file = new TextDecoder().decode(bytes); return '저장됨'; }; });
      await page.selectOption('#exportFormat', 'csv');
      await page.locator('#exportActionBtn').click();
      await page.waitForFunction(() => window.__file !== null);
      return page.evaluate(() => window.__file.replace(/^\uFEFF/, '').trim().split('\r\n').map(line => JSON.parse('[' + line + ']')));
    }
    // Notebooks start folded: open one by tapping its name (summary) before ticking its words.
    const pick = async (group, id, checked) => {
      const details = page.locator(group).first();
      if (!await details.evaluate(d => d.open)) await details.locator('summary').click();
      await page.locator(`${group} .word-checkbox[data-term-id="${id}"]`).setChecked(checked);
    };
    // "이 단어장 전체 선택" also shows only after the 북마크 group is opened.
    const pickBookmarkGroup = async () => {
      if (!await page.locator('#bookmarkGroup').evaluate(d => d.open)) await page.locator('#bookmarkGroup summary').click();
      await page.locator('#bookmarkGroup .subject-checkbox').setChecked(true);
    };
    await page.goto(base + '/_6/code.html');
    assert.equal(await page.locator('#bookmarkGroup summary').textContent(), '북마크');
    assert.deepEqual(await page.locator('#bookmarkGroup .word-checkbox').evaluateAll(list => list.map(i => i.dataset.termId)), ['D']);
    assert.ok(await page.locator('[data-column="bookmark"]').isChecked());
    // Clear everything, then choose 전기기기 A, C and the 북마크 group.
    await page.locator('#selectAllMaster').setChecked(false, {force: true});
    const machine = 'details:has(summary:text-is("전기기기"))';
    await pick(machine, 'A', true); await pick(machine, 'C', true);
    await pickBookmarkGroup();
    assert.ok(await page.locator('details:has(summary:text-is("회로이론")) .word-checkbox[data-term-id="D"]').isChecked(), 'one selection per word');
    let rows = await exportCsv();
    assert.deepEqual(rows.map(r => [r[1], r[2], r.at(-1)]), [['단어장 이름', '표제어', '북마크'], ['전기기기', 'A', ''], ['전기기기', 'C', ''], ['회로이론', 'D', '북마크']]);
    // Bookmark A as well: still one A row, now marked.
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lexicon-word-collector-v1')); s.saved.push('A'); localStorage.setItem('lexicon-word-collector-v1', JSON.stringify(s)); });
    await page.reload();
    await page.locator('#selectAllMaster').setChecked(false, {force: true});
    await pick(machine, 'A', true); await pick(machine, 'C', true);
    await pickBookmarkGroup();
    assert.equal(await page.locator('#globalSelectedCount').textContent(), '3개 단어 선택됨');
    rows = await exportCsv();
    assert.deepEqual(rows.map(r => [r[1], r[2], r.at(-1)]), [['단어장 이름', '표제어', '북마크'], ['전기기기', 'A', '북마크'], ['전기기기', 'C', ''], ['회로이론', 'D', '북마크']]);
    assert.deepEqual(errors, []);
    console.log('PASS: 북마크 group selects bookmarked words; file rows grouped by notebook with a 북마크 column; a word chosen twice is exported once.');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
