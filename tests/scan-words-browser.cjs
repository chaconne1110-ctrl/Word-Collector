// PDF·사진에서 단어 찾기: upload → candidates → pick → analysis request carries the
// original sentence as the reference sentence → review → save, one word after another.
// The analysis API is a local mock (no billable calls). OCR is the real on-device
// engine (www/vendor/tesseract) on small fixtures; some cases replace it (fast or never ending).
const assert = require('node:assert/strict');
const path = require('node:path');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {setupAnalysisClient} = require('./browser-client-fixture.cjs');
const {createServer} = require('../server/server.cjs');

const FIXTURES = path.join(__dirname, 'fixtures', 'scan');
const SHOTS = process.env.SCAN_SCREENSHOT_DIR || '';

(async () => {
  const requests = [];
  const server = createServer({apiKey: 'test-only', fetchImpl: async (_, init) => {
    const input = JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
    requests.push(input);
    return new Response(JSON.stringify({candidates: [{finishReason: 'STOP', content: {parts: [{text: JSON.stringify({
      englishTerm: input.word, koreanMeaning: '뜻 ' + input.word, specialization: '전기공학', notebookName: '전기',
      englishDefinition: 'A definition.', koreanDefinition: '정의.', exampleSentence: input.referenceText || 'Example.',
      exampleKo: '예문 번역.', pos: 'noun', explanation: '설명', recommendationReason: '문맥', relatedTerms: [],
      referenceTranslation: '참고 문장 번역.'
    })}]}}]}));
  }});
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
    const context = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      if (!localStorage.getItem('lexicon-word-collector-v1')) {
        localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({courses: {test: ['전기', '']}, terms: {}, saved: []}));
      }
    });
    const noSideScroll = async label => {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 0, `${label}: horizontal scroll ${overflow}px`);
    };
    const candidateTerms = () => page.locator('#candidate-list .cand-term').allTextContents();
    const row = term => page.locator('#candidate-list li').filter({has: page.getByText(term, {exact: true})});
    const pick = term => row(term).locator('label').click();
    // Open a PDF (page count only), then read the one page entered.
    const openPdf = async file => {
      await page.locator('#pick-pdf').setInputFiles(path.join(FIXTURES, file));
      await page.locator('#pdf-page-card').waitFor({state: 'visible'});
    };
    const readPage = async number => {
      await page.locator('#pdf-page-input').fill(String(number));
      await page.locator('#pdf-read-page').click();
    };
    const fastOcr = () => page.evaluate(() => { window.WordCollectorScanOverrides = {recognize: async () => ''}; });

    // Entry point on the input page; the 4 input cards are unchanged.
    await page.goto(base + '/quick_capture/code.html?course=test');
    assert.equal(await page.locator('#scan-entry').isVisible(), true);
    assert.equal(await page.locator('#term-card').isVisible(), true);
    await page.locator('#scan-entry').click();
    await page.waitForURL('**/quick_capture/scan.html?course=test');

    // 1. PDF with a text layer: read directly, no OCR.
    let ocrCalls = 0;
    await page.exposeFunction('countOcr', () => { ocrCalls++; });
    await page.evaluate(() => {
      window.WordCollectorScanOverrides = {recognize: async () => { await window.countOcr(); return ''; }};
    });
    await openPdf('text.pdf');
    await readPage(1);
    await page.locator('#candidate-card').waitFor({state: 'visible'});
    let terms = await candidateTerms();
    for (const term of ['skin effect', 'conductor', 'resistance', 'capacitors']) assert.ok(terms.includes(term), `${term} in ${terms}`);
    for (const common of ['the', 'high', 'increases', 'area', 'uses']) assert.ok(!terms.includes(common), `${common} is excluded`);
    assert.equal(ocrCalls, 0, 'a text PDF is not sent to OCR');
    assert.equal(await row('skin effect').locator('.cand-count').textContent(), '2회');
    await noSideScroll('scan 390');

    // 1b. Several pages: only the one page entered is read, any page of the PDF.
    await openPdf('pages.pdf');
    assert.match(await page.locator('#pdf-page-total').textContent(), /3쪽/);
    assert.equal(await page.locator('#candidate-card').isVisible(), false, 'opening a PDF reads no page yet');
    await readPage(2);
    await page.locator('#candidate-card').waitFor({state: 'visible'});
    terms = await candidateTerms();
    assert.ok(terms.includes('hysteresis loop'), 'page 2: ' + terms);
    assert.ok(!terms.includes('armature winding') && !terms.includes('skin effect'), 'other pages are not read: ' + terms);
    assert.match(await page.locator('#scan-status').textContent(), /2쪽을 읽었어요/);
    await readPage(3);
    await page.waitForFunction(() => /3쪽을 읽었어요/.test(document.getElementById('scan-status').textContent));
    terms = await candidateTerms();
    assert.ok(terms.includes('armature winding') && !terms.includes('hysteresis loop'), 'page 3 replaces page 2: ' + terms);
    // The number box only takes one number (no ranges); out-of-range, decimal or empty is refused.
    for (const wrong of ['4', '0', '2.5', '']) {
      await readPage(wrong);
      assert.match(await page.locator('#scan-status').textContent(), /1부터 3 사이의 쪽 번호 하나/, 'refused: ' + wrong);
    }
    assert.equal(ocrCalls, 0);
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'pdf-page-390.png')});

    // 2. Limits: a photo over 10MB is refused with a message.
    await page.locator('#pick-photo').setInputFiles({name: 'big.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(10 * 1024 * 1024 + 1)});
    await page.waitForFunction(() => document.getElementById('scan-status').textContent.includes('10MB'));

    // 3. Cancel: a recognition that never ends stops at once and the inputs come back.
    await page.evaluate(() => { window.WordCollectorScanOverrides = {recognize: () => new Promise(() => {})}; });
    await openPdf('scanned.pdf');
    await readPage(1);
    await page.waitForFunction(() => document.getElementById('scan-progress-text').textContent.includes('글자 인식'));
    await page.locator('#scan-cancel').click();
    assert.equal(await page.locator('#progress-card').isVisible(), false);
    assert.equal(await page.locator('#pick-pdf').isDisabled(), false);
    assert.match(await page.locator('#scan-status').textContent(), /취소/);
    // The PDF stays open: the page can be read again without picking the file again.
    assert.equal(await page.locator('#pdf-page-card').isVisible(), true);
    assert.equal(await page.locator('#pdf-read-page').isDisabled(), false);

    // 4. Scanned PDF page (no text layer): the real on-device OCR reads it.
    await page.evaluate(() => { delete window.WordCollectorScanOverrides; });
    await readPage(1);
    await page.locator('#candidate-card').waitFor({state: 'visible', timeout: 120000});
    terms = await candidateTerms();
    assert.ok(terms.includes('skin effect') && terms.includes('conductor'), 'OCR of scanned page: ' + terms);
    assert.match(await page.locator('#scan-status').textContent(), /1쪽을 읽었어요\. \(스캔한 쪽이라 글자 인식/);

    // 5. Photo: preview, rotate, read with OCR.
    await page.locator('#pick-photo').setInputFiles(path.join(FIXTURES, 'photo.jpg'));
    await page.locator('#photo-card').waitFor({state: 'visible'});
    assert.equal(await page.locator('#candidate-card').isVisible(), false);
    assert.equal(await page.locator('#pdf-page-card').isVisible(), false);
    const size = () => page.evaluate(() => [document.getElementById('photo-canvas').width, document.getElementById('photo-canvas').height]);
    const [w, h] = await size();
    await page.locator('#rotate-right').click();
    assert.deepEqual(await size(), [h, w]);
    await page.locator('#rotate-left').click();
    await page.locator('#read-photo').click();
    await page.locator('#candidate-card').waitFor({state: 'visible', timeout: 120000});
    terms = await candidateTerms();
    assert.ok(terms.includes('skin effect') && terms.includes('resistance'), 'OCR of photo: ' + terms);
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'scan-390.png')});

    // Filter and pick two words.
    await page.locator('#candidate-filter').fill('skin');
    assert.deepEqual(await candidateTerms(), ['skin effect']);
    await pick('skin effect');
    await page.locator('#candidate-filter').fill('');
    await pick('resistance');
    assert.match(await page.locator('#candidate-title').textContent(), /2개 선택/);
    assert.match(await page.locator('#scan-continue').textContent(), /2개/);
    await page.locator('#scan-continue').click();
    await page.waitForURL('**/quick_capture/code.html?course=test');

    // Input page: the picked words replace card 1; 전공 모름 is chosen; notebook as usual.
    await page.locator('#scan-selection-card').waitFor({state: 'visible'});
    assert.equal(await page.locator('#term-card').isVisible(), false);
    assert.deepEqual(await page.locator('#scan-selection-list li p.font-semibold').allTextContents(), ['skin effect', 'resistance']);
    assert.equal(await page.locator('#btn-meaning-context').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#context-sentence-input').isVisible(), false);
    assert.match(await page.locator('#submit-btn-text').textContent(), /2개/);
    await noSideScroll('input 390');
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'input-390.png')});
    // Nothing from the file is kept except the picked words and their sentences.
    const stored = await page.evaluate(() => JSON.stringify({...sessionStorage}) + JSON.stringify({...localStorage}));
    assert.ok(!stored.includes('Power factor correction uses capacitors'), 'unpicked text is not stored');

    // Analyse → review → save, word 1 of 2.
    await page.locator('#btn-dest-existing').click();
    await setupAnalysisClient(page, () => WordCollectorAI.setLocalServer(true));
    await page.locator('#submit-action-btn').click();
    await page.locator('#analysis-review').waitFor({state: 'visible'});
    assert.match(await page.locator('#analysis-review h2').textContent(), /\(1\/2\)/);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].word, 'skin effect');
    assert.equal(requests[0].meaningMode, 'context');
    assert.equal(requests[0].referenceText, 'The skin effect increases the resistance of the conductor.');
    assert.equal(await page.locator('#batch-skip').isVisible(), true);
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'review-390.png')});
    await page.locator('#save-action-btn').click();

    // Word 2 of 2 opens by itself; its own sentence is the reference.
    await page.waitForFunction(() => /\(2\/2\)/.test(document.querySelector('#analysis-review h2')?.textContent || '') &&
      document.getElementById('analysis-review')?.hidden === false);
    assert.equal(requests.length, 2);
    assert.equal(requests[1].word, 'resistance');
    assert.match(requests[1].referenceText, /resistance of the conductor/);
    await page.locator('#save-action-btn').click();
    await page.waitForURL('**/words.html?**');

    const words = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).terms));
    assert.deepEqual(words.map(word => word.en).sort(), ['resistance', 'skin effect']);
    assert.ok(words.every(word => word.course === 'test' && /conductor/.test(word.referenceSentence)));
    assert.equal(await page.evaluate(() => sessionStorage.getItem('word-collector-scan-selection-v1')), null);

    // Skip: pick two again into a NEW notebook with 일반 의미, skip the first, save the second.
    await page.goto(base + '/quick_capture/scan.html');
    await fastOcr();
    await openPdf('text.pdf');
    await readPage(1);
    await page.locator('#candidate-card').waitFor({state: 'visible'});
    await pick('conductor');
    await pick('capacitors');
    await page.locator('#scan-continue').click();
    await page.waitForURL('**/quick_capture/code.html');
    await page.locator('#btn-meaning-general').click();
    await page.locator('#btn-dest-new').click();
    await page.locator('#new-notebook-input').fill('PDF 단어');
    await setupAnalysisClient(page, () => WordCollectorAI.setLocalServer(true));
    await page.locator('#submit-action-btn').click();
    await page.locator('#analysis-review').waitFor({state: 'visible'});
    assert.equal(requests.at(-1).word, 'conductor');
    assert.equal(requests.at(-1).meaningMode, 'general');
    assert.ok(!requests.at(-1).referenceText, '일반 의미 sends no reference sentence (existing rule)');
    await page.locator('#batch-skip').click();
    await page.waitForFunction(() => /\(2\/2\)/.test(document.querySelector('#analysis-review h2')?.textContent || '') &&
      document.getElementById('analysis-review')?.hidden === false);
    assert.equal(requests.at(-1).word, 'capacitors');
    assert.match(await page.locator('#batch-skip').textContent(), /마치기/);
    await page.locator('#save-action-btn').click();
    await page.waitForURL('**/words.html?**');
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('lexicon-word-collector-v1')));
    const newBook = Object.entries(after.courses).find(([, [name]]) => name === 'PDF 단어');
    assert.ok(newBook, 'new notebook created');
    assert.deepEqual(Object.values(after.terms).filter(word => word.course === newBook[0]).map(word => word.en), ['capacitors']);

    // 320px: no overlap or horizontal scroll on the scan and input pages.
    await page.setViewportSize({width: 320, height: 640});
    await page.goto(base + '/quick_capture/scan.html');
    await fastOcr();
    await openPdf('text.pdf');
    await readPage(1);
    await page.locator('#candidate-card').waitFor({state: 'visible'});
    await page.locator('#candidate-list label').first().click();
    await noSideScroll('scan 320');
    const bar = await page.locator('#scan-continue').boundingBox();
    const nav = await page.locator('nav.bottom-navigation').boundingBox();
    assert.ok(bar.y + bar.height <= nav.y + 1, 'continue button above the bottom navigation');
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'scan-320.png')});
    await page.locator('#scan-continue').click();
    await page.waitForURL('**/quick_capture/code.html');
    await page.locator('#scan-selection-card').waitFor({state: 'visible'});
    await noSideScroll('input 320');
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'input-320.png')});
    // 직접 입력하기 returns to the normal input.
    await page.locator('#scan-selection-clear').click();
    assert.equal(await page.locator('#term-card').isVisible(), true);
    assert.equal(await page.locator('#scan-selection-card').isVisible(), false);

    // Licence notice page opens and the licence texts are served.
    await page.goto(base + '/licenses.html');
    assert.match(await page.locator('main').textContent(), /Tesseract\.js[\s\S]*Apache License 2\.0/);
    assert.equal((await page.request.get(base + '/vendor/tesseract/LICENSE-tesseract.js.txt')).status(), 200);

    assert.deepEqual(errors, []);
    console.log('scan words browser test passed');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
