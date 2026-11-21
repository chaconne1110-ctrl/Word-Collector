// Word analysis page (review.html). The input page (code.html + capture.js)
// stores the request in sessionStorage and navigates here; this page runs the
// analysis behind a waiting screen, then shows the
// review with a single "단어장에 저장" button in the bottom bar.
const CAPTURE_REQUEST_KEY = 'word-collector-capture-request-v1';
const CAPTURE_STARTED_KEY = 'word-collector-capture-started-v1';
const reviewForm = $('#analysis-review');
const status = $('#analysis-status');
function revealFocusedField() {
  const field = document.activeElement;
  if (reviewForm.contains(field) && field.matches('textarea, select, input')) {
    requestAnimationFrame(() => field.scrollIntoView({block:'center'}));
  }
}
reviewForm.addEventListener('focusin', revealFocusedField);
window.visualViewport?.addEventListener('resize', revealFocusedField);

const saveActionButton = $('#save-action-btn');
const errorCard = $('#analysis-error');
const errorMessage = $('#analysis-error-message');
const retryButton = $('#analysis-retry');
const waiting = $('#analysis-waiting');
const waitingTitle = $('#analysis-waiting-title');
const waitingTerm = $('#analysis-waiting-term');
const waitingCancel = $('#analysis-waiting-cancel');
const STEP_STATES = {
  waiting: ['schedule', '대기'], active: ['pending', '진행 중'], done: ['check_circle', '완료'],
  failed: ['error', '실패 · 검수 화면에서 다시 시도'], skipped: ['skip_next', '백그라운드에서 계속']
};
function setWaitingStep(step, state) {
  const item = waiting.querySelector('[data-step="' + step + '"]');
  if (!item) return;
  item.dataset.state = state;
  item.querySelector('.wc-step-icon').textContent = STEP_STATES[state][0];
  item.querySelector('.wc-step-state').textContent = STEP_STATES[state][1];
}
// Full-screen waiting screen while the word is analysed. No photo is generated
// here; photos are created only from the flashcard back ("AI 사진 생성").
function showWaiting(term) {
  waitingTitle.textContent = 'AI가 단어를 분석하고 있어요' + batchLabel;
  setSkipVisible(false);
  waitingTerm.textContent = '“' + term + '”';
  setWaitingStep('analysis', 'active');
  setWaitingStep('evidence', 'active');
  waiting.hidden = false;
  if (!waiting.open) waiting.showModal();
  waitingCancel.focus({preventScroll: true});
}
function hideWaiting() {
  if (waiting.open) waiting.close();
  waiting.hidden = true;
}
// The bottom bar shows only "단어장에 저장", and only once the review is ready.
function setReviewMode(on) {
  saveActionButton.hidden = !on;
}
function readCaptureRequest() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CAPTURE_REQUEST_KEY) || 'null');
    return saved && typeof saved.term === 'string' && typeof saved.id === 'string' ? saved : null;
  } catch {
    return null;
  }
}
const request = readCaptureRequest();
// Words picked from a PDF or photo (scan.html → code.html) are analysed one after
// another: the queue holds the requests still to come, and each save or skip moves on.
const CAPTURE_QUEUE_KEY = 'word-collector-capture-queue-v1';
const SCAN_SELECTION_KEY = 'word-collector-scan-selection-v1';
function readCaptureQueue() {
  try {
    const queue = JSON.parse(sessionStorage.getItem(CAPTURE_QUEUE_KEY) || 'null');
    return queue && request?.batch && queue.id === request.batch.id && Array.isArray(queue.items) ? queue : null;
  } catch {
    return null;
  }
}
const batch = request?.batch && readCaptureQueue() ? request.batch : null;
const batchLabel = batch ? ` (${batch.index}/${batch.total})` : '';
const batchSkip = $('#batch-skip');
if (batch) reviewForm.querySelector('h2').textContent += batchLabel;
function setSkipVisible(on) {
  batchSkip.hidden = !(batch && on);
  $('#batch-skip-text').textContent = batch && batch.index >= batch.total ? '이 단어 건너뛰고 마치기' : '이 단어 건너뛰기';
}
function nextInBatch(savedWord) {
  const queue = readCaptureQueue() || {items: [], saved: 0};
  const saved = (queue.saved || 0) + (savedWord ? 1 : 0);
  const lastCourse = savedWord ? savedWord.course : queue.lastCourse;
  try {
    // A saved word leaves the picked list (going back to the input page shows the rest).
    const selection = JSON.parse(sessionStorage.getItem(SCAN_SELECTION_KEY) || 'null');
    if (savedWord && selection && Array.isArray(selection.words)) {
      selection.words = selection.words.filter(word => word?.term !== request.term);
      sessionStorage.setItem(SCAN_SELECTION_KEY, JSON.stringify(selection));
    }
  } catch {}
  // A new notebook is created by the first save; the next words go into that notebook.
  const items = queue.items.map(item => savedWord && item.newCourseName ?
    (({newCourseName, ...rest}) => ({...rest, selected: savedWord.course}))(item) : item);
  try {
    sessionStorage.removeItem(CAPTURE_STARTED_KEY);
    if (!items.length) {
      for (const key of [CAPTURE_QUEUE_KEY, SCAN_SELECTION_KEY, CAPTURE_REQUEST_KEY]) sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(CAPTURE_QUEUE_KEY, JSON.stringify({...queue, saved, lastCourse, items: items.slice(1)}));
      sessionStorage.setItem(CAPTURE_REQUEST_KEY, JSON.stringify(items[0]));
    }
  } catch {}
  // replace(): the back button must not return to a finished word.
  if (items.length) location.replace('review.html');
  else if (saved && lastCourse && hasCourse(lastCourse)) location.replace('../' + route('words.html', {course: lastCourse}));
  else location.replace('code.html');
}
batchSkip.addEventListener('click', () => {
  if (!batch || saving) return;
  analysisRequestGate.cancel();
  analyzing = false;
  nextInBatch(null);
});
// Back to the input page; history.back() keeps the typed values when possible.
function goBackToInput() {
  let fromInput = false;
  try { fromInput = new URL(document.referrer).pathname.endsWith('/quick_capture/code.html'); } catch {}
  if (fromInput) history.back();
  else location.href = 'code.html' + (request?.selected ? '?course=' + encodeURIComponent(request.selected) : '');
}
function showError(message) {
  hideWaiting();
  reviewForm.hidden = true;
  setReviewMode(false);
  errorMessage.textContent = message;
  errorCard.hidden = false;
  status.textContent = '';
  setSkipVisible(true);
}
$('#analysis-back-to-input').addEventListener('click', goBackToInput);
const reviewCourse = $('#review-course');
// First notebook: the AI's name is only a suggestion. The notebook is created
// (with the word) when the user presses save, under the name shown here.
const newCourseInput = $('#review-new-course');
newCourseInput.addEventListener('input', () => {
  if (!draft?.createsCourse) return;
  draft.newCourseName = newCourseInput.value.trim();
  updateReviewTarget();
});
const inputControls = [];
// Display order of the review: 단어|품사, 한국어 뜻, 영어/한국어 정의, 영어/한국어 예문,
// 관련 단어, then 전공 and the 단어장 select, then the reference sentence and its translation.
const resultFields = {
  en: '단어',
  ko: '한국어 뜻',
  enDef: '영어 정의',
  koDef: '한국어 정의',
  exampleEn: '영어 예문',
  exampleKo: '한국어 예문',
  pos: '품사',
  related: '관련 단어',
  discipline: '전공',
  referenceTranslation: '참고 문장 해석'
};
let draft;
const diagramChoice = $('#diagram-choice');
const diagramRefresh = $('#diagram-refresh');
const diagramStatus = $('#diagram-status');

