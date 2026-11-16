// 일반 의미 always saves to the 일반 단어장, which every install has; a deleted
// 일반 단어장 comes back when a general-meaning word is saved.
const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');
const {setupAnalysisClient} = require('./browser-client-fixture.cjs');
(async () => {
  const sent = [];
  const server = createServer({apiKey: 'test-only', fetchImpl: async (_, init) => {
    const input = JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
    sent.push(input);
    const output = {englishTerm: 'current', koreanMeaning: '흐름, 현재의', specialization: '전기공학', notebookName: input.selectedSubject,
      englishDefinition: 'A steady flow, or happening now.', koreanDefinition: '꾸준한 흐름, 또는 지금 일어나는.',
      exampleSentence: 'The river has a strong current.', explanation: '일상 뜻', recommendationReason: '-', relatedTerms: [],
      pos: 'noun', exampleKo: '그 강은 물살이 세다.'};
    return new Response(JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(output)}]}}]}));
  }});
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('lexicon-word-collector-v1')));
    async function analyseGeneral(word) {
      await page.goto(base + '/quick_capture/code.html');
      await setupAnalysisClient(page, () => WordCollectorAI.setLocalServer(true));
      assert.equal(await page.locator('#btn-meaning-general').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#cat-mode-badge-text').textContent(), '일반 단어장에 저장');
      await page.locator('#term-unified-input').fill(word);
      await page.locator('#submit-action-btn').click();
      await page.locator('#analysis-review').waitFor({state: 'visible'});
      // 일반 의미: no example sentence, so the 예문 box is not shown.
      assert.ok(await page.locator('[name=exampleEn]').evaluate(e => e.closest('fieldset').hidden));
      assert.ok(await page.locator('[name=enDef]').isVisible());
      assert.ok(await page.locator('#review-pos-warning').isHidden(), 'single POS: no warning');
      // The destination is fixed to the 일반 단어장.
      assert.equal(await page.locator('#review-course').inputValue(), 'general-meaning');
      assert.ok(await page.locator('#review-course').isDisabled());
      await page.locator('#save-action-btn').click();
      await page.waitForURL('**/words.html?**');
      assert.equal(await page.locator('header h1').textContent(), '일반 단어장');
    }
    await page.goto(base + '/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    assert.deepEqual((await read()).courses, {'general-meaning': ['일반 단어장', '']});
    await analyseGeneral('current');
    assert.equal(sent.at(-1).meaningMode, 'general');
    assert.equal(sent.at(-1).selectedSubject, '일반 단어장');
    assert.equal(sent.at(-1).autoSubject, false);
    let state = await read();
    assert.deepEqual(Object.values(state.terms).map(t => [t.en, t.course, t.discipline, t.exampleEn, t.exampleSource]),
      [['current', 'general-meaning', '일반', '', 'none']]);
    // The flashcard shows no (empty) example box for a 일반 의미 word.
    await page.goto(base + '/flashcard.html?term=' + Object.keys(state.terms)[0]);
    await page.locator('[data-field="enDef"]').first().waitFor({state: 'attached'});
    assert.ok(await page.locator('[data-field="exampleEn"]').evaluateAll(nodes =>
      nodes.length > 0 && nodes.every(node => node.parentElement.hidden)));
    // Deleted 일반 단어장: not recreated on start-up, but recreated by a general-meaning save.
    await page.evaluate(() => localStorage.setItem('lexicon-word-collector-v1',
      JSON.stringify({courses: {}, terms: {}, saved: [], deletedCourses: ['general-meaning']})));
    await page.goto(base + '/index.html');
    assert.deepEqual((await read()).courses, {});
    await analyseGeneral('run');
    state = await read();
    assert.deepEqual(state.courses, {'general-meaning': ['일반 단어장', '']});
    assert.deepEqual(state.deletedCourses, []);
    assert.equal(Object.values(state.terms)[0].course, 'general-meaning');
    // A new 전공 notebook may not reuse an existing name (input page and review).
    const taken = '이미 있는 단어장 이름입니다. 다른 이름을 입력하거나 기존 단어장을 선택해 주세요.';
    await page.goto(base + '/quick_capture/code.html');
    await setupAnalysisClient(page, () => WordCollectorAI.setLocalServer(true));
    await page.locator('#term-unified-input').fill('current');
    await page.locator('#btn-meaning-major').click();
    await page.locator('#major-input').fill('전기공학');
    for (const name of ['일반 단어장', ' 일반  단어장 ']) {
      await page.locator('#new-notebook-input').fill(name);
      await page.locator('#submit-action-btn').click();
      assert.equal(await page.locator('#analysis-status').textContent(), taken);
      assert.ok(page.url().endsWith('/quick_capture/code.html'));
    }
    await page.locator('#new-notebook-input').fill('회로이론');
    await page.locator('#submit-action-btn').click();
    await page.locator('#analysis-review').waitFor({state: 'visible'});
    await page.locator('#review-new-course').fill('일반 단어장');
    await page.locator('#save-action-btn').click();
    assert.equal(await page.locator('#analysis-status').textContent(), taken);
    state = await read();
    assert.deepEqual(Object.keys(state.courses), ['general-meaning']);
    assert.equal(Object.keys(state.terms).length, 1, 'nothing saved into the 일반 단어장');
    await page.locator('#review-new-course').fill('회로이론');
    await page.locator('#save-action-btn').click();
    await page.waitForURL('**/words.html?**');
    assert.equal(await page.locator('header h1').textContent(), '회로이론');
    if (process.env.SHOT) {
      await page.goto(base + '/quick_capture/code.html');
      await page.locator('#btn-meaning-major').click();
      await page.locator('#major-input').fill('전기공학');
      await page.locator('#new-notebook-input').fill('회로이론');
      await page.locator('#cat-mode-badge').scrollIntoViewIfNeeded();
      await page.screenshot({path: process.env.SHOT});
    }
    assert.deepEqual(errors, []);
    console.log('PASS: 일반 단어장 on install; 일반 의미 always saved there (fixed in review); recreated after deletion only when a general word is saved; taken new-notebook names refused on input and review.');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
