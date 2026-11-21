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
    ocrProgress = message => {
      if (message?.status === 'recognizing text') onProgress(message.progress);
    };
    const worker = await getOcr();
    const {data} = await worker.recognize(canvas);
    return data?.text || '';
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
      $('#pdf-page-total').textContent = `이 PDF는 ${pdf.numPages}쪽이에요. 읽을 쪽 번호를 하나 입력해 주세요.`;
      pageInput.max = String(pdf.numPages);
      pageInput.value = '1';
      pdfCard.hidden = false;
    } catch (error) {
      if (!current.cancelled) handleError(error);
    } finally { endRun(current); }
    if (!pdfCard.hidden) pdfCard.scrollIntoView({block: 'start'});
  }
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
  let candidates = [];
  const selected = new Set();   // candidate index
  function hideCandidates() {
    candidates = [];
    selected.clear();
    candidateList.replaceChildren();
    candidateCard.hidden = true;
    actionBar.hidden = true;
  }
  function showResult(text, notes) {
    candidates = WordCollectorTermExtract.extractCandidates(text);
    selected.clear();
    filterInput.value = '';
    if (!candidates.length) {
      hideCandidates();
      setStatus([...notes, letterCount(text) ?
        '전공 용어 후보를 찾지 못했어요. 영어 문장이 있는 다른 쪽이나 사진으로 시도해 주세요.' :
        '영어 글자를 찾지 못했어요. 글자가 선명하게 보이는 사진이나 PDF로 다시 시도해 주세요.'].join('\n'), 'error');
      return;
    }
    setStatus(notes.join('\n'));
    renderCandidates();
    candidateCard.hidden = false;
    actionBar.hidden = false;
    candidateCard.scrollIntoView({block: 'start'});
  }
  function renderCandidates() {
    const query = filterInput.value.trim().toLowerCase();
    candidateList.replaceChildren(...candidates.map((candidate, index) => {
      if (query && !candidate.term.toLowerCase().includes(query)) return null;
      const item = document.createElement('li');
      const label = document.createElement('label');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.value = String(index);
      box.checked = selected.has(index);
      box.addEventListener('change', () => {
        if (box.checked) selected.add(index); else selected.delete(index);
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
    candidateList.querySelectorAll('input').forEach(box => { box.checked = true; selected.add(Number(box.value)); });
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
    const words = [...selected].sort((a, b) => a - b).map(index => ({
      term: candidates[index].term.slice(0, 120),
      sentence: candidates[index].sentence.slice(0, 600)
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