const referencePreview = document.createElement('p');
referencePreview.id = 'review-reference-sentence';
referencePreview.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere';
referencePreview.hidden = true;
$('#review-new-course-row').after(referencePreview);

const normalize = text => text.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

function drawDiagram(selected = false) {
  const image = diagramImage(draft.diagram, '../');
  diagramChoice.hidden = !image;
  diagramRefresh.hidden = !image;
  diagramRefresh.disabled = !selected;
  diagramChoice.setAttribute('aria-pressed', String(selected));
  diagramChoice.classList.toggle('border-primary', selected);
  diagramChoice.classList.toggle('border-transparent', !selected);
  diagramChoice.replaceChildren(...(image ? [image] : []));
  diagramStatus.textContent = !image ? '이 단어에 등록된 도해가 없습니다.' :
    selected ? '도해가 선택됐어요. 재분석을 누르면 다른 도해로 바뀝니다.' :
    '도해를 선택하면 재분석할 수 있어요.';
}

diagramChoice.addEventListener('click', () => {
  if (draft?.diagram) drawDiagram(diagramChoice.getAttribute('aria-pressed') !== 'true');
});
diagramRefresh.addEventListener('click', () => {
  if (!draft?.diagram || diagramRefresh.disabled) return;
  draft.diagram = draft.diagram === 'eddy-loops' ? 'eddy-flux' : 'eddy-loops';
  drawDiagram(true);
});
let analyzing = false;
const analysisRequestGate = WordCollectorRequestGate.create();
window.addEventListener('pagehide', () => {
  analysisRequestGate.cancel();
  hideWaiting();
});
window.addEventListener('pageshow', event => {
  if (event.persisted && analyzing) {
    analyzing = false;
    showError('페이지를 떠나 분석이 중단됐습니다. 다시 분석하려면 버튼을 눌러 주세요.');
  }
});
waiting.addEventListener('cancel', event => {
  event.preventDefault();
  waitingCancel.click();
});
waitingCancel.addEventListener('click', () => {
  analysisRequestGate.cancel();
  invalidateReview();
  hideWaiting();
  analyzing = false;
  // The typed word stays saved, so the input page shows it again.
  goBackToInput();
});
// Notebook choices for the review's "저장할 단어장" select (IDs, not display names).
function refreshNotebookChoices() {
  const oldReview = reviewCourse.value;
  state = load();
  const notebookEntries = Object.entries(allCourses());
  reviewCourse.replaceChildren(...notebookEntries.map(([id, [name]]) => new Option(name, id)));
  if (oldReview && hasCourse(oldReview)) reviewCourse.value = oldReview;
}
refreshNotebookChoices();

