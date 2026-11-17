// A word found in the textbook glossary: review shows the glossary note, the
// textbook sentence as the example and its page under 근거 보기; it saves normally.
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
      WordCollectorAI.request = async payload => ({model: 'textbook-glossary', source: 'glossary', en: 'current', ko: '전류', discipline: '전기공학', pos: '명사',
        enDef: 'The flow of electric charge.', koDef: '전하의 흐름.', exampleEn: 'When you switch on the lamp, a small current runs through it.',
        exampleKo: '램프를 켜면 작은 전류가 흐른다.', course: payload.course,
        relatedWords: [{en: 'voltage', ko: '전압'}, {en: 'resistance', ko: '저항'}],
        evidence: {version: 1, status: 'found', message: '교재 단어집에서 찾은 단어예요.', explanation: null, limitation: '',
          notes: ['뜻·정의·예문은 등록 자료를 참고해 AI가 정리한 내용이에요.'], sources: []}});
    });
    await page.goto(base + '/index.html');
    await page.evaluate(() => localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({courses: {book: ['회로이론', '']}, terms: {}, saved: []})));
    await page.goto(base + '/quick_capture/code.html?course=book');
    await page.locator('#btn-meaning-major').click();
    await page.locator('#major-input').fill('전기공학');
    await page.locator('#term-unified-input').fill('current');
    await page.locator('#submit-action-btn').click();
    await page.locator('#analysis-review').waitFor({state: 'visible'});
    assert.ok(await page.locator('#review-glossary-note').isVisible(), 'glossary note shown');
    assert.equal(await page.locator('#analysis-review [name=exampleEn]').inputValue(), 'When you switch on the lamp, a small current runs through it.');
    await page.locator('#review-evidence .wc-evidence summary').click();
    const evidenceText = await page.locator('#review-evidence').textContent();
    assert.ok(evidenceText.includes('등록 자료를 참고해 AI가 정리'));
    assert.ok(!evidenceText.includes('Lessons In Electric Circuits') && !evidenceText.includes('PDF 31쪽'), 'no material shown');
    await page.locator('#save-action-btn').click();
    await page.waitForURL('**/words.html?**');
    const saved = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).terms)[0]);
    assert.equal(saved.ko, '전류');
    assert.equal(saved.analysisModel, 'textbook-glossary');
    assert.deepEqual(saved.evidence.sources, []);
    // A Gemini result does not show the glossary note.
    await page.evaluate(() => localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({courses: {book: ['회로이론', '']}, terms: {}, saved: []})));
    await setupAnalysisClient(page, () => {
      WordCollectorAI.request = async payload => ({model: 'gemini-4-hydrogen', en: 'dark current', ko: '암전류', discipline: '전기공학', pos: '명사',
        enDef: 'A small current with no light.', koDef: '빛이 없을 때 흐르는 작은 전류.', exampleEn: 'Dark current is small.', exampleKo: '암전류는 작다.',
        course: payload.course, relatedWords: [{en: 'photodiode', ko: '포토다이오드'}, {en: 'leakage current', ko: '누설 전류'}]});
    });
    await page.goto(base + '/quick_capture/code.html?course=book');
    await page.locator('#btn-meaning-major').click();
    await page.locator('#major-input').fill('전기공학');
    await page.locator('#term-unified-input').fill('dark current');
    await page.locator('#submit-action-btn').click();
    await page.locator('#analysis-review').waitFor({state: 'visible'});
    assert.equal(await page.locator('#review-glossary-note').isVisible(), false);
    assert.deepEqual(errors, []);
    console.log('PASS: glossary hit shows the note and the AI-written example (no material shown) and saves; Gemini results do not show the note.');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
