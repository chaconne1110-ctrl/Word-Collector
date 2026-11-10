const captureScreen = $('main');
const reviewForm = $('#analysis-review');
const status = $('#analysis-status');
const analysisButton = $('#submit-action-btn');
const analysisLabel = $('#submit-btn-text');
const termInput = $('#term-unified-input');
const courseInput = $('#subject-select');
const reviewCourse = $('#review-course');
const contextInput = $('#context-sentence-input');
const inputControls = [termInput, courseInput, contextInput, ...$$('[id^="btn-mode-"], [id^="tab-ref-"]')];
const resultFields = {
  discipline: '전공',
  en: '영어 표제어',
  ko: '한국어 뜻',
  pos: '품사',
  enDef: '영어 정의',
  koDef: '한국어 해설',
  exampleEn: '영어 예문',
  exampleKo: '예문 번역'
};
let draft;
const diagramChoice = $('#diagram-choice');
const diagramRefresh = $('#diagram-refresh');
const diagramStatus = $('#diagram-status');
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
courseInput.replaceChildren();
for (const [id, [name]] of Object.keys(seed.courses).map(id => [id, courseNames(id)])) {
  courseInput.add(new Option(name, id));
  reviewCourse.add(new Option(name, id));
}

function supportsEddyDiagram(en, selected) {
  return ['eddy current', 'eddy currents'].includes(normalize(en)) &&
    ['electromagnetics', 'circuit-theory', 'electrical-machines'].includes(selected);
}

function updateReviewTarget() {
  $('#review-target').textContent = draft.term +
    (draft.recommended ? ' · AI 추천: ' + courseNames(draft.recommended)[0] : '') +
    ' · 저장: ' + courseNames(draft.selected)[0];
}

function currentNotebooks() {
  const latest = load();
  return Object.keys(seed.courses).map(id => [id, courseNames(id)]).map(([id, [course]]) => ({
    course,
    words: Object.values(latest.terms).filter(word => word.course === id).map(word =>
      Object.fromEntries(['en', 'ko', 'enDef', 'koDef'].map(field => [field, word[field] ?? ''])))
  }));
}

function showRecommendation(result, autoCourse, context) {
  $('#recommendation-details').hidden = !autoCourse;
  $('#review-analysis-basis').textContent = autoCourse ?
    '분류 기준: 각 단어장에 저장된 단어와 뜻·정의' :
    context ? '분석 기준: 참고 문장 최우선 · 저장 위치: 직접 선택한 단어장' :
      '분석 기준: 직접 선택한 단어장 (참고 문장 없음)';
  if (!autoCourse) return;
  const {reason, relatedTerms, reviewedCourses, reviewedWords} = result.classification;
  $('#recommendation-summary').textContent =
    '단어장 ' + reviewedCourses + '개 · 저장 단어 ' + reviewedWords + '개 비교';
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
  input.required = true;
  input.maxLength = key === 'en' ? 120 : 1200;
  input.rows = ['en', 'ko', 'pos'].includes(key) ? 1 : 2;
  input.className = 'block w-full rounded-lg p-2 bg-surface-container-low';
  label.append(input);
  $('#review-fields').append(label);
}
reviewForm.elements.en.addEventListener('input', () => {
  if (draft) updateDiagram();
});

function invalidateReview() {
  draft = null;
  reviewForm.hidden = true;
  status.textContent = '';
}

function showToast(message) {
  status.textContent = message;
}

captureScreen.addEventListener('input', event => {
  if (!analyzing && inputControls.includes(event.target)) invalidateReview();
});
for (const control of inputControls.slice(3)) {
  control.addEventListener('click', invalidateReview, {capture: true});
}

