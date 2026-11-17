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
    const panel = page.locator('#review-evidence .wc-evidence');
    assert.equal(await panel.locator('summary').textContent(), '근거 보기 · 자료 근거 있음');
    await panel.locator('summary').click();
    const text = await panel.textContent();
    for (const expected of ['자료 근거 설명 (교재 내용을 AI가 요약)', 'Lessons In Electric Circuits, Volume I - DC', 'Tony R. Kuphaldt',
      '원문 대조 완료 · PDF 31쪽 · 교재 인쇄 쪽수 21쪽', 'AI가 만든 내용이며 자료로 검증되지 않았어요']) assert.ok(text.includes(expected), expected);
    assert.ok(!text.includes('unverified text'), 'unverified quotes are not shown');
    assert.equal(await panel.locator('img').count(), 0, 'quote text is never parsed as HTML');
    assert.equal(await panel.locator('a[href="https://www.ibiblio.org/kuphaldt/electricCircuits/DC/DC.pdf"]').count(), 1);
    await page.locator('#save-action-btn').click();
    await page.waitForURL('**/words.html?**');
    const saved = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).terms)[0]);
    assert.equal(saved.evidence.status, 'found');
    assert.equal(saved.evidence.sources[0].quotes.length, 1);
    const id = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).terms)[0]);
    await page.goto(base + '/flashcard.html?term=' + id);
    const cardPanel = page.locator('.card-back .wc-evidence').first();
    await cardPanel.waitFor({state: 'attached'});
    assert.equal(await cardPanel.getAttribute('data-status'), 'found');
    assert.ok((await cardPanel.textContent()).includes('원문 대조 완료 · PDF 31쪽 · 교재 인쇄 쪽수 21쪽'));
    // Opening 근거 보기 on the card back must not flip the card.
    const flipped = () => page.evaluate(() => document.querySelector('.is-flipped') !== null);
    await page.locator('.card-front').first().click();
    await page.waitForFunction(() => document.querySelector('.is-flipped') !== null);
    await page.waitForTimeout(900);
    await cardPanel.locator('summary').click();
    await page.waitForTimeout(900);
    assert.equal(await flipped(), true, 'still showing the back after opening 근거 보기');
    assert.equal(await cardPanel.evaluate(details => details.open), true);
    await cardPanel.locator('summary').click();
    await page.waitForTimeout(900);
    assert.equal(await flipped(), true, 'still showing the back after closing 근거 보기');
    // An older word without evidence is shown as 자료 근거 미확인.
    await page.evaluate(id => { const s = JSON.parse(localStorage.getItem('lexicon-word-collector-v1')); delete s.terms[id].evidence; localStorage.setItem('lexicon-word-collector-v1', JSON.stringify(s)); }, id);
    await page.reload();
    assert.equal(await page.locator('.card-back .wc-evidence').first().getAttribute('data-status'), 'unavailable');
    assert.deepEqual(errors, []);
    console.log('PASS: 근거 보기 on review (status, sources, verified quotes with PDF/printed page, links, AI note, no HTML), saved with the word, shown on the flashcard; old words 자료 근거 미확인.');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
