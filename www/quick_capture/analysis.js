// Word analysis page (review.html). The input page (code.html + capture.js)
// stores the request in sessionStorage and navigates here; this page runs the
// analysis and the photo generation behind a waiting screen, then shows the
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
const waitingSkip = $('#analysis-waiting-skip');
const waitingCancel = $('#analysis-waiting-cancel');
const WAITING_SKIP_AFTER_S = 15;
const STEP_STATES = {
  waiting: ['schedule', '대기'], active: ['pending', '진행 중'], done: ['check_circle', '완료'],
  failed: ['error', '실패 · 검수 화면에서 다시 시도'], skipped: ['skip_next', '백그라운드에서 계속']
};
let waitingTimer = null;
let waitingStartedAt = 0;
let waitingSkipResolve = null;
function setWaitingStep(step, state) {
  const item = waiting.querySelector('[data-step="' + step + '"]');
  if (!item) return;
  item.dataset.state = state;
  item.querySelector('.wc-step-icon').textContent = STEP_STATES[state][0];
  item.querySelector('.wc-step-state').textContent = STEP_STATES[state][1];
}
// Full-screen waiting screen from the analysis request until the photo is done.
function showWaiting(term) {
  waitingTitle.textContent = 'AI가 단어를 분석하고 있어요';
  waitingTerm.textContent = '“' + term + '”';
  setWaitingStep('analysis', 'active');
  setWaitingStep('photo', 'waiting');
  waitingSkip.hidden = true;
  waitingStartedAt = Date.now();
  waitingElapsed.textContent = '0초 경과';
  clearInterval(waitingTimer);
  waitingTimer = setInterval(() => {
    const seconds = Math.floor((Date.now() - waitingStartedAt) / 1000);
    waitingElapsed.textContent = seconds + '초 경과';
    const photoItem = waiting.querySelector('[data-step="photo"]');
    if (photoItem.dataset.state === 'active' && seconds >= WAITING_SKIP_AFTER_S) waitingSkip.hidden = false;
  }, 1000);
  waiting.hidden = false;
  waitingCancel.focus({preventScroll: true});
}
function hideWaiting() {
  clearInterval(waitingTimer);
  waitingTimer = null;
  waitingSkipResolve = null;
  waitingSkip.hidden = true;
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
waitingSkip.addEventListener('click', () => { waitingSkipResolve?.(); });
const reviewCourse = $('#review-course');
const inputControls = [];
const resultFields = {
  discipline: '전공',
  en: '영어 표제어',
  ko: '한국어 뜻',
  pos: '품사',
  enDef: '영어 정의',
  koDef: '한국어 해설',
  exampleEn: '영어 예문',
  exampleKo: '예문 번역',
  referenceTranslation: '참고 문장 해석'
};
let draft;
const diagramChoice = $('#diagram-choice');
const diagramRefresh = $('#diagram-refresh');
const diagramStatus = $('#diagram-status');
const reviewPhotoButton = $('#review-photo-generate');
const reviewPhotoImage = $('#review-photo-image');
const reviewPhotoStatus = $('#review-photo-status');
let photoDraft = null;
let photoBusy = false;
let photoTask = Promise.resolve();
const photoRequestGate = WordCollectorRequestGate.create();
async function startReviewPhoto({automatic = false} = {}) {
  if (!draft) return;
  const remaining = photoRequestGate.remainingMs();
  if (remaining > 0) {
    if (!automatic) reviewPhotoStatus.textContent = '3초 이내 중복 사진 요청을 차단했습니다. ' +
      Math.ceil(remaining / 1000) + '초 후 미완료면 다시 누를 수 있습니다.';
    return;
  }
  if (!automatic) {
    if (photoBusy) {
      if (!confirm('이전 사진 생성이 진행 중입니다. 재요청하면 추가 API 사용량이 발생할 수 있습니다. 계속할까요?')) return;
    } else if (photoDraft) {
      if (!confirm('새 사진 요청은 API 1회가 추가됩니다. 기존 사진을 교체할까요?')) return;
    } else if (!confirm('사진을 다시 요청하면 API 사용량 1회가 추가됩니다. 계속할까요?')) return;
  }
  const ticket = photoRequestGate.begin();
  if (!ticket.allowed) return;
  photoBusy = true;
  reviewPhotoButton.textContent = '사진 생성 중 · 3초 후 재요청 가능';
  reviewPhotoStatus.textContent = automatic ?
    '단어 분석 완료. AI 학습 사진을 자동 생성 중입니다(별도 API 1회).' :
    '사진을 다시 요청했습니다. 이전 요청도 서버에서 처리됐다면 과금될 수 있습니다.';
  const word = reviewForm.elements.en.value.trim() || reviewForm.elements.ko.value.trim() || draft.term;
  const koreanMeaning = reviewForm.elements.ko.value.trim() || word;
  const definition = (reviewForm.elements.koDef.value || reviewForm.elements.enDef.value ||
    koreanMeaning || word).trim().slice(0, 700);
  photoTask = (async () => {
  try {
    const r = await WordCollectorAI.createImage({
      word, koreanMeaning, subject:draft.newCourseName || courseNames(draft.selected)[0], definition
    }, {signal:ticket.signal});
    if (!photoRequestGate.isCurrent(ticket.id) || !draft) return;
    photoDraft = r.image;
    reviewPhotoImage.src = 'data:' + r.image.mimeType + ';base64,' + r.image.data;
    reviewPhotoImage.hidden = false;
    reviewPhotoStatus.textContent = '';
  } catch (error) {
    if (!photoRequestGate.isCurrent(ticket.id)) return;
    reviewPhotoStatus.textContent = '내용 분석은 완료됐지만 사진 생성에 실패했습니다: ' +
      (error?.message || '원인 불명') + ' · 단어만 저장하거나 사진을 재요청할 수 있습니다.';
  } finally {
    if (photoRequestGate.finish(ticket.id)) {
      photoBusy = false;
      reviewPhotoButton.textContent = photoDraft ? '사진 다시 생성 (추가 API 1회)' : '사진 다시 시도 (추가 API 1회)';
    }
  }
  })();
  return photoTask;
}
reviewPhotoButton.addEventListener('click', () => { void startReviewPhoto(); });

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
  photoRequestGate.cancel();
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
  if (key === 'referenceTranslation') {
    label.hidden = true;
    input.placeholder = '해석이 없으면 직접 입력하거나 다시 분석해 주세요.';
  }
  input.className = 'block w-full rounded-lg p-2 bg-surface-container-low';
  label.append(input);
  $('#review-fields').append(label);
}
reviewForm.elements.en.addEventListener('input', () => {
  if (draft) updateDiagram();
});

