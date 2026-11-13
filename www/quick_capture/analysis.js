// Word analysis page (review.html). The input page (code.html + capture.js)
// stores the request in sessionStorage and navigates here; this page runs the
// analysis behind a waiting screen, then shows the
// review with a single "단어장에 저장" button in the bottom bar.
const CAPTURE_REQUEST_KEY = 'word-collector-capture-request-v1';
const CAPTURE_STARTED_KEY = 'word-collector-capture-started-v1';
const reviewForm = $('#analysis-review');
const status = $('#analysis-status');
const saveActionButton = $('#save-action-btn');
const errorCard = $('#analysis-error');
const errorMessage = $('#analysis-error-message');
const retryButton = $('#analysis-retry');
const waiting = $('#analysis-waiting');
const waitingTitle = $('#analysis-waiting-title');
const waitingTerm = $('#analysis-waiting-term');
const waitingElapsed = $('#analysis-waiting-elapsed');
const waitingCancel = $('#analysis-waiting-cancel');
const STEP_STATES = {
  waiting: ['schedule', '대기'], active: ['pending', '진행 중'], done: ['check_circle', '완료'],
  failed: ['error', '실패 · 검수 화면에서 다시 시도'], skipped: ['skip_next', '백그라운드에서 계속']
};
let waitingTimer = null;
let waitingStartedAt = 0;
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
  waitingTitle.textContent = 'AI가 단어를 분석하고 있어요';
  waitingTerm.textContent = '“' + term + '”';
  setWaitingStep('analysis', 'active');
  waitingStartedAt = Date.now();
  waitingElapsed.textContent = '0초 경과';
  clearInterval(waitingTimer);
  waitingTimer = setInterval(() => {
    const seconds = Math.floor((Date.now() - waitingStartedAt) / 1000);
    waitingElapsed.textContent = seconds + '초 경과';
  }, 1000);
  waiting.hidden = false;
  waitingCancel.focus({preventScroll: true});
}
function hideWaiting() {
  clearInterval(waitingTimer);
  waitingTimer = null;
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
}
$('#analysis-back-to-input').addEventListener('click', goBackToInput);
const reviewCourse = $('#review-course');
const inputControls = [];
// Display order of the review (전공 is shown above the 단어장 select).
const resultFields = {
  discipline: '전공',
  en: '단어',
  ko: '한국어 뜻',
  enDef: '영어 정의',
  koDef: '한국어 정의',
  exampleEn: '영어 예문',
  exampleKo: '한국어 예문',
  pos: '품사',
  related: '관련 단어',
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
$('#review-fields').before(referencePreview);

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
});
waitingCancel.addEventListener('click', () => {
  analysisRequestGate.cancel();
  invalidateReview();
  hideWaiting();
  analyzing = false;
  // The typed word stays saved, so the input page shows it again.
  goBackToInput();
});
// Notebook choices for the review's "저장할 과목" select (IDs, not display names).
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
  $('#review-target').textContent = draft.term +
    (draft.recommended ? ' · AI 추천: ' + (draft.newCourseName || courseNames(draft.recommended)[0]) : '') +
    ' · 저장: ' + (draft.newCourseName || courseNames(draft.selected)[0]);
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
  input.rows = ['en', 'ko', 'pos'].includes(key) ? 1 : 2;
  if (key === 'related') input.placeholder = '예: capacitance';
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
  refreshNotebookChoices();
  const autoCourse = Boolean(request.autoCourse);
  const createFirstCourse = autoCourse && Object.keys(allCourses()).length === 0;
  const term = request.term.trim();
  const selected = request.selected || '';
  const context = (request.context || '').trim();
  errorCard.hidden = true;
  if (!/[a-z\p{Script=Hangul}]/iu.test(term)) {
    showError('한국어 또는 영어 전공 단어를 입력하세요.');
    return;
  }
  if (!autoCourse && (!selected || !hasCourse(selected))) {
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
      course: autoCourse ? undefined : courseNames(selected)[0], context, autoCourse,
      translateReference: Boolean(context),
      notebooks: currentNotebooks()}, {signal:ticket.signal});
    if (!analysisRequestGate.isCurrent(ticket.id)) return;
    // Two related English words, one per line (no meanings), editable before saving.
    result.related = Array.isArray(result.relatedWords) ? result.relatedWords
      .map(word => String(word?.en ?? '').trim()).filter(Boolean).slice(0, 2).join('\n') : '';
    result.pos = koreanPartOfSpeech(result.pos);
    for (const key of Object.keys(resultFields)) reviewForm.elements[key].value = result[key] ?? '';
    referencePreview.textContent = context ? '참고 문장: ' + context : '';
    referencePreview.hidden = !context;
    const translationLabel = reviewForm.elements.referenceTranslation.parentElement;
    const fromReference = Boolean(context) && result.exampleSource === 'reference';
    // A reference sentence replaces the generated example: the example field
    // holds the English sentence and the translation field the Korean one, so
    // the separate reference-translation field would only repeat them.
    translationLabel.hidden = !context || fromReference;
    translationLabel.firstChild.textContent = '참고 문장 ' + referenceTranslationLabel(context);
    let target = autoCourse ?
      Object.keys(allCourses()).find(id => courseNames(id)[0] === result.course) : selected;
    let newCourseName;
    if (createFirstCourse) {
      if (typeof result.course !== 'string' || !result.course.trim() || result.course.trim().length > 60) {
        throw new Error('새 단어장 이름을 확인하지 못했습니다. 다시 분석해 주세요.');
      }
      newCourseName = result.course.trim();
      target = 'notebook_' + crypto.randomUUID();
      reviewCourse.add(new Option(newCourseName, target));
    }
    if (!target) throw new Error('추천 과목을 확인할 수 없습니다. 다시 분석해 주세요.');
    if (autoCourse && (!result.classification || !Array.isArray(result.classification.relatedTerms))) {
      throw new Error('단어장 추천 근거를 확인할 수 없습니다. 다시 분석해 주세요.');
    }
    draft = {term, newCourseName, referenceSentence: context,
      exampleSource: context && result.exampleSource === 'reference' ? 'reference' : '', model: result.model, recommended: autoCourse ? target : null, selected: target,
      diagram: supportsEddyDiagram(result.en, target) ? 'eddy-loops' : null};
    reviewCourse.value = target;
    // Users always control the destination, including when the notebook contains no words.
    $('#review-course-row').hidden = false;
    drawDiagram();
    updateReviewTarget();
    showRecommendation(result, autoCourse, context);
    // Analysis only: no photo is requested from this page.
    setWaitingStep('analysis', 'done');
    hideWaiting();
    reviewForm.hidden = false;
    setReviewMode(true);
    reviewForm.scrollIntoView({block: 'start'});
    status.textContent = result.needsManualCompletion ?
      '서버 호환 모드에서 품사와 예문 번역이 비어 있습니다. 지금 그대로 저장하거나 나중에 채울 수 있습니다.' :
      '분석 완료. 아래 결과를 검토하세요.';
    if (createFirstCourse && !result.needsManualCompletion) await saveReview();
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
  const validation = WordCollectorPartialTerm.validate(result);
  if (!validation.ok) {
    status.textContent = validation.message;
    status.scrollIntoView({block: 'center'});
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
      const sameName = Object.keys(courses).find(id => normalize(courses[id][0]) === normalize(draft.newCourseName));
      if (sameName) draft.selected = sameName;
      else courses[draft.selected] = [draft.newCourseName, ''];
    } else if (!hasCourse(draft.selected)) {
      status.textContent = '저장할 단어장이 삭제됐습니다. 단어장을 다시 선택해 주세요.';
      return;
    }
    const existing = WordCollectorPartialTerm.findExisting(state.terms, draft.selected, result);
    if (existing && !confirm('이 단어장에 같은 단어가 있어요. 검수한 결과로 기존 단어를 업데이트할까요?')) return;
    const [id, previous] = existing || ['term_' + crypto.randomUUID(), {}];
    const word = {...previous, ...result, course: draft.selected, referenceSentence: draft.referenceSentence, pron: result.pos, analysisModel: draft.model};
    if (draft.exampleSource) word.exampleSource = draft.exampleSource;
    else delete word.exampleSource;
    if (commit({...state, courses, terms: {...state.terms, [id]: word}})) {
      draft = null;
      // Saved: the next visit to the input page starts empty.
      try { sessionStorage.removeItem(CAPTURE_REQUEST_KEY); sessionStorage.removeItem(CAPTURE_STARTED_KEY); } catch {}
      location.href = '../' + route('words.html', {course: word.course});
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
