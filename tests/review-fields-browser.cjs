// Review screen: 전공 and 한국어 뜻 start at one line and grow with their text;
// 관련 단어 is one comma-separated line, saved one word per line as before.
// No "분석 완료. 아래 결과를 검토하세요." line and no 근거 보기 on this screen.
const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');
const {setupAnalysisClient} = require('./browser-client-fixture.cjs');
const LONG_KO = '명사: 흐름, 해류, 경향, 추세 / 형용사: 현재의, 지금의, 통용되는, 널리 퍼진, 최신의, 지금 일어나고 있는';
(async () => {
  const server = createServer({apiKey: 'test-only', fetchImpl: async (_, init) => {
    const input = JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
    const long = input.word === 'stream';
    const output = {englishTerm: input.word, koreanMeaning: long ? LONG_KO : '전류', specialization: '전기공학',
      notebookName: input.selectedSubject, englishDefinition: 'The flow of electric charge.', koreanDefinition: '전하의 흐름.',
      exampleSentence: 'The current is 2 A.', explanation: '-', recommendationReason: '-', relatedTerms: [],
      relatedWords: [{englishTerm: 'voltage', koreanMeaning: '전압'}, {englishTerm: 'resistance', koreanMeaning: '저항'}],
      pos: '명사', exampleKo: '전류는 2A이다.'};
    return new Response(JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(output)}]}}]}));
  }});
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/index.html');
    await page.evaluate(() => localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({courses: {book: ['회로이론', '']}, terms: {}, saved: []})));
    const height = name => page.locator(`#analysis-review [name=${name}]`).evaluate(box => box.getBoundingClientRect().height);
    async function analyse(term) {
      await page.goto(base + '/quick_capture/code.html?course=book');
      await setupAnalysisClient(page, () => WordCollectorAI.setLocalServer(true));
      await page.locator('#term-unified-input').fill(term);
      await page.locator('#btn-meaning-major').click();
      await page.locator('#major-input').fill('전기공학');
      await page.locator('#submit-action-btn').click();
      await page.locator('#analysis-review').waitFor({state: 'visible'});
      await page.evaluate(() => document.fonts.ready);
    }
    await analyse('current');
    assert.equal(await page.locator('#analysis-status').textContent(), '');
    assert.equal(await page.locator('#analysis-status').isVisible(), false);
    assert.equal(await page.locator('#analysis-review .wc-evidence').count(), 0);
    // One line each for short text (same height as the one-line 단어 box).
    const oneLine = await height('en');
    for (const name of ['discipline', 'ko', 'related']) assert.ok(Math.abs(await height(name) - oneLine) <= 2, name + ' is one line');
    assert.equal(await page.locator('#analysis-review [name=related]').inputValue(), 'voltage, resistance');
    // Typing a longer 전공 grows its box; deleting it shrinks back to one line.
    const major = page.locator('#analysis-review [name=discipline]');
    await major.fill('전기공학 및 전자공학, 반도체 공정, 전력 시스템과 제어 공학을 함께 다루는 융합 전공');
    assert.ok(await height('discipline') > oneLine + 10, 'longer 전공 grows');
    await major.fill('전기공학');
    assert.ok(Math.abs(await height('discipline') - oneLine) <= 2, 'back to one line');
    // Saved one word per line, as before (word list and flashcards read it that way).
    await page.locator('#analysis-review [name=related]').fill('voltage,  resistance , ohm');
    await page.locator('#save-action-btn').click();
    await page.waitForURL('**/words.html?**');
    const saved = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).terms)[0]);
    assert.equal(saved.related, 'voltage\nresistance\nohm');
    // A long 한국어 뜻 (several parts of speech) is shown in full.
    await analyse('stream');
    assert.ok(await height('ko') > oneLine + 10, 'long 한국어 뜻 grows');
    assert.ok(await page.locator('#analysis-review [name=ko]').evaluate(box => box.scrollHeight <= box.clientHeight + 2), 'no hidden text');
    assert.deepEqual(errors, []);
    console.log('PASS: no status line or 근거 보기 on review; 전공/한국어 뜻/관련 단어 one line and grow with text; related words comma-separated, saved one per line.');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
