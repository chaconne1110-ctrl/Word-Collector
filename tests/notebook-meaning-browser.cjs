// Word input: 1. 단어  2. 의미 기준 (일반 / 전공 / 전공 모름)  3. 단어장 (existing / new,
// name required)  4. 참고자료 (hidden for 일반 의미, required for 전공 모름).
// The notebook and the meaning are chosen independently.
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
    const general = input.meaningMode === 'general';
    const output = {englishTerm: input.word, koreanMeaning: general ? '명사: 흐름 / 형용사: 현재의' : '전류', specialization: general ? '일반' : '전기공학',
      notebookName: input.selectedSubject, englishDefinition: '(noun) a flow; (adjective) happening now.', koreanDefinition: '(명사) 흐름; (형용사) 지금 일어나는.',
      exampleSentence: 'The current is 2 A.', explanation: '-', recommendationReason: '-', relatedTerms: [], pos: general ? '명사, 형용사' : '명사', exampleKo: '전류는 2A이다.',
      ...(input.translateReference ? {referenceTranslation: '도선에 전류가 흐른다.'} : {})};
    return new Response(JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(output)}]}}]}));
  }});
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('lexicon-word-collector-v1') || 'null'));
    const status = () => page.locator('#analysis-status').textContent();
    async function openInput(query = '') {
      await page.goto(base + '/quick_capture/code.html' + query);
      await setupAnalysisClient(page, () => WordCollectorAI.setLocalServer(true));
    }
    // Fresh install: no notebooks at all (no default 일반 단어장).
    await page.goto(base + '/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    assert.equal(await read(), null);
    assert.equal(await page.locator('[data-subject]:visible').count(), 0);
    await openInput();
    assert.ok(await page.locator('#btn-dest-existing').isDisabled());
    assert.ok(await page.locator('#section-dest-new').isVisible());
    assert.ok(await page.locator('#no-notebooks').isVisible());
    assert.equal(await page.locator('label[for="new-notebook-input"]').textContent(), '새 단어장 이름 *');
    assert.equal(await page.locator('#btn-meaning-general').getAttribute('aria-pressed'), 'true');
    // Screen order: 1. 단어 2. 의미 기준 3. 단어장 선택 4. 참고자료.
    const top = selector => page.locator(selector).evaluate(element => element.getBoundingClientRect().top);
    await page.locator('#btn-meaning-major').click();          // shows all four cards (일반 의미 hides 4. 참고자료)
    const order = [await top('#term-unified-input'), await top('#btn-meaning-general'), await top('#btn-dest-existing'), await top('#context-sentence-input')];
    assert.deepEqual([...order].sort((a, b) => a - b), order, 'cards appear as 단어, 의미 기준, 단어장, 참고자료');
    await page.locator('#btn-meaning-general').click();
    // Missing input is reported in the same order: the word first, then the notebook name.
    await page.locator('#submit-action-btn').click();
    assert.equal(await status(), '한국어 또는 영어 단어를 입력하세요.');
    await page.locator('#term-unified-input').fill('current');
    await page.locator('#submit-action-btn').click();
    assert.equal(await status(), '새 단어장 이름을 입력해 주세요.');
    // 새 단어장 + 일반 의미.
    await page.locator('#new-notebook-input').fill('영어 단어');
    await page.locator('#submit-action-btn').click();
    await page.locator('#analysis-review').waitFor({state: 'visible'});
    assert.equal(sent.at(-1).meaningMode, 'general');
    assert.equal(sent.at(-1).selectedSubject, '영어 단어');
    assert.equal(await page.locator('#review-new-course').inputValue(), '영어 단어');
    assert.equal(await read(), null, 'nothing is saved before the review is saved');
    await page.locator('#save-action-btn').click();
    await page.waitForURL('**/words.html?**');
    assert.equal(await page.locator('header h1').textContent(), '영어 단어');
    let state = await read();
    const [bookId] = Object.keys(state.courses);
    assert.deepEqual(Object.values(state.terms).map(t => [t.course, t.discipline]), [[bookId, '일반']]);
    // 기존 단어장 + 전공 의미 (major name required) into the same notebook.
    await openInput();
    assert.equal(await page.locator('#btn-dest-existing').getAttribute('aria-pressed'), 'true');
    assert.deepEqual(await page.locator('#subject-select option').evaluateAll(options => options.map(o => o.textContent)), ['영어 단어']);
    await page.locator('#btn-meaning-major').click();
    await page.locator('#term-unified-input').fill('voltage');
    await page.locator('#submit-action-btn').click();
    assert.equal(await status(), '전공 의미를 고르면 전공명이나 학과명을 입력해 주세요. (예: 전기공학)');
    await page.locator('#major-input').fill('전기공학과');
    await page.locator('#submit-action-btn').click();
    await page.locator('#analysis-review').waitFor({state: 'visible'});
    assert.deepEqual([sent.at(-1).meaningMode, sent.at(-1).majorField, sent.at(-1).selectedSubject], ['major', '전기공학과', '영어 단어']);
    assert.equal(await page.locator('#review-course').inputValue(), bookId);
    assert.equal(await page.locator('#review-course').isDisabled(), false, 'the notebook can still be changed in the review');
    await page.locator('#save-action-btn').click();
    await page.waitForURL('**/words.html?**');
    state = await read();
    assert.deepEqual(Object.values(state.terms).map(t => t.course), [bookId, bookId]);
    // A new notebook may not reuse an existing name (input and review).
    const taken = '이미 있는 단어장 이름입니다. 다른 이름을 입력하거나 기존 단어장을 선택해 주세요.';
    await openInput();
    await page.locator('#btn-dest-new').click();
    await page.locator('#new-notebook-input').fill(' 영어  단어 ');
    await page.locator('#term-unified-input').fill('run');
    await page.locator('#submit-action-btn').click();
    assert.equal(await status(), taken);
    await page.locator('#new-notebook-input').fill('회로이론');
    await page.locator('#submit-action-btn').click();
    await page.locator('#analysis-review').waitFor({state: 'visible'});
    await page.locator('#review-new-course').fill('영어 단어');
    await page.locator('#save-action-btn').click();
    assert.equal(await status(), taken);
    await page.locator('#review-new-course').fill('');
    await page.locator('#save-action-btn').click();
    assert.equal(await status(), '새 단어장 이름을 입력해 주세요.');
    await page.locator('#review-new-course').fill('회로이론');
    await page.locator('#save-action-btn').click();
    await page.waitForURL('**/words.html?**');
    assert.equal(await page.locator('header h1').textContent(), '회로이론');
    // 일반 의미: the reference card is hidden and nothing typed there is sent (word only).
    await openInput();
    assert.equal(await page.locator('#reference-card').isVisible(), false, '일반 의미 hides 4. 참고자료');
    await page.locator('#btn-meaning-major').click();
    assert.equal(await page.locator('#reference-card').isVisible(), true, '전공 의미 shows 4. 참고자료');
    await page.locator('#context-sentence-input').fill('The current in the wire is 2 A.');
    await page.locator('#btn-meaning-general').click();
    assert.equal(await page.locator('#reference-card').isVisible(), false);
    await page.locator('#term-unified-input').fill('current');
    await page.locator('#submit-action-btn').click();
    await page.locator('#analysis-review').waitFor({state: 'visible'});
    assert.equal(sent.at(-1).meaningMode, 'general');
    assert.equal(sent.at(-1).referenceText, '', 'no reference sentence for 일반 의미');
    assert.equal(await page.locator('#review-context-field').isVisible(), false);
    // 전공 모름: the reference sentence is required; the review shows the field the analysis found.
    await openInput();
    await page.locator('#btn-meaning-context').click();
    assert.equal(await page.locator('#reference-card').isVisible(), true);
    assert.equal(await page.locator('#reference-required').isVisible(), true, 'required mark on the reference sentence');
    assert.equal(await page.locator('#section-meaning-major').isVisible(), false, 'no major field for 전공 모름');
    await page.locator('#term-unified-input').fill('current');
    await page.locator('#context-sentence-input').fill('');
    await page.locator('#submit-action-btn').click();
    assert.equal(await status(), '전공을 모를 때는 단어가 쓰인 참고 문장을 입력해 주세요.');
    await page.locator('#context-sentence-input').fill('The current in the wire is 2 A.');
    await page.locator('#submit-action-btn').click();
    await page.locator('#analysis-review').waitFor({state: 'visible'});
    assert.deepEqual([sent.at(-1).meaningMode, sent.at(-1).referenceText, sent.at(-1).majorField], ['context', 'The current in the wire is 2 A.', undefined]);
    assert.equal(await page.locator('#review-context-field').textContent(), '참고 문장으로 찾은 가장 관련 있는 전공: 전기공학');
    assert.equal(await page.locator('#review-context-field').isVisible(), true);
    // Going back to the input keeps 전공 모름 and the sentence.
    await page.locator('#review-back').click();
    await page.waitForURL('**/code.html**');
    assert.equal(await page.locator('#btn-meaning-context').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#context-sentence-input').inputValue(), 'The current in the wire is 2 A.');
    await page.goto(base + '/index.html');
    assert.equal(await page.locator('[data-subject]:visible').count(), 2);
    assert.deepEqual(errors, []);
    console.log('PASS: no default notebook; 의미 기준 일반 (no reference card, word only) / 전공 (major) / 전공 모름 (reference required, found field shown in the review) and 단어장 (existing/new, name required, no duplicates) chosen independently; saved notebooks appear on home.');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