function supportsEddyDiagram(en, selected) {
  return ['eddy current', 'eddy currents'].includes(normalize(en)) &&
    ['electromagnetics', 'circuit-theory', 'electrical-machines'].includes(selected);
}

function updateReviewTarget() {
  $('#review-target').textContent = (batch ? `${batch.index}/${batch.total} · ` : '') + draft.term +
    (draft.recommended ? ' · AI 추천: ' + (draft.suggestedCourseName || courseNames(draft.recommended)[0]) : '') +
    ' · 저장: ' + (draft.newCourseName || courseNames(draft.selected)[0]);
}

// The destination is always among the notebooks sent to the server, even
// before it exists (a new notebook, or a deleted 일반 단어장).
function withNotebook(notebooks, name) {
  return notebooks.some(book => book.course === name) ? notebooks : [...notebooks, {course: name, words: []}];
}

function currentNotebooks() {
  state = load();
  return Object.keys(allCourses()).map(id => [id, courseNames(id)]).map(([id, [course]]) => ({
    course,
    words: Object.values(state.terms).filter(word => word.course === id).map(word =>
      Object.fromEntries(['en', 'ko', 'enDef', 'koDef'].map(field => [field, word[field] ?? ''])))
  }));
}

function showRecommendation(result, autoCourse, context) {
  $('#recommendation-details').hidden = !autoCourse;
  if (!autoCourse) return;
  const {reason, relatedTerms, reviewedCourses, reviewedWords} = result.classification;
  $('#recommendation-summary').textContent =
    '후보 단어장 ' + reviewedCourses + '개 · 분류 참고 단어 ' + reviewedWords + '개';
  $('#recommendation-reason').textContent = reason;
  $('#recommendation-terms').replaceChildren(...relatedTerms.map(word => {
    const item = document.createElement('li');
    item.textContent = word.en + (word.ko ? ' · ' + word.ko : '');
    return item;
  }));
}

