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
    // 모든 단어 (default): every English word except grammar words, plus 2–3 word terms
    // that appear at least twice ("skin effect" twice; "power factor correction" once: not a phrase).
    assert.equal(await page.locator('#mode-all').getAttribute('aria-pressed'), 'true');
    for (const term of ['skin effect', 'skin', 'effect', 'conductor', 'resistance', 'capacitors', 'high', 'increases', 'area', 'uses']) {
      assert.ok(terms.includes(term), `${term} in ${terms}`);
    }
    for (const grammar of ['the', 'of', 'at']) assert.ok(!terms.includes(grammar), grammar + ' is a grammar word');
    assert.deepEqual(terms.filter(term => /\s/.test(term)), ['skin effect'], 'only repeated phrases: ' + terms);
    assert.equal(terms[0], 'skin effect', 'a phrase comes first among equal counts');
    // 전공용어 위주: everyday words go; a word picked before switching stays picked.
    await pick('area');
    await page.locator('#mode-major').click();
    terms = await candidateTerms();
    for (const common of ['high', 'increases', 'area', 'uses']) assert.ok(!terms.includes(common), common + ' left out in 전공용어 위주');
    assert.ok(terms.includes('conductor') && terms.includes('resistance'));
    assert.match(await page.locator('#candidate-title').textContent(), /1개 선택/);
    await page.locator('#mode-all').click();
    assert.equal(await row('area').locator('input').isChecked(), true);
    await page.locator('#clear-selection').click();
    assert.equal(ocrCalls, 0, 'a text PDF is not sent to OCR');
    assert.equal(await row('skin').locator('.cand-count').textContent(), '2회');
    await noSideScroll('scan 390');

    // 1b. Several pages: only the one page entered is read, any page of the PDF.
    await openPdf('pages.pdf');
    assert.match(await page.locator('#pdf-page-total').textContent(), /3쪽/);
    assert.equal(await page.locator('#candidate-card').isVisible(), false, 'opening a PDF reads no page yet');
    // Page preview, like the photo preview: page 1 first, then 이전/다음 or a typed number.
    const previewSays = text => page.waitForFunction(t => document.getElementById('pdf-preview-status').textContent === t, text);
    const previewImage = () => page.locator('#pdf-preview').evaluate(canvas => canvas.toDataURL());
    await previewSays('1 / 3쪽');
    assert.equal(await page.locator('#pdf-preview').isVisible(), true);
    assert.equal(await page.locator('#pdf-prev').isDisabled(), true, 'no page before 1');
    const page1 = await previewImage();
    await page.locator('#pdf-next').click();
    await previewSays('2 / 3쪽');
    assert.equal(await page.locator('#pdf-page-input').inputValue(), '2');
    assert.notEqual(await previewImage(), page1, 'page 2 looks different');
    await page.locator('#pdf-next').click();
    await previewSays('3 / 3쪽');
    assert.equal(await page.locator('#pdf-next').isDisabled(), true, 'no page after the last');
    await page.locator('#pdf-page-input').fill('9');
    await previewSays('1부터 3 사이의 쪽 번호를 넣으면 미리 보여 드려요.');
    await page.locator('#pdf-page-input').fill('1');
    await previewSays('1 / 3쪽');
    assert.equal(await previewImage(), page1);
    assert.equal(await page.locator('#candidate-card').isVisible(), false, 'a preview reads no text');
    assert.equal(ocrCalls, 0);
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'pdf-preview-390.png')});
    await readPage(2);
    await page.locator('#candidate-card').waitFor({state: 'visible'});
    terms = await candidateTerms();
    assert.ok(terms.includes('hysteresis'), 'page 2: ' + terms);
    assert.ok(!terms.includes('armature') && !terms.includes('skin'), 'other pages are not read: ' + terms);
    assert.match(await page.locator('#scan-status').textContent(), /2쪽을 읽었어요/);
    await readPage(3);
    await page.waitForFunction(() => /3쪽을 읽었어요/.test(document.getElementById('scan-status').textContent));
    terms = await candidateTerms();
    assert.ok(terms.includes('armature') && !terms.includes('hysteresis'), 'page 3 replaces page 2: ' + terms);
    // The number box only takes one number (no ranges); out-of-range, decimal or empty is refused.
    for (const wrong of ['4', '0', '2.5', '']) {
      await readPage(wrong);
      assert.match(await page.locator('#scan-status').textContent(), /1부터 3 사이의 쪽 번호 하나/, 'refused: ' + wrong);
    }
    assert.equal(ocrCalls, 0);
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'pdf-page-390.png')});

    // 1c. Korean PDF whose font is not embedded (Word/HWP exports): its text layer is read
    // with the bundled CMaps (without them it was empty and nothing was found).
    await openPdf('korean-cid.pdf');
    await previewSays('1 / 1쪽');
    await readPage(1);
    await page.locator('#candidate-card').waitFor({state: 'visible'});
    terms = await candidateTerms();
    for (const term of ['rectifier', 'capacitor', 'inductor', 'impedance', 'reactance', 'resistance']) {
      assert.ok(terms.includes(term), `${term} in ${terms}`);
    }
    assert.ok(!terms.some(term => /^[A-Z][a-z]/.test(term)), 'Title Case terms in brackets are shown in lower case: ' + terms);
    assert.doesNotMatch(await page.locator('#scan-status').textContent(), /스캔한 쪽/, 'read from the text layer, not by OCR');
    assert.equal(ocrCalls, 0);

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
    assert.ok(terms.includes('skin') && terms.includes('conductor'), 'OCR of scanned page: ' + terms);
    assert.match(await page.locator('#scan-status').textContent(), /1쪽을 읽었어요\. \(스캔한 쪽이라 글자 인식/);

    // 4b. Phone-like photo of a Korean textbook page with English sentences (real OCR):
    // Korean lines read by the English model must not become made-up candidates.
    const ENGLISH_ON_PAGE = ('The impedance of an RLC circuit depends on the frequency. At resonance, the inductive ' +
      'reactance equals the capacitive reactance, and the current is maximum. The power factor is the ratio of real ' +
      'power to apparent power. A low power factor increases line losses. AC Circuits').toLowerCase();
    await page.locator('#pick-photo').setInputFiles(path.join(FIXTURES, 'mixed-photo.jpg'));
    await page.locator('#read-photo').click();
    await page.locator('#candidate-card').waitFor({state: 'visible', timeout: 120000});
    terms = await candidateTerms();
    for (const term of ['impedance', 'reactance', 'resonance', 'power', 'factor', 'capacitive', 'inductive']) {
      assert.ok(terms.includes(term), `${term} found in mixed photo: ${terms}`);
    }
    const madeUp = terms.filter(term => !term.toLowerCase().split(' ').every(word => ENGLISH_ON_PAGE.includes(word)));
    assert.deepEqual(madeUp, [], 'only words from the English sentences: ' + terms);
    // Sentences never show placeholder dots or the noise lines made from Korean text.
    for (const sentence of await page.locator('#candidate-list .cand-sentence').allTextContents()) {
      assert.doesNotMatch(sentence, /·|…\s*…/, sentence);
    }

    // 4c. Photo of a printed word table with handwriting, red circles and a shaded lower
    // part (real OCR). Automatic layout + the better of two black/white cut-offs must find
    // the English words in both tables, including the shaded rows.
    const TABLE_WORDS = ['photodiode', 'semiconductor', 'bandgap', 'graphene', 'substrate', 'junction', 'electrode',
      'photocurrent', 'capacitance', 'inductor', 'absorb', 'converted', 'apply', 'influence', 'modification',
      'incoming', 'illumination', 'subtracting', 'suppresses', 'filtering'];
    await page.locator('#pick-photo').setInputFiles(path.join(FIXTURES, 'table-photo.jpg'));
    await page.locator('#read-photo').click();
    await page.locator('#candidate-card').waitFor({state: 'visible', timeout: 180000});
    terms = (await candidateTerms()).map(term => term.toLowerCase());
    const tableFound = TABLE_WORDS.filter(word => terms.includes(word));
    assert.ok(tableFound.length >= 14, `table photo: ${tableFound.length}/20 found: ${terms}`);
    assert.ok(tableFound.includes('filtering') || tableFound.includes('suppresses'), 'shaded lower rows are read: ' + terms);
    assert.deepEqual(terms.filter(term => !TABLE_WORDS.includes(term)), [], 'no made-up words: ' + terms);

    // 4d. Out-of-focus and 12° tilted photos of a textbook page (real OCR). Before the
    // sharpen retry and the tilt straightening both gave 0 of 50 words.
    const PAGE_WORDS = new Set(require('../www/quick_capture/term-extract.js').extractCandidates(
      'Semiconductor devices control the flow of electric current through a crystal lattice. When a forward bias voltage ' +
      'is applied to a diode, electrons cross the junction and the current rises quickly. In a photodiode, incoming light ' +
      'generates electron and hole pairs, which produce a photocurrent proportional to the illumination. Engineers reduce ' +
      'the dark current by cooling the detector and by using a wider bandgap material. The capacitance of the depletion ' +
      'region decreases as the reverse bias increases. Thermal noise and shot noise limit the sensitivity of every optical receiver.')
      .filter(candidate => candidate.kind === 'word').map(candidate => candidate.term));
    for (const [file, label] of [['blurry-photo.jpg', 'out of focus'], ['tilted-photo.jpg', 'tilted 12°']]) {
      await page.evaluate(() => { const canvas = document.getElementById('photo-canvas'); canvas.width = canvas.height = 1; });
      await page.locator('#pick-photo').setInputFiles(path.join(FIXTURES, file));
      await page.waitForFunction(() => document.getElementById('photo-canvas').width > 1);
      await page.locator('#read-photo').click();
      await page.locator('#candidate-card').waitFor({state: 'visible', timeout: 180000});
      const read = (await candidateTerms()).map(term => term.toLowerCase());
      const found = [...PAGE_WORDS].filter(word => read.includes(word));
      assert.ok(found.length >= 40, `${label}: ${found.length}/${PAGE_WORDS.size} found: ${read}`);
    }

    // 5. Photo: preview, rotate, read with OCR.
    await page.locator('#pick-photo').setInputFiles(path.join(FIXTURES, 'photo.jpg'));
    await page.locator('#photo-card').waitFor({state: 'visible'});
    // Opening a new photo clears the previous candidates.
    await page.locator('#candidate-card').waitFor({state: 'hidden'});
    assert.equal(await page.locator('#pdf-page-card').isVisible(), false);
    const size = () => page.evaluate(() => [document.getElementById('photo-canvas').width, document.getElementById('photo-canvas').height]);
    const [w, h] = await size();
    await page.locator('#rotate-right').click();
    assert.deepEqual(await size(), [h, w]);
    await page.locator('#rotate-left').click();
    await page.locator('#read-photo').click();
    await page.locator('#candidate-card').waitFor({state: 'visible', timeout: 120000});
    terms = await candidateTerms();
    assert.ok(terms.includes('skin') && terms.includes('resistance'), 'OCR of photo: ' + terms);
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'scan-390.png')});

    // Filter and pick two words.
    await page.locator('#candidate-filter').fill('ski');
    assert.deepEqual(await candidateTerms(), ['skin effect', 'skin']);
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
    const pickedTerms = () => page.locator('.scan-selection-term').evaluateAll(inputs => inputs.map(input => input.value));
    assert.deepEqual(await pickedTerms(), ['skin effect', 'resistance']);
    // A picked word can be corrected before analysis ("resistance" → "AC resistance");
    // the correction is kept when the page is opened again.
    await page.locator('.scan-selection-term').nth(1).fill('AC resistance');
    await page.reload();
    await page.locator('#scan-selection-card').waitFor({state: 'visible'});
    assert.deepEqual(await pickedTerms(), ['skin effect', 'AC resistance']);
    // An emptied word is refused with a message; nothing is analysed.
    await page.locator('.scan-selection-term').nth(1).fill('  ');
    await page.locator('#submit-action-btn').click();
    assert.match(await page.locator('#analysis-status').textContent(), /2번째 고른 단어를 확인해 주세요/);
    assert.equal(await page.locator('.scan-selection-term').nth(1).evaluate(input => input === document.activeElement), true);
    assert.equal(requests.length, 0);
    await page.locator('.scan-selection-term').nth(1).fill('AC resistance');
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
    assert.equal(requests[1].word, 'AC resistance', 'the corrected word is analysed');
    assert.match(requests[1].referenceText, /resistance of the conductor/);
    await page.locator('#save-action-btn').click();
    await page.waitForURL('**/words.html?**');

    const words = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).terms));
    assert.deepEqual(words.map(word => word.en).sort(), ['AC resistance', 'skin effect']);
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

    // "AI로 더 정확하게 고르기" (mock server: no paid call). Only the read text is sent.
    await page.goto(base + '/quick_capture/scan.html');
    await fastOcr();
    await page.evaluate(() => WordCollectorAI.setLocalServer(true));
    const aiBodies = [];
    let aiReply = {status: 503, body: {error: 'AI 단어 고르기 기능이 아직 활성화되지 않았습니다.'}};
    await page.route('**/api/scan-terms', async route => {
      aiBodies.push(JSON.parse(route.request().postData()));
      await route.fulfill({status: aiReply.status, contentType: 'application/json', body: JSON.stringify(aiReply.body)});
    });
    const answerConfirm = accept => page.once('dialog', dialog => {
      assert.equal(dialog.type(), 'confirm');
      assert.match(dialog.message(), /사진이나 파일은 보내지 않아요[\s\S]*하루 분석 횟수 1회/);
      return accept ? dialog.accept() : dialog.dismiss();
    });
    await openPdf('text.pdf');
    await readPage(1);
    await page.locator('#candidate-card').waitFor({state: 'visible'});
    assert.equal(await page.locator('#mode-ai').isVisible(), false);
    // Cancelled: nothing is sent.
    answerConfirm(false);
    await page.locator('#ai-pick-btn').click();
    assert.equal(aiBodies.length, 0);
    // Server not ready yet (feature off): a clear message, the normal lists keep working.
    answerConfirm(true);
    await page.locator('#ai-pick-btn').click();
    await page.waitForFunction(() => /아직 사용할 수 없어요/.test(document.getElementById('scan-status').textContent));
    assert.equal(await page.locator('#mode-ai').isVisible(), false);
    assert.equal(await page.locator('#ai-pick-btn').isDisabled(), false);
    // Ready: the AI list appears as its own tab.
    aiReply = {status: 200, body: {model: 'gemini-4-hydrogen', terms: [
      {term: 'skin effect', count: 2, sentence: 'The skin effect increases the resistance of the conductor.'},
      {term: 'power factor correction', count: 1, sentence: 'Power factor correction uses capacitors.'}]}};
    answerConfirm(true);
    await page.locator('#ai-pick-btn').click();
    await page.locator('#mode-ai').waitFor({state: 'visible'});
    assert.equal(await page.locator('#mode-ai').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#ai-pick').isVisible(), false);
    assert.deepEqual(await candidateTerms(), ['skin effect', 'power factor correction']);
    assert.equal(aiBodies.length, 2);
    assert.deepEqual(Object.keys(aiBodies[1]).sort(), ['mode', 'text']);
    assert.equal(aiBodies[1].mode, 'all');
    assert.match(aiBodies[1].text, /Power factor correction uses capacitors/);
    await noSideScroll('scan AI 390');
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'scan-ai-390.png')});
    // A multi-word term picked from the AI list stays picked in the other lists and goes on as one word.
    await pick('power factor correction');
    await page.locator('#mode-all').click();
    assert.match(await page.locator('#candidate-title').textContent(), /1개 선택/);
    await page.locator('#scan-continue').click();
    await page.waitForURL('**/quick_capture/code.html');
    assert.deepEqual(await page.locator('.scan-selection-term').evaluateAll(inputs => inputs.map(input => input.value)),
      ['power factor correction']);
    await page.locator('#scan-selection-clear').click();
    await page.unroute('**/api/scan-terms');

    // "손글씨·흐린 사진은 AI로 읽기" (mock server: no paid call). The photo is sent only after a confirm.
    await page.goto(base + '/quick_capture/scan.html');
    await page.evaluate(() => {
      WordCollectorAI.setLocalServer(true);
      window.WordCollectorScanOverrides = {recognize: async () => 'Cell'};   // the device reads almost nothing
    });
    const photoBodies = [];
    let photoReply = {status: 503, body: {error: '사진 AI 읽기 기능이 아직 활성화되지 않았습니다.'}};
    await page.route('**/api/scan-image', async route => {
      photoBodies.push(JSON.parse(route.request().postData()));
      await route.fulfill({status: photoReply.status, contentType: 'application/json', body: JSON.stringify(photoReply.body)});
    });
    const answerPhotoConfirm = accept => page.once('dialog', dialog => {
      assert.match(dialog.message(), /Google\(Gemini\)로 보내[\s\S]*개인정보[\s\S]*저장하지 않아요[\s\S]*1회/);
      return accept ? dialog.accept() : dialog.dismiss();
    });
    await page.locator('#pick-photo').setInputFiles(path.join(FIXTURES, 'photo.jpg'));
    await page.waitForFunction(() => document.getElementById('photo-canvas').width > 1);
    await page.locator('#read-photo').click();
    await page.waitForFunction(() => /손글씨·흐린 사진은 AI로 읽기/.test(document.getElementById('scan-status').textContent));
    // Cancelled: nothing is sent.
    answerPhotoConfirm(false);
    await page.locator('#read-photo-ai').click();
    assert.equal(photoBodies.length, 0);
    // Server not ready yet.
    answerPhotoConfirm(true);
    await page.locator('#read-photo-ai').click();
    await page.waitForFunction(() => /사진 AI 읽기는 아직 사용할 수 없어요/.test(document.getElementById('scan-status').textContent));
    // Ready: the text Gemini read fills the lists; its terms are the "AI 추천" tab.
    photoReply = {status: 200, body: {model: 'gemini-4-hydrogen', text: 'Cloudflare Worker server\nCloud Run\nGemini file search API',
      terms: [{term: 'cloud run', count: 1, sentence: 'Cloud Run'}, {term: 'gemini file search API', count: 1, sentence: 'Gemini file search API'}]}};
    answerPhotoConfirm(true);
    await page.locator('#read-photo-ai').click();
    await page.locator('#mode-ai').waitFor({state: 'visible'});
    assert.deepEqual(await candidateTerms(), ['cloud run', 'gemini file search API']);
    assert.equal(photoBodies.length, 2);
    assert.deepEqual(Object.keys(photoBodies[1]).sort(), ['image', 'mimeType', 'mode']);
    assert.equal(photoBodies[1].mimeType, 'image/jpeg');
    assert.match(photoBodies[1].image, /^\/9j\//, 'a JPEG');
    assert.ok(photoBodies[1].image.length * 3 / 4 <= 1.4 * 1024 * 1024);
    await page.locator('#mode-all').click();
    terms = await candidateTerms();
    for (const term of ['cloudflare', 'worker', 'server', 'cloud', 'run', 'gemini']) assert.ok(terms.includes(term), term + ' in ' + terms);
    assert.equal(await row('cloudflare').locator('.cand-sentence').textContent(), 'Cloudflare Worker server', 'one line = one sentence');
    await noSideScroll('photo AI 390');
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'photo-ai-390.png')});
    await page.unroute('**/api/scan-image');
    await page.evaluate(() => { delete window.WordCollectorScanOverrides; });

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