analysisButton.addEventListener('click', async () => {
  if (analyzing) return;
  const autoCourse = !$('#section-mode-ai').classList.contains('hidden');
  if ((!autoCourse && $('#section-mode-existing').classList.contains('hidden')) ||
      $('#ref-section-sentence').classList.contains('hidden')) {
    status.textContent = 'AI 자동 분류 또는 기존 과목 선택을 사용하고, 참고 문장 탭에서 분석해 주세요.';
    return;
  }
  const term = termInput.value.trim();
  const selected = courseInput.value;
  const context = contextInput.value.trim();
  if (!/[a-z\p{Script=Hangul}]/iu.test(term)) {
    status.textContent = '한국어 또는 영어 전공 단어를 입력하세요.';
    return;
  }
  analyzing = true;
  draft = null;
  reviewForm.hidden = true;
  for (const item of inputControls) item.disabled = true;
  analysisButton.disabled = true;
  analysisLabel.textContent = '분석 중…';
  status.textContent = 'Gemini에 분석을 요청하고 있어요.';
  try {
    const result = await WordCollectorAI.request({term,
      course: autoCourse ? undefined : courseNames(selected)[0], context, autoCourse,
      ...(autoCourse ? {notebooks: currentNotebooks()} : {})});
    for (const key of Object.keys(resultFields)) reviewForm.elements[key].value = result[key];
    const target = autoCourse ?
      Object.keys(seed.courses).find(id => courseNames(id)[0] === result.course) : selected;
    if (!target) throw new Error('추천 과목을 확인할 수 없습니다. 다시 분석해 주세요.');
    if (autoCourse && (!result.classification || !Array.isArray(result.classification.relatedTerms))) {
      throw new Error('단어장 추천 근거를 확인할 수 없습니다. 다시 분석해 주세요.');
    }
    draft = {term, model: result.model, recommended: autoCourse ? target : null, selected: target,
      diagram: supportsEddyDiagram(result.en, target) ? 'eddy-loops' : null};
    reviewCourse.value = target;
    $('#review-course-row').hidden = !autoCourse;
    drawDiagram();
    updateReviewTarget();
    showRecommendation(result, autoCourse, context);
    reviewForm.hidden = false;
    reviewForm.scrollIntoView({block: 'start'});
    status.textContent = '분석 완료. 아래 결과를 검토하세요.';
  } catch (error) {
    status.textContent = ['TimeoutError','AbortError'].includes(error.name) ? '분석 시간이 초과됐습니다. 잠시 후 다시 시도해 주세요.' : error instanceof TypeError || error instanceof SyntaxError ?
      'AI 분석 서버에 연결할 수 없습니다. 인터넷 연결과 선택한 서버를 확인하세요.' : error.message;
  } finally {
    analyzing = false;
    for (const item of inputControls) item.disabled = false;
    analysisButton.disabled = false;
    analysisLabel.textContent = 'AI 분석 시작';
  }
});

reviewForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!draft) return;
  state = load();
  const result = Object.fromEntries(Object.keys(resultFields).map(key =>
    [key, reviewForm.elements[key].value.trim()]));
  if (Object.values(result).some(value => !value)) {
    status.textContent = '검토 항목을 모두 입력하세요.';
    status.scrollIntoView({block: 'center'});
    return;
  }
  if (!/[a-z]/i.test(result.en) || /\p{Script=Hangul}/u.test(result.en) || result.en.length > 120) {
    status.textContent = '영어 표제어를 확인해 주세요.';
    status.scrollIntoView({block: 'center'});
    return;
  }
  const existing = Object.entries(state.terms).find(([, item]) =>
    item.course === draft.selected && normalize(item.en) === normalize(result.en));
  if (existing && !confirm('이 단어장에 같은 단어가 있어요. 검수한 결과로 기존 단어를 업데이트할까요?')) return;
  const [id, previous] = existing || ['term_' + crypto.randomUUID(), {formula: ''}];
  const word = {...previous, ...result, course: draft.selected, pron: result.pos, analysisModel: draft.model};
  delete word.diagram;
  if (draft.diagram && supportsEddyDiagram(result.en, draft.selected)) word.diagram = draft.diagram;
  if (commit({...state, terms: {...state.terms, [id]: word}})) {
    draft = null;
    location.href = '../' + route('words.html', {course: word.course});
  }
});

const testerToken = $('#tester-token');
const testerStatus = $('#tester-status');
function configureTester(clear = false) {
  if (clear) testerToken.value = '';
  const token = testerToken.value.trim();
  const useLocal = $('#ai-server-mode').value === 'local';
  if (!clear && !useLocal && !/^wc_[a-f0-9]{64}$/.test(token)) {
    testerStatus.textContent = '발급받은 테스터 인증 코드 형식을 확인해 주세요.';
    return;
  }
  WordCollectorAI.configure({testerToken: token, useLocal});
  testerToken.value = '';
  testerStatus.textContent = clear ? '인증 코드를 지웠습니다.' : useLocal ? 'PC 로컬 개발 서버를 선택했습니다.' : '인증 코드가 등록되었습니다. 이 화면에서만 유지됩니다.';
}
$('#register-tester').addEventListener('click', () => configureTester());
$('#clear-tester').addEventListener('click', () => configureTester(true));
$('#ai-server-mode').addEventListener('change', () => configureTester(true));