function updateDiagram() {
  draft.diagram = supportsEddyDiagram(reviewForm.elements.en.value, draft.selected) ?
    draft.diagram || 'eddy-loops' : null;
  drawDiagram();
}

reviewCourse.addEventListener('change', () => {
  if (!draft) return;
  draft.selected = reviewCourse.value;
  updateReviewTarget();
  updateDiagram();
});
for (const [key, title] of Object.entries(resultFields)) {
  const label = document.createElement('label');
  label.className = 'block';
  label.textContent = title;
  const input = document.createElement('textarea');
  input.name = key;
  input.required = false; // Optional review fields are saved as empty strings.
  input.maxLength = key === 'en' ? 120 : 1200;
  // One line to start; the box grows with longer text (전공, 한국어 뜻 and 관련 단어 included).
  input.rows = ['en', 'pos', 'discipline', 'ko', 'related'].includes(key) ? 1 : 2;
  if (key === 'related') input.placeholder = '예: capacitance, inductance';
  if (key === 'referenceTranslation') {
    label.hidden = true;
    input.placeholder = '해석이 없으면 직접 입력하거나 다시 분석해 주세요.';
  }
  input.className = 'block w-full rounded-lg p-2 bg-surface-container-low';
  label.append(input);
  $(key === 'discipline' ? '#review-fields-top' : '#review-fields').append(label);
}
// 품사 sits to the right of the 단어 field, on the same row.
{
  const wordLabel = reviewForm.elements.en.parentElement;
  const posLabel = reviewForm.elements.pos.parentElement;
  const row = document.createElement('div');
  row.className = 'review-word-row';
  row.style.cssText = 'display:flex;gap:8px;align-items:flex-start';
  wordLabel.before(row);
  wordLabel.style.cssText = 'flex:1 1 auto;min-width:0';
  posLabel.style.cssText = 'flex:0 0 6.5rem;min-width:0';
  row.append(wordLabel, posLabel);
}
// Same order, shown as three boxes: 단어 (단어|품사, 한국어 뜻), 정의 and 예문
// (영어/한국어). Inside 정의 and 예문 the visible labels are short; the full
// name (e.g. "영어 정의") stays the field's accessible name.
for (const [title, keys, shortLabels] of [
  ['단어', ['en', 'ko'], {}],
  ['정의', ['enDef', 'koDef'], {enDef: '영어', koDef: '한국어'}],
  ['예문', ['exampleEn', 'exampleKo'], {exampleEn: '영어', exampleKo: '한국어'}],
]) {
  const group = document.createElement('fieldset');
  group.className = 'review-group';
  const legend = document.createElement('legend');
  legend.textContent = title;
  group.append(legend);
  // The word field lives in the 단어|품사 row, which moves as a whole.
  const blockOf = key => key === 'en' ? reviewForm.elements.en.closest('.review-word-row') :
    reviewForm.elements[key].parentElement;
  blockOf(keys[0]).before(group);
  for (const key of keys) {
    if (shortLabels[key]) {
      reviewForm.elements[key].setAttribute('aria-label', resultFields[key]);
      blockOf(key).firstChild.textContent = shortLabels[key];
    }
    group.append(blockOf(key));
  }
}
// The reference sentence and its translation come last, after 전공 and 단어장.
referencePreview.after(reviewForm.elements.referenceTranslation.parentElement);
reviewForm.elements.en.addEventListener('input', () => {
  if (draft) updateDiagram();
});

function invalidateReview() {
  draft = null;
  reviewForm.hidden = true;
  setReviewMode(false);
  status.textContent = '';
}

function showToast(message) {
  status.textContent = message;
}

