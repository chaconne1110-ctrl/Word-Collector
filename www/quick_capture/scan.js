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
  // ---- 사진 준비 (기울기 바로잡기, 다시 읽기용 보정) ----------------------------------------
  function canvasCopy(source, scale = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const context = canvas.getContext('2d');
    context.imageSmoothingQuality = 'high';
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas;
  }
  function blurred(source, radius) {
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext('2d');
    context.filter = `blur(${radius}px)`;
    context.drawImage(source, 0, 0);
    return canvas;
  }
  function toGray(canvas) {
    const context = canvas.getContext('2d');
    const image = context.getImageData(0, 0, canvas.width, canvas.height), a = image.data;
    for (let i = 0; i < a.length; i += 4) a[i] = a[i + 1] = a[i + 2] = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2];
    context.putImageData(image, 0, 0);
    return canvas;
  }
  // Brightness spread to full black..white (ignoring the darkest/brightest 1%).
  function normalized(canvas) {
    const context = canvas.getContext('2d');
    const image = context.getImageData(0, 0, canvas.width, canvas.height), a = image.data, n = a.length / 4;
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < a.length; i += 4) histogram[a[i] | 0]++;
    let low = 0, high = 255, sum = 0;
    for (; low < 255 && (sum += histogram[low]) < n * 0.01; low++);
    sum = 0;
    for (; high > 0 && (sum += histogram[high]) < n * 0.01; high--);
    for (let i = 0; i < a.length; i += 4) {
      a[i] = a[i + 1] = a[i + 2] = Math.max(0, Math.min(255, (a[i] - low) * 255 / Math.max(1, high - low)));
    }
    context.putImageData(image, 0, 0);
    return canvas;
  }
  // Unsharp mask: edges of slightly out-of-focus letters become crisp again.
  function sharpened(canvas, radius, amount) {
    const soft = blurred(canvas, radius).getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    const context = canvas.getContext('2d');
    const image = context.getImageData(0, 0, canvas.width, canvas.height), a = image.data;
    for (let i = 0; i < a.length; i += 4) {
      for (let k = 0; k < 3; k++) a[i + k] = Math.max(0, Math.min(255, a[i + k] + amount * (a[i + k] - soft[i + k])));
    }
    context.putImageData(image, 0, 0);
    return canvas;
  }
  // Page layout from ink: the tilt of the text lines (-19..19°) and how many lines there are.
  // Ink = pixels clearly darker than their surroundings, so a dark desk around the page
  // does not count. Lines show as peaks when the ink is projected along the right angle.
  function textLayout(canvas) {
    const small = toGray(canvasCopy(canvas, Math.min(1, 700 / Math.max(canvas.width, canvas.height))));
    const pixels = small.getContext('2d').getImageData(0, 0, small.width, small.height).data;
    const local = blurred(small, 6).getContext('2d').getImageData(0, 0, small.width, small.height).data;
    const ink = [];
    for (let y = 0; y < small.height; y++) {
      for (let x = 0; x < small.width; x++) {
        const i = (y * small.width + x) * 4;
        if (pixels[i] < local[i] * 0.75 && local[i] > 90) ink.push(x, y);
      }
    }
    let total = 0;
    for (let i = 0; i < pixels.length; i += 4) total += pixels[i];
    const brightness = total / (pixels.length / 4);
    if (ink.length < 200) return {angle: 0, lines: 0, brightness};
    let best = {angle: 0, score: -1, bins: null};
    for (let degrees = -20; degrees <= 20; degrees += 0.5) {
      const r = degrees * Math.PI / 180, sin = Math.sin(r), cos = Math.cos(r);
      const bins = new Map();
      for (let k = 0; k < ink.length; k += 2) {
        const row = Math.round(ink[k + 1] * cos - ink[k] * sin);
        bins.set(row, (bins.get(row) || 0) + 1);
      }
      let score = 0;
      for (const count of bins.values()) score += count * count;
      if (score > best.score) best = {angle: degrees, score, bins};
    }
    const rows = [...best.bins.keys()].sort((a, b) => a - b);
    const peak = Math.max(...best.bins.values());
    let lines = 0, inLine = false;
    for (let row = rows[0]; row <= rows[rows.length - 1]; row++) {
      const full = (best.bins.get(row) || 0) > peak * 0.12;
      if (full && !inLine) lines++;
      inLine = full;
    }
    // An angle at the edge of the search is not a real measurement.
    return {angle: Math.abs(best.angle) >= 19.5 ? 0 : best.angle, lines, brightness};
  }
  function rotated(canvas, degrees) {
    const r = degrees * Math.PI / 180;
    const width = Math.ceil(Math.abs(canvas.width * Math.cos(r)) + Math.abs(canvas.height * Math.sin(r)));
    const height = Math.ceil(Math.abs(canvas.width * Math.sin(r)) + Math.abs(canvas.height * Math.cos(r)));
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    const context = out.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.translate(width / 2, height / 2);
    context.rotate(-r);
    context.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    return out;
  }
  // Other ways to prepare a picture that read poorly (sweep of 22 photo conditions):
  // out of focus → sharpen (0 → 49 of 50 words); dark and grainy → smooth + spread
  // brightness (0 → 19); shaky → spread brightness (2 → 17); far away (small letters) →
  // enlarge + sharpen (29 → 41, at most ~12 million pixels).
  const SHARPEN = ['흐려서 선명하게 다시 읽는 중', canvas => sharpened(canvasCopy(canvas), 2, 1.5)];
  const DARK = ['어두워서 밝기를 맞춰 다시 읽는 중', canvas => normalized(toGray(blurred(canvasCopy(canvas), 1)))];
  const CONTRAST = ['대비를 높여 다시 읽는 중', canvas => normalized(toGray(canvasCopy(canvas)))];
  const ENLARGE = ['글자가 작아 크게 키워 다시 읽는 중', canvas => {
    const scale = Math.min(2, Math.sqrt(12e6 / (canvas.width * canvas.height)));
    return scale > 1.2 ? sharpened(canvasCopy(canvas, scale), 3, 1.5) : null;
  }];
  // A dark photo (average brightness under 110 of 255) tries the dark fix first, so it
  // still runs within the time limit; sharpening a dark, grainy photo makes it worse.
  const retriesFor = layout => layout.brightness < 110 ?
    [DARK, CONTRAST, SHARPEN, ENLARGE] : [SHARPEN, CONTRAST, DARK, ENLARGE];
  const RETRY_COUNT = 4;

  const RETRY_BUDGET_MS = 20000;
  // retries: false reads once (a figure inside a PDF page: short labels, read quickly).
  async function recognizeCanvas(canvas, onProgress, isCancelled = () => false, {retries = true} = {}) {
    // Tests replace recognition with a fast stand-in.
    const override = window.WordCollectorScanOverrides?.recognize;
    if (typeof override === 'function') return override(canvas, onProgress, {retries});
    void englishWords();   // loads while the picture is read
    const worker = await getOcr();
    // A tilted photo (more than about 1°) is straightened first: at 12° no word was read.
    const layout = textLayout(canvas);
    const picture = Math.abs(layout.angle) >= 1 ? rotated(canvas, layout.angle) : canvas;
    // Each read tries two black/white cut-offs and keeps the one with more sure words:
    // - one cut-off for the whole picture (Otsu): best for even, grainy pictures
    // - a local cut-off around each spot (Sauvola): best when the light is uneven, e.g. the
    //   lower part of a page photographed under a lamp (a table photo: 25 → 37 of 39 words).
    // Layout: automatic page segmentation (PSM 3) finds the columns and lines of tables;
    // the library default (one uniform block) read only 3 words of that table.
    const steps = 1 + RETRY_COUNT;
    const read = async (input, step, note) => {
      let best = {text: '', sure: 0, seen: 0};
      for (const [index, method] of ['0', '2'].entries()) {
        if (isCancelled()) break;
        ocrProgress = message => {
          if (message?.status === 'recognizing text') onProgress((step + (index + message.progress) / 2) / steps, note);
        };
        await worker.setParameters({tessedit_pageseg_mode: '3', thresholding_method: method});
        const {data} = await worker.recognize(input, {}, {blocks: true, text: true});
        const text = confidentText(data);
        const sure = (text.match(/[A-Za-z]{2,}/g) || []).length;
        const seen = wordsSeen(data);
        if (sure > best.sure || (sure === best.sure && !best.text)) best = {text, sure, seen};
      }
      return best;
    };
    // Good enough: most words read are sure, and about as many as the text lines suggest
    // (a printed line holds several words; a photo of one label line needs only one).
    const goodEnough = result => result.seen > 0 && result.sure >= result.seen * 0.85 &&
      result.sure >= Math.min(15, Math.max(1, layout.lines * 2));
    const firstStarted = performance.now();
    let best = await read(picture, 0, '');
    const firstMs = performance.now() - firstStarted;
    // Retries stop after about 20 s (a very dark, grainy photo took 50 s for all of them);
    // the best read so far is used.
    const retryUntil = performance.now() + RETRY_BUDGET_MS;
    for (const [index, [note, prepare]] of retriesFor(layout).entries()) {
      if (!retries || goodEnough(best) || isCancelled() || performance.now() > retryUntil) break;
      const prepared = prepare(picture);
      if (!prepared) continue;
      // Skip a retry that would not finish in time: reading time grows with the number of
      // pixels (an enlarged dark, grainy photo took 28 s on its own).
      const expectedMs = firstMs * (prepared.width * prepared.height) / (picture.width * picture.height) * 1.5;
      if (performance.now() + expectedMs > retryUntil) { prepared.width = prepared.height = 0; continue; }
      const result = await read(prepared, index + 1, `${note}… (${index + 1}/${RETRY_COUNT})`);
      prepared.width = prepared.height = 0;
      if (result.sure > best.sure) best = result;
    }
    if (picture !== canvas) picture.width = picture.height = 0;
    // Words the OCR cut off are repaired with the English dictionary (term-extract.js).
    const dictionary = await englishWords();
    return WordCollectorTermExtract.repairOcrText(best.text, dictionary);
  }
  // The ~1 MB dictionary (english-words.js) is loaded the first time OCR runs, not with the page.
  let dictionaryLoad = null;
  function englishWords() {
    dictionaryLoad ||= (window.WordCollectorEnglishWords ? Promise.resolve() :
      loadScript(new URL('english-words.js', location.href).href)).then(() => window.WordCollectorEnglishWords || [], () => []);
    return dictionaryLoad;
  }
  function wordsSeen(data) {
    let count = 0;
    for (const block of data?.blocks || []) for (const paragraph of block.paragraphs || [])
      for (const line of paragraph.lines || []) for (const word of line.words || []) if (/[A-Za-z]{2}/.test(word.text || '')) count++;
    return count;
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
    // Files PDF.js needs for some PDFs, shipped with the app (www/vendor/pdfjs):
    // - cmaps: character maps for CJK fonts that are not embedded (e.g. Korean Word/HWP
    //   exports). Without them the text layer of such a PDF is empty and its pages draw blank.
    // - standard_fonts: the 14 standard PDF fonts (Foxit, BSD), when a PDF does not embed them.
    // - wasm/iccs: decoders for JBIG2 / JPEG 2000 scans and colour profiles.
    const task = pdfjs.getDocument({data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false,
      cMapUrl: vendor('pdfjs/cmaps/'), cMapPacked: true, standardFontDataUrl: vendor('pdfjs/standard_fonts/'),
      wasmUrl: vendor('pdfjs/wasm/'), iccUrl: vendor('pdfjs/iccs/'), useSystemFonts: true});
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
  function pageViewport(page) {
    return page.getViewport({scale: Math.min(3, PDF_RENDER_WIDTH / page.getViewport({scale: 1}).width)});
  }
  async function renderPage(page) {
    const viewport = pageViewport(page);
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({canvasContext: context, canvas, viewport}).promise;
    return canvas;
  }

  // A text layer that is not real text: some PDFs (old HWP exports, special fonts) show the
  // right letters on screen but store wrong codes, so the copied text is symbols or nonsense.
  // Such a page is read from its picture instead.
  function looksGarbled(text) {
    const chars = [...text.replace(/\s+/g, '')];
    if (chars.length < 40) return false;
    const plain = chars.filter(ch => /[A-Za-z0-9가-힣ㄱ-ㆎ぀-ヿ一-鿿.,;:!?'"‘’“”()\[\]{}<>\-–—_%/\\·…=+*&#@|~^°±×÷]/.test(ch)).length;
    if (plain / chars.length < 0.6) return true;
    const words = text.match(/[A-Za-z]{3,}/g) || [];
    if (words.length < 15) return false;
    const odd = words.filter(word => !/[aeiouy]/i.test(word) || /[bcdfghjklmnpqrstvwxz]{5}/i.test(word)).length;
    return odd / words.length > 0.4;
  }

  // Pictures drawn on a page (figures, diagrams, photos of text), in canvas pixels. Found
  // from PDF.js's drawing commands: the current transform maps the unit square of each
  // image onto the page. Tiny icons and pictures covering most of the page (a scan that
  // already has a text layer) are skipped; at most 6, largest first.
  async function imageRegions(page, viewport) {
    const OPS = pdfjsLib.OPS;
    const list = await page.getOperatorList();
    const times = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3],
      m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
    const paints = new Set([OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageXObjectRepeat,
      OPS.paintJpegXObject].filter(Number.isInteger));
    let matrix = [1, 0, 0, 1, 0, 0];
    const stack = [];
    const found = [];
    list.fnArray.forEach((fn, i) => {
      const args = list.argsArray[i];
      if (fn === OPS.save) stack.push(matrix);
      else if (fn === OPS.restore) matrix = stack.pop() || matrix;
      else if (fn === OPS.transform && args?.length === 6) matrix = times(matrix, [...args]);
      else if (fn === OPS.paintFormXObjectBegin) {
        stack.push(matrix);
        if (args?.[0]?.length === 6) matrix = times(matrix, [...args[0]]);
      } else if (fn === OPS.paintFormXObjectEnd) matrix = stack.pop() || matrix;
      else if (paints.has(fn)) {
        const corners = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) =>
          viewport.convertToViewportPoint(matrix[0] * x + matrix[2] * y + matrix[4], matrix[1] * x + matrix[3] * y + matrix[5]));
        const xs = corners.map(point => point[0]), ys = corners.map(point => point[1]);
        const x = Math.max(0, Math.min(...xs)), y = Math.max(0, Math.min(...ys));
        found.push({x, y, w: Math.min(viewport.width, Math.max(...xs)) - x, h: Math.min(viewport.height, Math.max(...ys)) - y});
      }
    });
    const pageArea = viewport.width * viewport.height;
    const kept = [];
    for (const region of found.sort((a, b) => b.w * b.h - a.w * a.h)) {
      const area = region.w * region.h;
      if (region.w < 80 || region.h < 40 || area < pageArea * 0.02 || area > pageArea * 0.7) continue;
      const overlaps = kept.some(other => {
        const w = Math.min(other.x + other.w, region.x + region.w) - Math.max(other.x, region.x);
        const h = Math.min(other.y + other.h, region.y + region.h) - Math.max(other.y, region.y);
        return w > 0 && h > 0 && w * h > area * 0.8;
      });
      if (!overlaps) kept.push(region);
      if (kept.length >= 6) break;
    }
    return kept;
  }
  function cropRegion(canvas, region) {
    const pad = 8;
    const x = Math.max(0, Math.floor(region.x - pad)), y = Math.max(0, Math.floor(region.y - pad));
    const w = Math.min(canvas.width - x, Math.ceil(region.w + pad * 2)), h = Math.min(canvas.height - y, Math.ceil(region.h + pad * 2));
    const crop = document.createElement('canvas');
    crop.width = w;
    crop.height = h;
    const context = crop.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, w, h);
    context.drawImage(canvas, x, y, w, h, 0, 0, w, h);
    // Small labels read better a little larger (up to 2×, at most 2,000 px wide).
    const scale = Math.min(2, 2000 / w);
    return scale > 1.2 ? canvasCopy(crop, scale) : crop;
  }

  async function readPdfPage(pdf, number, current) {
    progress(current, `${number}쪽 읽는 중…`);
    const page = await pdf.getPage(number);
    check(current);
    const content = await page.getTextContent();
    let text = content.items.map(item => (item.str || '') + (item.hasEOL ? '\n' : '')).join('');
    // Broken codes can also hide the letters entirely (private-use characters), so this is
    // checked on all characters, not only on English letters.
    const garbled = looksGarbled(text);
    let how = '';
    if (letterCount(text) < MIN_TEXT_LETTERS || garbled) {
      // No usable text layer (a scan, or broken character codes): read the page's picture.
      how = garbled ? ' (글자 정보가 깨진 쪽이라 그림으로 읽었어요)' : ' (스캔한 쪽이라 글자 인식으로 읽었어요)';
      const canvas = await renderPage(page);
      check(current);
      const label = garbled ? '글자 정보가 깨져 그림으로 읽는 중…' : '글자 인식 중… (스캔한 쪽)';
      progress(current, `${number}쪽 ${label}`, 0);
      text = await recognizeCanvas(canvas, (value, note) =>
        progress(current, `${number}쪽 ${note || label}`, value), () => current.cancelled);
      canvas.width = canvas.height = 0;
    } else {
      // A normal text page: the text layer is exact. Pictures on it (figures, diagrams) are
      // not part of it, so each sizeable picture is read once with OCR and added.
      let regions = [];
      try { regions = await imageRegions(page, pageViewport(page)); } catch { regions = []; }
      check(current);
      if (regions.length) {
        const canvas = await renderPage(page);
        const pictureTexts = [];
        for (const [index, region] of regions.entries()) {
          check(current);
          const note = `${number}쪽 그림 속 글자 읽는 중… (${index + 1}/${regions.length})`;
          progress(current, note, index / regions.length);
          const crop = cropRegion(canvas, region);
          const read = await recognizeCanvas(crop, value => progress(current, note, (index + value) / regions.length),
            () => current.cancelled, {retries: false});
          crop.width = crop.height = 0;
          if (/[A-Za-z]{2}/.test(read)) pictureTexts.push(read);
        }
        canvas.width = canvas.height = 0;
        if (pictureTexts.length) {
          text += '\n\n' + pictureTexts.join('\n\n');
          how = ` (그림 ${pictureTexts.length}개 속 글자도 읽었어요)`;
        }
      }
    }
    page.cleanup();
    progress(current, '단어를 찾는 중…', 1);
    return {text, notes: [`${number}쪽을 읽었어요.${how}`]};
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
      const text = await recognizeCanvas(canvas, (value, note) => progress(current, note || '사진의 글자를 읽는 중…', value),
        () => current.cancelled);
      canvas.width = canvas.height = 0;
      check(current);
      // Few words found: the photo may be handwriting or too blurred for the device.
      const few = WordCollectorTermExtract.extractCandidates(text).length < 5;
      showResult(text, few ? ['글자가 거의 읽히지 않았어요. 손글씨나 흐린 사진이면 "손글씨·흐린 사진은 AI로 읽기"를 눌러 보세요.'] : []);
    } catch (error) {
      if (!current.cancelled) handleError(error);
    } finally { endRun(current); }
  });

  // "사진째 AI로 읽기" (손글씨·흐린 사진): the photo, made smaller (long side 1,600 px, JPEG,
  // at most ~1.4 MB), is sent once to the analysis server, which asks Gemini to write down
  // the English text it sees and pick terms from it. Only after a confirm that says the photo
  // leaves the device; the server does not keep it.
  function photoForAi() {
    for (const [side, quality] of [[1600, 0.82], [1300, 0.75], [1000, 0.7]]) {
      const canvas = document.createElement('canvas');
      drawPhoto(canvas, side);
      const data = canvas.toDataURL('image/jpeg', quality).split(',')[1];
      canvas.width = canvas.height = 0;
      if (data.length * 3 / 4 <= 1.4 * 1024 * 1024) return data;
    }
    throw new Error('사진이 너무 커서 AI로 보낼 수 없어요.');
  }
  $('#read-photo-ai').addEventListener('click', async () => {
    if (!photo || run) return;
    if (!confirm('사진을 분석 서버와 Google(Gemini)로 보내 글자를 읽을까요?\n' +
      '· 얼굴이나 개인정보가 찍혀 있지 않은지 확인해 주세요.\n· 사진은 저장하지 않아요.\n· 하루 분석 횟수 1회가 쓰여요.')) return;
    const current = startRun();
    const controller = new AbortController();
    current.cleanups.push(() => controller.abort());
    try {
      progress(current, 'AI가 사진의 글자를 읽는 중… (10초 정도 걸려요)');
      const image = photoForAi();
      const result = await window.WordCollectorAI.scanImage(
        {image, mimeType: 'image/jpeg', mode: candidateMode === 'all' ? 'all' : 'major'}, {signal: controller.signal});
      check(current);
      if (!result.text) {
        hideCandidates();
        setStatus('AI도 사진에서 영어 글자를 찾지 못했어요. 영어가 잘 보이게 다시 찍어 주세요.', 'error');
        return;
      }
      // Each line Gemini wrote down is its own sentence (blank line between lines).
      const lines = result.text.split('\n').map(line => line.trim()).filter(Boolean).join('\n\n');
      showResult(lines, ['AI가 사진에서 읽은 글로 단어를 찾았어요.']);
      if (result.terms.length) showAiTerms(result.terms);
    } catch (error) {
      if (!current.cancelled) setStatus(aiErrorMessage(error, '사진 AI 읽기'), 'error');
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
      showAiTerms(terms);
    } catch (error) {
      if (aiRequest !== controller) return;
      button.disabled = false;
      setStatus(aiErrorMessage(error, 'AI 단어 고르기'), 'error');
    } finally {
      if (aiRequest === controller) aiRequest = null;
    }
  });
  window.addEventListener('pagehide', () => { aiRequest?.abort(); });
  // AI terms (from the read text or from the photo) as the "AI 추천" list.
  function showAiTerms(terms) {
    aiCandidates = terms.map(term => ({...term, kind: /\s/.test(term.term) ? 'phrase' : 'word'}));
    $('#mode-ai').hidden = false;
    $('#ai-pick').hidden = true;
    setStatus(`AI가 단어 ${terms.length}개를 골랐어요. 고른 단어는 다른 목록으로 바꿔도 그대로 남아요.`);
    setCandidateMode('ai');
  }
  function aiErrorMessage(error, feature) {
    const status = error?.status;
    if (status === 404 || status === 503) return `${feature}는 아직 사용할 수 없어요. (서버 준비 중)`;
    if (status === 429) return '오늘의 분석 횟수를 모두 썼어요. 내일 다시 시도해 주세요.';
    if (error instanceof TypeError || ['TimeoutError', 'AbortError'].includes(error?.name)) {
      return 'AI 서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.';
    }
    return typeof error?.message === 'string' && /[가-힣]/.test(error.message) ? error.message : `${feature}에 실패했어요.`;
  }

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