function invalidateReview() {
  photoRequestGate.cancel();
  photoBusy = false;
  draft = null;
  photoDraft = null;
  reviewPhotoImage.hidden = true;
  reviewPhotoImage.removeAttribute('src');
  reviewPhotoButton.textContent = '사진 생성 (별도 유료 API 1회)';
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
  photoDraft = null;
  reviewPhotoImage.hidden = true;
  reviewPhotoImage.removeAttribute('src');
  reviewPhotoButton.textContent = '사진 생성 (별도 유료 API 1회)';
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
    reviewForm.elements.exampleEn.parentElement.firstChild.textContent =
      fromReference ? '영어 문장 (참고 문장)' : resultFields.exampleEn;
    reviewForm.elements.exampleKo.parentElement.firstChild.textContent =
      fromReference ? '한국어 문장 (참고 문장)' : resultFields.exampleKo;
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
    // Start exactly one independent photo request after a successful analysis and
    // keep the waiting screen until it finishes (success or failure); then open
    // the review. After WAITING_SKIP_AFTER_S seconds the user may skip waiting: the photo keeps
    // generating and appears in the review when ready. Saving waits for it.
    setWaitingStep('analysis', 'done');
    setWaitingStep('photo', 'active');
    waitingTitle.textContent = 'AI 학습 사진을 만들고 있어요';
    const photoDone = Promise.resolve(startReviewPhoto({automatic:true})).then(() => 'done');
    const skipped = new Promise(resolve => { waitingSkipResolve = () => resolve('skip'); });
    const outcome = await Promise.race([photoDone, skipped]);
    if (!analysisRequestGate.isCurrent(ticket.id)) return;
    setWaitingStep('photo', outcome === 'skip' ? 'skipped' : photoDraft ? 'done' : 'failed');
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
    if (photoBusy) status.textContent = '사진 생성이 끝나면 단어와 함께 저장합니다.';
    await photoTask;
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
    const [id, previous] = existing || ['term_' + crypto.randomUUID(), {formula: ''}];
    const word = {...previous, ...result, course: draft.selected, referenceSentence: draft.referenceSentence, pron: result.pos, analysisModel: draft.model};
    if (draft.exampleSource) word.exampleSource = draft.exampleSource;
    else delete word.exampleSource;
    delete word.diagram;
    if (draft.diagram && supportsEddyDiagram(result.en, draft.selected)) word.diagram = draft.diagram;
    if (commit({...state, courses, terms: {...state.terms, [id]: word}})) {
      if (photoDraft) {
        try { await WordCollectorPhoto.save(id, photoDraft); }
        catch (error) {
          status.textContent = '단어는 저장됐지만 사진 저장에 실패했습니다: ' + error.message;
          return;
        }
      }
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