async function runAnalysis() {
  if (analyzing) return;
  refreshNotebookChoices();
  const autoCourse = Boolean(request.autoCourse);
  const createFirstCourse = autoCourse && Object.keys(allCourses()).length === 0;
  const term = request.term.trim();
  const selected = request.selected || '';
  const context = (request.context || '').trim();
  // 전공 의미 + 새 단어장: the user typed the name; the notebook is created on save.
  const requestedNewCourse = !autoCourse && typeof request.newCourseName === 'string' ?
    request.newCourseName.trim().slice(0, 60) : '';
  const createsCourse = createFirstCourse || Boolean(requestedNewCourse);
  const destinationName = requestedNewCourse || courseNames(selected)[0];
  errorCard.hidden = true;
  if (!/[a-z\p{Script=Hangul}]/iu.test(term)) {
    showError('한국어 또는 영어 전공 단어를 입력하세요.');
    return;
  }
  if (!autoCourse && !requestedNewCourse && (!selected || !hasCourse(selected))) {
    showError('저장할 단어장이 없거나 삭제됐습니다. 입력 화면에서 단어장을 다시 선택해 주세요.');
    return;
  }
  const remaining = analysisRequestGate.remainingMs();
  if (remaining > 0) {
    status.textContent = '3초 이내 중복 요청을 차단했습니다. ' +
      Math.ceil(remaining / 1000) + '초 후 다시 눌러 주세요.';
    return;
  }
  const ticket = analysisRequestGate.begin();
  if (!ticket.allowed) return;
  // A reload must not silently pay for the same analysis twice.
  try { sessionStorage.setItem(CAPTURE_STARTED_KEY, request.id); } catch {}
  analyzing = true;
  draft = null;
  reviewForm.hidden = true;
  for (const item of inputControls) item.disabled = true;
  setReviewMode(false);
  errorCard.hidden = true;
  showWaiting(term);
  status.textContent = '';
  try {
    const result = await WordCollectorAI.request({term,
      course: autoCourse ? undefined : destinationName, context, autoCourse,
      translateReference: Boolean(context),
      // 의미 기준: everyday meaning, the meaning in the major the user typed, or
      // 'context' (전공 모름: the field is found from the reference sentence).
      meaningMode: request.meaningMode === 'major' && request.majorField ? 'major'
        : request.meaningMode === 'context' && context ? 'context' : 'general',
      ...(request.meaningMode === 'major' && request.majorField ? {majorField: String(request.majorField).trim().slice(0, 60)} : {}),
      notebooks: autoCourse ? currentNotebooks() : withNotebook(currentNotebooks(), destinationName)}, {signal:ticket.signal});
    if (!analysisRequestGate.isCurrent(ticket.id)) return;
    // Two related English words on one line, separated by commas (no meanings), editable before saving.
    result.related = Array.isArray(result.relatedWords) ? result.relatedWords
      .map(word => String(word?.en ?? '').trim()).filter(Boolean).slice(0, 2).join(', ') : '';
    result.pos = koreanPartOfSpeech(result.pos);
    for (const key of Object.keys(resultFields)) reviewForm.elements[key].value = result[key] ?? '';
    const translationLabel = reviewForm.elements.referenceTranslation.parentElement;
    const fromReference = Boolean(context) && result.exampleSource === 'reference';
    // The reference sentence normally fills the 예문 fields (영어 = the sentence, 한국어 = its
    // translation), so it is not repeated at the end; it is only shown there if it was not used.
    referencePreview.textContent = context ? '참고 문장: ' + context : '';
    referencePreview.hidden = !context || fromReference;
    // 일반 의미 with several parts of speech: the server reports missing ones.
    $('#review-pos-warning').textContent = typeof result.posWarning === 'string' ? result.posWarning.slice(0, 200) : '';
    $('#review-pos-warning').hidden = !$('#review-pos-warning').textContent;
    // Found in the glossary prepared from the registered material (no Gemini call).
    $('#review-glossary-note').hidden = result.source !== 'glossary';
    // 전공 모름: show the field the analysis found from the reference sentence.
    const foundField = request.meaningMode === 'context' && context && typeof result.discipline === 'string' ? result.discipline.trim().slice(0, 60) : '';
    $('#review-context-field').textContent = foundField ? `참고 문장으로 찾은 가장 관련 있는 전공: ${foundField}` : '';
    $('#review-context-field').hidden = !foundField;
    // 일반 의미: no example sentence, so the 예문 box is not shown.
    reviewForm.elements.exampleEn.closest('fieldset').hidden = result.exampleSource === 'none';
    // A reference sentence replaces the generated example: the example field
    // holds the English sentence and the translation field the Korean one, so
    // the separate reference-translation field would only repeat them.
    translationLabel.hidden = !context || fromReference;
    translationLabel.firstChild.textContent = '참고 문장 ' + referenceTranslationLabel(context);
    let target = autoCourse ?
      Object.keys(allCourses()).find(id => courseNames(id)[0] === result.course) :
      requestedNewCourse ? 'notebook_' + crypto.randomUUID() : selected;
    let newCourseName = requestedNewCourse || undefined;
    if (createFirstCourse) {
      if (typeof result.course !== 'string' || !result.course.trim() || result.course.trim().length > 60) {
        throw new Error('새 단어장 이름을 확인하지 못했습니다. 다시 분석해 주세요.');
      }
      newCourseName = result.course.trim();
      target = 'notebook_' + crypto.randomUUID();
    }
    if (!target) throw new Error('추천 단어장을 확인할 수 없습니다. 다시 분석해 주세요.');
    if (autoCourse && (!result.classification || !Array.isArray(result.classification.relatedTerms))) {
      throw new Error('단어장 추천 근거를 확인할 수 없습니다. 다시 분석해 주세요.');
    }
    draft = {term, newCourseName, createsCourse, suggestedCourseName: createFirstCourse ? newCourseName : undefined, referenceSentence: context,
      exampleSource: context && result.exampleSource === 'reference' ? 'reference' : result.exampleSource === 'none' ? 'none' : '', model: result.model, recommended: autoCourse ? target : null, selected: target,
      diagram: supportsEddyDiagram(result.en, target) ? 'eddy-loops' : null};
    // Users always control the destination, including when the notebook contains no words.
    // With no notebooks yet, they review (and may edit) the new notebook's name instead.
    $('#review-course-row').hidden = createsCourse;
    $('#review-new-course-row').hidden = !createsCourse;
    if (createsCourse) newCourseInput.value = newCourseName;
    else reviewCourse.value = target;
    // The notebook chosen on the input page can still be changed here.
    reviewCourse.disabled = false;
    drawDiagram();
    updateReviewTarget();
    showRecommendation(result, autoCourse, context);
    // Analysis only: no photo is requested from this page.
    setWaitingStep('analysis', 'done');
    // Evidence from the registered textbooks: not shown on the review screen
    // (no 근거 보기 / 자료 근거 미확인 here); the saved word keeps it.
    const evidence = WordCollectorEvidence.sanitize(result.evidence);
    setWaitingStep('evidence', evidence.status === 'search_failed' ? 'failed' : 'done');
    draft.evidence = evidence;
    hideWaiting();
    reviewForm.hidden = false;
    autoGrowAll(reviewForm);   // long analysis text: boxes fit their content
    setReviewMode(true);
    setSkipVisible(true);
    reviewForm.scrollIntoView({block: 'start'});
    status.textContent = result.needsManualCompletion ?
      '서버 호환 모드에서 품사와 예문 번역이 비어 있습니다. 지금 그대로 저장하거나 나중에 채울 수 있습니다.' :
      createsCourse ? '분석 완료. 새 단어장 이름과 결과를 검토한 뒤 저장하세요.' : '';
  } catch (error) {
    if (!analysisRequestGate.isCurrent(ticket.id)) return;
    showError(['TimeoutError','AbortError'].includes(error.name) ?
      '분석 시간이 초과됐습니다. 다시 시도해 주세요.' :
      error instanceof TypeError || error instanceof SyntaxError ?
      'AI 분석 서버에 연결할 수 없습니다. 인터넷 연결을 확인하세요.' : error.message);
  } finally {
    if (analysisRequestGate.finish(ticket.id)) {
      if (reviewForm.hidden) hideWaiting();
      analyzing = false;
    }
  }
}

