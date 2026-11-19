// 근거 보기 on the review screen and, after saving, on the flashcard back.
const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');
const {setupAnalysisClient} = require('./browser-client-fixture.cjs');
(async () => {
  const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => { errors.push('dialog: ' + dialog.message()); dialog.dismiss(); });
    await setupAnalysisClient(page, () => {
      WordCollectorAI.request = async () => ({model: 'gemini-4-hydrogen', en: 'current', ko: '전류', discipline: '전기공학', pos: '명사',
        enDef: 'The flow of electric charge.', koDef: '전하의 흐름.', exampleEn: 'The current is 2 A.', exampleKo: '전류는 2A이다.',
        course: '회로이론', relatedWords: [{en: 'voltage', ko: '전압'}, {en: 'resistance', ko: '저항'}],
        evidence: {status: 'found', message: '등록 자료에서 이 의미를 설명하는 근거를 찾았어요.', limitation: '',
          explanation: {ko: '전류는 도체를 통해 흐르는 전자의 흐름이다.', en: 'Current is the flow of electrons.'},
          notes: ['뜻·정의·예문은 AI가 만든 내용이며 자료로 검증되지 않았어요.'],
          sources: [{sourceId: 'kuphaldt-lec-dc', title: 'Lessons In Electric Circuits, Volume I - DC', author: 'Tony R. Kuphaldt',
            edition: 'Fifth Edition', url: 'https://www.ibiblio.org/kuphaldt/electricCircuits/DC/DC.pdf', license: 'CC BY 4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', checkedAt: '2026-11-17',
            quotes: [{text: 'Electric current is the flow of electrons <img src=x onerror="alert(1)">.', verified: true, pdfPage: 31, printedPage: '21'},
              {text: 'unverified text', verified: false}]}]}});
    });
    await page.goto(base + '/index.html');
    await page.evaluate(() => localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({courses: {book: ['회로이론', '']}, terms: {}, saved: []})));
    await page.goto(base + '/quick_capture/code.html?course=book');
    await page.locator('#term-unified-input').fill('current');
    await page.locator('#btn-meaning-major').click();
      await page.locator('#major-input').fill('전기공학');
    await page.locator('#submit-action-btn').click();
    await page.locator('#analysis-review').waitFor({state: 'visible'});
    // The review screen shows no 근거 보기 / 자료 근거 status and no "분석 완료. 아래 결과를 검토하세요." line.
    assert.equal(await page.locator('#analysis-review .wc-evidence').count(), 0);
    assert.ok(!(await page.locator('#analysis-review').textContent()).includes('자료 근거'));
    assert.equal(await page.locator('#analysis-status').textContent(), '');
    assert.equal(await page.locator('#analysis-status').isVisible(), false);
    await page.locator('#save-action-btn').click();
    await page.waitForURL('**/words.html?**');
    const saved = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).terms)[0]);
    assert.equal(saved.evidence.status, 'found');
    assert.deepEqual(saved.evidence.sources, [], 'the word does not keep the material either');
    const id = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).terms)[0]);
    // The flashcard shows no 근거 보기 either; the material is never shown anywhere.
    await page.goto(base + '/flashcard.html?term=' + id);
    await page.locator('.card-back').first().waitFor({state: 'attached'});
    assert.equal(await page.locator('.wc-evidence').count(), 0, 'no 근거 보기 on the flashcard');
    const cardText = await page.locator('.card-flipper').first().textContent();
    for (const hidden of ['근거 보기', 'Lessons In Electric Circuits', 'Kuphaldt', 'Electric current is the flow', 'PDF 31쪽'])
      assert.ok(!cardText.includes(hidden), hidden + ' is not shown');
    assert.deepEqual(errors, []);
    console.log('PASS: no 근거 보기 on review or flashcard; the saved word keeps its evidence status without any material (no titles, quotes, pages, links or licenses).');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
