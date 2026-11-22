// PDF·사진에서 단어 찾기 (scan.html).
// 1. The user picks a PDF, takes a photo or picks one from the album.
// 2. Text is read on this device only: a PDF's text layer with PDF.js; pages without
//    text (scans) and photos are rendered to a canvas and read with Tesseract.js (English).
// 3. term-extract.js lists major-term candidates with their count and first sentence.
// 4. The picked words and their sentences (nothing else) go back to the input page
//    (code.html) in sessionStorage; that page runs the usual analysis → review → save.
// The file and the full recognised text are never stored.
(function() {
  'use strict';
  const SCAN_SELECTION_KEY = 'word-collector-scan-selection-v1';
  const LIMITS = {pdfBytes: 50 * 1024 * 1024, imageBytes: 10 * 1024 * 1024};
  const MAX_IMAGE_SIDE = 2400;       // OCR input size (long side, px)
  const PDF_RENDER_WIDTH = 2000;     // scanned PDF pages are rendered this wide for OCR
  const MIN_TEXT_LETTERS = 30;       // fewer letters on a page = treat the page as a scan
  const vendor = path => new URL('../vendor/' + path, location.href).href;
  const $ = selector => document.querySelector(selector);

  const status = $('#scan-status');
  const pickCard = $('#scan-pick-card');
  const photoCard = $('#photo-card');
  const photoCanvas = $('#photo-canvas');
  const pdfCard = $('#pdf-page-card');
  const pageInput = $('#pdf-page-input');
  const progressCard = $('#progress-card');
  const progressText = $('#scan-progress-text');
  const progressBar = $('#scan-progress-bar');
  const candidateCard = $('#candidate-card');
  const candidateList = $('#candidate-list');
  const filterInput = $('#candidate-filter');
  const actionBar = $('#scan-action-bar');
  const continueButton = $('#scan-continue');

  function setStatus(message, kind = '') {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  // ---- 진행률·취소 -------------------------------------------------------------
  let run = null;   // {cancelled, cleanups: []}
  class Cancelled extends Error { constructor() { super('cancelled'); this.name = 'Cancelled'; } }
  function startRun() {
    cancelRun();
    run = {cancelled: false, cleanups: []};
    pickCard.querySelectorAll('input').forEach(input => { input.disabled = true; });
    for (const control of [...photoCard.querySelectorAll('button'), ...pdfCard.querySelectorAll('button, input')]) control.disabled = true;
    progressCard.hidden = false;
    progressBar.removeAttribute('value');
    return run;
  }
  function check(current) { if (current.cancelled || current !== run) throw new Cancelled(); }
  function progress(current, text, value) {
    if (current !== run) return;
    progressText.textContent = text;
    if (typeof value === 'number' && Number.isFinite(value)) progressBar.value = Math.max(0, Math.min(1, value));
    else progressBar.removeAttribute('value');
  }
  function endRun(current) {
    if (current !== run) return;
    for (const cleanup of current.cleanups.splice(0)) { try { cleanup(); } catch {} }
    run = null;
    progressCard.hidden = true;
    pickCard.querySelectorAll('input').forEach(input => { input.disabled = false; });
    for (const control of [...photoCard.querySelectorAll('button'), ...pdfCard.querySelectorAll('button, input')]) control.disabled = false;
    updatePdfNav();   // 이전/다음 stay off at the first/last page
  }
  function cancelRun() {
    if (!run) return;
    run.cancelled = true;
    // Stopping the OCR worker is the only way to interrupt a page being recognised.
    void terminateOcr();
    endRun(run);
  }
  $('#scan-cancel').addEventListener('click', () => {
    cancelRun();
    setStatus('읽기를 취소했어요.');
  });
  window.addEventListener('pagehide', () => { cancelRun(); closePdf(); });

  // ---- 글자 인식 (Tesseract.js, 영어, 기기 안에서) -------------------------------------
  let ocrWorker = null;
  let ocrProgress = () => {};
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('글자 인식 도구를 불러오지 못했습니다.'));
      document.head.append(script);
    });
  }
  // WebAssembly SIMD makes recognition faster; older WebViews use the plain build.
  const SIMD_PROBE = new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]);
  async function getOcr() {
    if (ocrWorker) return ocrWorker;
    if (!window.Tesseract) await loadScript(vendor('tesseract/tesseract.min.js'));
    const simd = (() => { try { return WebAssembly.validate(SIMD_PROBE); } catch { return false; } })();
    ocrWorker = await window.Tesseract.createWorker('eng', 1, {
      workerPath: vendor('tesseract/worker.min.js'),
      corePath: vendor(simd ? 'tesseract/tesseract-core-simd-lstm.js' : 'tesseract/tesseract-core-lstm.js'),
      langPath: vendor('tesseract/lang'),
      gzip: true,
      cacheMethod: 'none',        // the data ships with the app: nothing to download or cache
      workerBlobURL: false,       // the engine is loaded next to worker.min.js (works offline in the app)
      logger: message => ocrProgress(message)
    });
    return ocrWorker;
  }
  async function terminateOcr() {
    const worker = ocrWorker;
    ocrWorker = null;
    if (worker) { try { await worker.terminate(); } catch {} }
  }
  async function recognizeCanvas(canvas, onProgress) {
    // Tests replace recognition with a fast stand-in.
    const override = window.WordCollectorScanOverrides?.recognize;
    if (typeof override === 'function') return override(canvas, onProgress);
    const worker = await getOcr();
    // Two reads of the same picture, keeping the one with more sure words:
    // - one black/white cut-off for the whole picture (Otsu): best for even, grainy pictures
    // - a local cut-off around each spot (Sauvola): best when the light is uneven, e.g. the
    //   lower part of a page photographed under a lamp, which the single cut-off turns into
    //   a dark blur (a table photo went from 25 to 37 of 39 words).
    // Layout: automatic page segmentation (PSM 3) finds the separate columns and lines of
    // tables; the library default (one uniform block) read only 3 words of that table.
    let best = {text: '', sure: -1};
    for (const [index, method] of ['0', '2'].entries()) {
      ocrProgress = message => {
        if (message?.status === 'recognizing text') onProgress((index + message.progress) / 2);
      };
      await worker.setParameters({tessedit_pageseg_mode: '3', thresholding_method: method});
      const {data} = await worker.recognize(canvas, {}, {blocks: true, text: true});
      const text = confidentText(data);
      const sure = (text.match(/[A-Za-z]{2,}/g) || []).length;
      if (sure > best.sure) best = {text, sure};
    }
    return best.text;
  }
  // Keep only words the engine is sure of. English text reads at 90+; Korean letters,
  // symbols, reflections and smudges forced into the English model come out as
  // made-up words ("LFE", "epic", "olth") scored mostly below 80.
  // - A line where fewer than half the words are sure is noise: it is left out.
  // - Inside a kept line, a run of dropped words shows as one "…" in the sentence.
  const MIN_WORD_CONFIDENCE = 85;
  function confidentLine(line) {
    const words = (line.words || []).filter(word => /[A-Za-z0-9]/.test(word.text || ''));
    const sure = words.filter(word => word.confidence >= MIN_WORD_CONFIDENCE);
    if (!sure.length || sure.length * 2 < words.length) return '';
    return words.map(word => word.confidence >= MIN_WORD_CONFIDENCE ? word.text : '…').join(' ')
      .replace(/…(?:\s*…)+/g, '…').replace(/^…\s*|\s*…$/g, '');
  }
  function confidentText(data) {
    if (!Array.isArray(data?.blocks)) return data?.text || '';
    return data.blocks.map(block => (block.paragraphs || []).map(paragraph =>
      // A left-out line ends the sentence there (blank line), so text never runs across it.
      (paragraph.lines || []).map(confidentLine).join('\n').replace(/\n{2,}/g, '\n\n').replace(/^\n+|\n+$/g, '')
    ).join('\n\n')).join('\n\n');
  }

  // ---- PDF (PDF.js) --------------------------------------------------------------
  let pdfjsLib = null;
  async function getPdfjs() {
    if (pdfjsLib) return pdfjsLib;
    pdfjsLib = await import(vendor('pdfjs/pdf.min.js'));
    pdfjsLib.GlobalWorkerOptions.workerSrc = vendor('pdfjs/pdf.worker.min.js');
    return pdfjsLib;
  }
  const letterCount = text => (text.match(/[A-Za-z]/g) || []).length;

  // A PDF is opened once (page count only); then the user enters ONE page number and
  // only that page is read. Another page can be read afterwards without reopening.
  let openPdfDoc = null;   // {pdf, task, name}
  function closePdf() {
    const open = openPdfDoc;
    openPdfDoc = null;
    previewNumber = 0;
    previewCanvas.hidden = true;
    previewStatus.textContent = '';
    if (open) void open.task.destroy();
  }
  async function openPdf(file, current) {
    if (file.size > LIMITS.pdfBytes) throw new Error('PDF가 너무 커요. 50MB 이하 파일을 골라 주세요.');
    progress(current, 'PDF를 여는 중…');
    const pdfjs = await getPdfjs();
    check(current);
    const task = pdfjs.getDocument({data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false});
    const cleanup = () => { void task.destroy(); };
    current.cleanups.push(cleanup);
    let pdf;
    try { pdf = await task.promise; }
    catch (error) {
      if (error?.name === 'PasswordException') throw new Error('암호가 걸린 PDF는 읽을 수 없어요.');
      throw new Error('PDF를 열지 못했어요. 파일이 손상되지 않았는지 확인해 주세요.');
    }
    check(current);
    // Opened: keep it for reading pages (it stays in memory only, never stored).
    current.cleanups.splice(current.cleanups.indexOf(cleanup), 1);
    openPdfDoc = {pdf, task, name: file.name};
    return pdf;
  }
  async function readPdfPage(pdf, number, current) {
    progress(current, `${number}쪽 읽는 중…`);
    const page = await pdf.getPage(number);
    check(current);
    const content = await page.getTextContent();
    let text = content.items.map(item => (item.str || '') + (item.hasEOL ? '\n' : '')).join('');
    let scanned = false;
    if (letterCount(text) < MIN_TEXT_LETTERS) {
      // No text layer (scanned page): draw the page and read it with OCR.
      scanned = true;
      const base = page.getViewport({scale: 1});
      const viewport = page.getViewport({scale: Math.min(3, PDF_RENDER_WIDTH / base.width)});
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({canvasContext: context, canvas, viewport}).promise;
      check(current);
      progress(current, `${number}쪽 글자 인식 중… (스캔한 쪽)`, 0);
      text = await recognizeCanvas(canvas, value => progress(current, `${number}쪽 글자 인식 중… (스캔한 쪽)`, value));
      canvas.width = canvas.height = 0;
    }
    page.cleanup();
    progress(current, '단어를 찾는 중…', 1);
    return {text, notes: [`${number}쪽을 읽었어요.` + (scanned ? ' (스캔한 쪽이라 글자 인식으로 읽었어요)' : '')]};
  }

  // ---- 사진 --------------------------------------------------------------------
  let photo = null;     // {bitmap, rotation}
  async function decodeImage(file) {
    if (window.createImageBitmap) {
      try { return await createImageBitmap(file, {imageOrientation: 'from-image'}); } catch {}
    }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      return image;
    } finally { URL.revokeObjectURL(url); }
  }
  function drawPhoto(canvas, maxSide) {
    const {bitmap, rotation} = photo;
    const width = bitmap.width, height = bitmap.height;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const w = Math.round(width * scale), h = Math.round(height * scale);
    const turned = rotation % 180 !== 0;
    canvas.width = turned ? h : w;
    canvas.height = turned ? w : h;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(rotation * Math.PI / 180);
    context.drawImage(bitmap, -w / 2, -h / 2, w, h);
    context.restore();
  }
  async function openPhoto(file) {
    if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name)) {
      throw new Error('사진 파일(JPG, PNG 등)을 골라 주세요.');
    }
    if (file.size > LIMITS.imageBytes) throw new Error('사진이 너무 커요. 10MB 이하 사진을 골라 주세요.');
    let bitmap;
    try { bitmap = await decodeImage(file); }
    catch { throw new Error('이 사진을 열지 못했어요. JPG나 PNG 사진으로 다시 시도해 주세요.'); }
    photo = {bitmap, rotation: 0};
    closePdf();
    pdfCard.hidden = true;
    drawPhoto(photoCanvas, 900);
    photoCard.hidden = false;
    hideCandidates();
    setStatus('');
    photoCard.scrollIntoView({block: 'start'});
  }
  function rotatePhoto(step) {
    if (!photo || run) return;
    photo.rotation = (photo.rotation + step + 360) % 360;
    drawPhoto(photoCanvas, 900);
  }
  $('#rotate-left').addEventListener('click', () => rotatePhoto(-90));
  $('#rotate-right').addEventListener('click', () => rotatePhoto(90));
  $('#read-photo').addEventListener('click', async () => {
    if (!photo || run) return;
    const current = startRun();
    try {
      progress(current, '글자 인식 준비 중… (처음 한 번은 조금 걸려요)');
      const canvas = document.createElement('canvas');
      drawPhoto(canvas, MAX_IMAGE_SIDE);
      const text = await recognizeCanvas(canvas, value => progress(current, '사진의 글자를 읽는 중…', value));
      canvas.width = canvas.height = 0;
      check(current);
      showResult(text, []);
    } catch (error) {
      if (!current.cancelled) handleError(error);
    } finally { endRun(current); }
  });

  // ---- 파일 고르기 ----------------------------------------------------------------
  async function handlePdf(file) {
    photoCard.hidden = true;
    photo = null;
    closePdf();
    pdfCard.hidden = true;
    hideCandidates();
    const current = startRun();
    try {
      const pdf = await openPdf(file, current);
      check(current);
      // Only the page count is read here; the user then enters one page to read.
      $('#pdf-page-total').textContent = `이 PDF는 ${pdf.numPages}쪽이에요. 미리보기로 확인하고 읽을 쪽을 골라 주세요.`;
      pageInput.max = String(pdf.numPages);
      pageInput.value = '1';
      pdfCard.hidden = false;
    } catch (error) {
      if (!current.cancelled) handleError(error);
    } finally { endRun(current); }
    if (!pdfCard.hidden) {
      pdfCard.scrollIntoView({block: 'start'});
      void showPreview(1);
    }
  }

  // ---- PDF 쪽 미리보기 -------------------------------------------------------------
  // Like the photo preview: the chosen page is drawn (no text reading, no OCR) so the
  // user can check it before "이 쪽 읽기". Switching pages quickly cancels the old drawing.
  const previewCanvas = $('#pdf-preview');
  const previewStatus = $('#pdf-preview-status');
  let previewNumber = 0;
  let previewTask = null;
  let previewTimer = 0;
  function updatePdfNav() {
    const total = openPdfDoc?.pdf.numPages || 0;
    $('#pdf-prev').disabled = Boolean(run) || !total || previewNumber <= 1;
    $('#pdf-next').disabled = Boolean(run) || !total || previewNumber >= total;
  }
  async function showPreview(number) {
    const open = openPdfDoc;
    if (!open) return;
    const total = open.pdf.numPages;
    clearTimeout(previewTimer);
    try { previewTask?.cancel(); } catch {}
    previewTask = null;
    if (!Number.isInteger(number) || number < 1 || number > total) {
      previewNumber = 0;
      previewCanvas.hidden = true;
      previewStatus.textContent = `1부터 ${total} 사이의 쪽 번호를 넣으면 미리 보여 드려요.`;
      updatePdfNav();
      return;
    }
    previewNumber = number;
    updatePdfNav();
    previewStatus.textContent = `${number}쪽 불러오는 중…`;
    const stale = () => openPdfDoc !== open || previewNumber !== number;
    try {
      const page = await open.pdf.getPage(number);
      if (stale()) return;
      const base = page.getViewport({scale: 1});
      // Fits the box width and at most ~45% of the screen height, keeping the page's shape.
      const boxWidth = Math.max(160, Math.min((previewCanvas.parentElement.clientWidth || 320) - 18, 600));
      const maxHeight = Math.max(220, window.innerHeight * 0.45);
      const cssWidth = Math.min(boxWidth, maxHeight * base.width / base.height);
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const viewport = page.getViewport({scale: cssWidth * ratio / base.width});
      // Drawn off screen first so the old page stays visible until the new one is ready.
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const task = page.render({canvasContext: context, canvas, viewport});
      previewTask = task;
      await task.promise;
      if (stale()) return;
      previewCanvas.width = canvas.width;
      previewCanvas.height = canvas.height;
      previewCanvas.getContext('2d').drawImage(canvas, 0, 0);
      previewCanvas.style.width = Math.round(cssWidth) + 'px';
      previewCanvas.hidden = false;
      previewCanvas.setAttribute('aria-label', `${number}쪽 미리보기`);
      previewStatus.textContent = `${number} / ${total}쪽`;
      canvas.width = canvas.height = 0;
    } catch (error) {
      if (error?.name === 'RenderingCancelledException' || stale()) return;
      previewStatus.textContent = `${number}쪽을 미리 보지 못했어요. 그래도 읽을 수는 있어요.`;
    } finally {
      if (previewTask && stale()) previewTask = null;
    }
  }
  function goToPage(number) {
    if (run || !openPdfDoc) return;
    pageInput.value = String(number);
    void showPreview(number);
  }
  $('#pdf-prev').addEventListener('click', () => goToPage(previewNumber - 1));
  $('#pdf-next').addEventListener('click', () => goToPage(previewNumber + 1));
  pageInput.addEventListener('input', () => {
    clearTimeout(previewTimer);
    const raw = pageInput.value.trim();
    previewTimer = setTimeout(() => void showPreview(/^\d+$/.test(raw) ? Number(raw) : NaN), 300);
  });
  async function readChosenPage() {
    const open = openPdfDoc;
    if (!open || run) return;
    const total = open.pdf.numPages;
    const raw = pageInput.value.trim();
    const number = Number(raw);
    if (!/^\d+$/.test(raw) || number < 1 || number > total) {
      setStatus(`1부터 ${total} 사이의 쪽 번호 하나를 입력해 주세요.`, 'error');
      pageInput.focus();
      return;
    }
    setStatus('');
    hideCandidates();
    const current = startRun();
    try {
      const {text, notes} = await readPdfPage(open.pdf, number, current);
      check(current);
      showResult(text, notes);
    } catch (error) {
      if (!current.cancelled) handleError(error);
    } finally { endRun(current); }
  }
  $('#pdf-read-page').addEventListener('click', () => { void readChosenPage(); });
  pageInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); void readChosenPage(); }
  });
  for (const id of ['pick-pdf', 'pick-camera', 'pick-photo']) {
    $('#' + id).addEventListener('change', async event => {
      const input = event.target;
      const file = input.files?.[0];
      input.value = '';           // picking the same file again still fires change
      if (!file) return;
      setStatus('');
      try {
        if (id === 'pick-pdf') {
          if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) throw new Error('PDF 파일을 골라 주세요.');
          await handlePdf(file);
        } else {
          await openPhoto(file);
        }
      } catch (error) { handleError(error); }
    });
  }
  function handleError(error) {
    if (error instanceof Cancelled || error?.name === 'Cancelled') return;
    const message = error && typeof error.message === 'string' && /[가-힣]/.test(error.message) ? error.message :
      '파일을 읽지 못했어요. 다른 파일로 다시 시도해 주세요.';
    setStatus(message, 'error');
  }

  // ---- 후보 단어 ------------------------------------------------------------------
  // 모든 단어 (default) or 전공용어 위주. The read text stays in memory only while this
  // page is open so the list can switch without reading the file again.
  let candidates = [];
  let readText = '';
  let candidateMode = 'all';
  let aiCandidates = null;      // "AI 추천": terms picked by Gemini from readText (null = not asked yet)
  const selected = new Map();   // term → {term, sentence}; kept when the mode switches
  function resetAi() {
    aiCandidates = null;
    aiRequest?.abort();
    aiRequest = null;
    $('#mode-ai').hidden = true;
    $('#ai-pick').hidden = false;
    $('#ai-pick-btn').disabled = false;
    if (candidateMode === 'ai') candidateMode = 'all';
  }
  function hideCandidates() {
    candidates = [];
    readText = '';
    selected.clear();
    resetAi();
    candidateList.replaceChildren();
    candidateCard.hidden = true;
    actionBar.hidden = true;
  }
  function setCandidateMode(mode) {
    if (mode === 'ai' && !aiCandidates) mode = 'all';
    candidateMode = mode;
    for (const [id, value] of [['mode-all', 'all'], ['mode-major', 'major'], ['mode-ai', 'ai']]) {
      $('#' + id).setAttribute('aria-pressed', String(value === mode));
    }
    candidates = mode === 'ai' ? aiCandidates : WordCollectorTermExtract.extractCandidates(readText, {mode});
    renderCandidates();
  }
  $('#mode-all').addEventListener('click', () => setCandidateMode('all'));
  $('#mode-major').addEventListener('click', () => setCandidateMode('major'));
  $('#mode-ai').addEventListener('click', () => setCandidateMode('ai'));

  // "AI로 더 정확하게 고르기": the text read on this device (not the picture or file) is sent
  // to the analysis server, where Gemini picks major terms and multi-word terms; the server
  // keeps only terms that are really in the text. Costs one analysis of the daily quota.
  const AI_TEXT_LIMIT = 12000;
  let aiRequest = null;
  $('#ai-pick-btn').addEventListener('click', async () => {
    if (!readText || aiRequest) return;
    const text = readText.slice(0, AI_TEXT_LIMIT);
    const ask = '읽은 영어 글을 분석 서버(Gemini)로 보내 단어를 고를까요?\n' +
      '· 사진이나 파일은 보내지 않아요.\n· 하루 분석 횟수 1회가 쓰여요.' +
      (readText.length > AI_TEXT_LIMIT ? `\n· 글이 길어 앞 ${AI_TEXT_LIMIT.toLocaleString('ko-KR')}자만 보내요.` : '');
    if (!confirm(ask)) return;
    const button = $('#ai-pick-btn');
    const controller = new AbortController();
    aiRequest = controller;
    button.disabled = true;
    setStatus('AI가 단어를 고르는 중이에요… (몇 초 걸려요)');
    try {
      const terms = await window.WordCollectorAI.scanTerms({text, mode: candidateMode === 'all' ? 'all' : 'major'},
        {signal: controller.signal});
      if (aiRequest !== controller) return;
      if (!terms.length) {
        setStatus('AI가 고른 단어가 없어요. 다른 쪽이나 사진으로 시도해 주세요.', 'error');
        button.disabled = false;
        return;
      }
      aiCandidates = terms.map(term => ({...term, kind: /\s/.test(term.term) ? 'phrase' : 'word'}));
      $('#mode-ai').hidden = false;
      $('#ai-pick').hidden = true;
      setStatus(`AI가 단어 ${terms.length}개를 골랐어요. 고른 단어는 다른 목록으로 바꿔도 그대로 남아요.`);
      setCandidateMode('ai');
    } catch (error) {
      if (aiRequest !== controller) return;
      button.disabled = false;
      const status = error?.status;
      setStatus(status === 404 || status === 503 ?
        'AI 단어 고르기는 아직 사용할 수 없어요. (서버 준비 중) 지금 목록에서 골라 주세요.' :
        status === 429 ? '오늘의 분석 횟수를 모두 썼어요. 내일 다시 시도하거나 지금 목록에서 골라 주세요.' :
        error instanceof TypeError || ['TimeoutError', 'AbortError'].includes(error?.name) ?
          'AI 서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.' :
        (typeof error?.message === 'string' && /[가-힣]/.test(error.message) ? error.message : 'AI 단어 고르기에 실패했어요.'),
        'error');
    } finally {
      if (aiRequest === controller) aiRequest = null;
    }
  });
  window.addEventListener('pagehide', () => { aiRequest?.abort(); });

  function showResult(text, notes) {
    readText = text;
    selected.clear();
    resetAi();
    filterInput.value = '';
    candidates = WordCollectorTermExtract.extractCandidates(text, {mode: 'all'});
    if (!candidates.length) {
      hideCandidates();
      setStatus([...notes, letterCount(text) ?
        '단어 후보를 찾지 못했어요. 영어 문장이 있는 다른 쪽이나 사진으로 시도해 주세요.' :
        '영어 글자를 찾지 못했어요. 글자가 선명하게 보이는 사진이나 PDF로 다시 시도해 주세요.'].join('\n'), 'error');
      return;
    }
    setStatus(notes.join('\n'));
    setCandidateMode(candidateMode);
    candidateCard.hidden = false;
    actionBar.hidden = false;
    candidateCard.scrollIntoView({block: 'start'});
  }
  function renderCandidates() {
    const query = filterInput.value.trim().toLowerCase();
    candidateList.replaceChildren(...candidates.map(candidate => {
      if (query && !candidate.term.toLowerCase().includes(query)) return null;
      const item = document.createElement('li');
      const label = document.createElement('label');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.value = candidate.term;
      box.checked = selected.has(candidate.term);
      box.addEventListener('change', () => {
        if (box.checked) selected.set(candidate.term, candidate); else selected.delete(candidate.term);
        updateSelection();
      });
      const body = document.createElement('span');
      body.className = 'cand-body';
      const head = document.createElement('span');
      head.className = 'cand-head';
      const term = document.createElement('span');
      term.className = 'cand-term';
      term.textContent = candidate.term;
      const count = document.createElement('span');
      count.className = 'cand-count';
      count.textContent = candidate.count + '회';
      head.append(term, count);
      const sentence = document.createElement('span');
      sentence.className = 'cand-sentence';
      sentence.textContent = candidate.sentence;
      body.append(head, sentence);
      label.append(box, body);
      item.append(label);
      return item;
    }).filter(Boolean));
    updateSelection();
  }
  function updateSelection() {
    const visible = candidateList.querySelectorAll('input').length;
    $('#candidate-title').textContent = `찾은 단어 ${candidates.length}개 · ${selected.size}개 선택` +
      (visible !== candidates.length ? ` · ${visible}개 표시` : '');
    continueButton.disabled = selected.size === 0;
    $('#scan-continue-text').textContent = selected.size ? `고른 단어 ${selected.size}개로 계속` : '단어를 골라 주세요';
    $('#scan-quota-note').textContent = selected.size ?
      `단어마다 분석 1회가 쓰여요. (하루 한도: 기기당 200회)` : '';
  }
  filterInput.addEventListener('input', renderCandidates);
  $('#select-visible').addEventListener('click', () => {
    candidateList.querySelectorAll('input').forEach(box => {
      box.checked = true;
      selected.set(box.value, candidates.find(candidate => candidate.term === box.value));
    });
    updateSelection();
  });
  $('#clear-selection').addEventListener('click', () => {
    selected.clear();
    candidateList.querySelectorAll('input').forEach(box => { box.checked = false; });
    updateSelection();
  });

  // The picked words go back to the input page, which keeps 의미 기준 and 단어장 as usual.
  continueButton.addEventListener('click', () => {
    if (!selected.size) return;
    // In the order they were picked: only each word and its sentence leave this page.
    const words = [...selected.values()].map(pick => ({
      term: pick.term.slice(0, 120),
      sentence: pick.sentence.slice(0, 600)
    }));
    try {
      sessionStorage.setItem(SCAN_SELECTION_KEY, JSON.stringify({id: crypto.randomUUID(), words, createdAt: Date.now()}));
    } catch {
      setStatus('브라우저 저장소를 사용할 수 없어 단어 입력 화면으로 넘기지 못했어요.', 'error');
      return;
    }
    backToInput();
  });
  // Back to the input page; history.back() keeps what was typed there.
  function backToInput() {
    let fromInput = false;
    try { fromInput = new URL(document.referrer).pathname.endsWith('/quick_capture/code.html'); } catch {}
    if (fromInput && history.length > 1) history.back(); else location.replace('code.html' + location.search);
  }
  $('#scan-back').addEventListener('click', () => {
    cancelRun();
    backToInput();
  });

  window.WordCollectorScan = {LIMITS, SCAN_SELECTION_KEY};
})();