retryButton.addEventListener('click', () => {
  if (!analyzing && request) void runAnalysis();
});

// Start as soon as the page opens. Without a request (opened directly) go to
// the input page; after a reload of an already started request, ask before
// spending another API call.
if (!request) {
  location.replace('code.html');
} else {
  let alreadyStarted = false;
  try { alreadyStarted = sessionStorage.getItem(CAPTURE_STARTED_KEY) === request.id; } catch {}
  if (alreadyStarted) {
    showError('이 단어는 이미 분석을 요청했어요. 화면을 새로 고치면 결과가 사라집니다.\n' +
      '다시 분석하면 API 사용량이 추가됩니다.');
  } else {
    void runAnalysis();
  }
}

let saving = false;
async function saveReview() {
  if (!draft || saving) return;
  const result = Object.fromEntries(Object.keys(resultFields).map(key =>
    [key, reviewForm.elements[key].value.trim()]));
  // 관련 단어 is edited as one comma-separated line; it is saved one word per line as before.
  result.related = result.related.split(/\s*[,\n]\s*/).filter(Boolean).join('\n');
  const validation = WordCollectorPartialTerm.validate(result);
  if (!validation.ok) {
    status.textContent = validation.message;
    status.scrollIntoView({block: 'center'});
    return;
  }
  if (draft.createsCourse && !draft.newCourseName) {
    status.textContent = '새 단어장 이름을 입력해 주세요.';
    newCourseInput.focus();
    return;
  }
  const savingDraft = draft;
  saving = true;
  const controls = [...new Set([...inputControls, ...reviewForm.elements])];
  const disabled = controls.map(control => control.disabled);
  controls.forEach(control => { control.disabled = true; });
  try {
    if (draft !== savingDraft) return;
    state = load();
    const courses = {...allCourses()};
    if (draft.newCourseName) {
      // Never save into another notebook that happens to have this name.
      if (notebookNameTaken(draft.newCourseName)) {
        status.textContent = NOTEBOOK_NAME_TAKEN_MESSAGE;
        newCourseInput.focus();
        return;
      }
      courses[draft.selected] = [draft.newCourseName, ''];
    } else if (!hasCourse(draft.selected)) {
      status.textContent = '저장할 단어장이 삭제됐습니다. 단어장을 다시 선택해 주세요.';
      return;
    }
    const existing = WordCollectorPartialTerm.findExisting(state.terms, draft.selected, result);
    if (existing && !confirm('이 단어장에 같은 단어가 있어요. 검수한 결과로 기존 단어를 업데이트할까요?')) return;
    const [id, previous] = existing || ['term_' + crypto.randomUUID(), {}];
    const word = {...previous, ...result, course: draft.selected, referenceSentence: draft.referenceSentence, pron: result.pos, analysisModel: draft.model};
    // The sources shown when this explanation was made stay with the word.
    if (draft.evidence) word.evidence = draft.evidence;
    if (draft.exampleSource) word.exampleSource = draft.exampleSource;
    else delete word.exampleSource;
    // A recreated 일반 단어장 is no longer marked as deleted.
    const deleted = state.deletedCourses ? {deletedCourses: state.deletedCourses.filter(courseId => courseId !== draft.selected)} : {};
    if (commit({...state, ...deleted, courses, terms: {...state.terms, [id]: word}})) {
      draft = null;
      if (batch) { nextInBatch(word); return; }
      // Saved: the next visit to the input page starts empty.
      try { sessionStorage.removeItem(CAPTURE_REQUEST_KEY); sessionStorage.removeItem(CAPTURE_STARTED_KEY); } catch {}
      // replace(): the back button must not return to the finished analysis.
      location.replace('../' + route('words.html', {course: word.course}));
    }
  } finally {
    saving = false;
    controls.forEach((control, i) => { control.disabled = disabled[i]; });
  }
}
reviewForm.addEventListener('submit', event => {
  event.preventDefault();
  void saveReview();
});

// The tester-code UI was removed: every install uses the public per-device
// quota (X-WC-Device). Drop any code saved by an older build so an expired
// code can never block analysis without a way to clear it. Best effort only.
void Promise.resolve().then(() => {
  WordCollectorAI.setLocalServer(false);
  return WordCollectorAI.clearTesterToken();
}).catch(() => {});
