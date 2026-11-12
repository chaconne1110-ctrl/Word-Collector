const captureScreen = $('main');
const reviewForm = $('#analysis-review');
const status = $('#analysis-status');
const analysisButton = $('#submit-action-btn');
const analysisLabel = $('#submit-btn-text');
const termInput = $('#term-unified-input');
const courseInput = $('#subject-select');
const reviewCourse = $('#review-course');
const customCourseInput = $('#custom-subject-input');
const contextInput = $('#context-sentence-input');
const inputControls = [termInput, courseInput, contextInput, customCourseInput, ...$$('[id^="btn-mode-"], [id^="tab-ref-"]')];
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
const reviewPhotoButton = $('#review-photo-generate');
const reviewPhotoImage = $('#review-photo-image');
const reviewPhotoStatus = $('#review-photo-status');
let photoDraft = null;
let photoBusy = false;
const photoRequestGate = WordCollectorRequestGate.create();
reviewPhotoButton.addEventListener('click', async () => {
  if (!draft) return;
  const remaining = photoRequestGate.remainingMs();
  if (remaining > 0) {
    reviewPhotoStatus.textContent = '사진 생성 중복 요청을 차단했습니다. ' +
      Math.ceil(remaining / 1000) + '초 후에도 미완료라면 다시 누를 수 있습니다.';
    return;
  }
  if (photoBusy) {
    if (!confirm('이전 사진 생성이 아직 완료되지 않았습니다. 재요청하면 이전 요청도 과금될 수 있습니다. 다시 요청할까요?')) return;
  } else if (photoDraft) {
    if (!confirm('사진을 다시 생성하면 추가 API 요금이 발생합니다. 미저장 사진을 교체할까요?')) return;
  } else if (!confirm('Gemini 이미지 생성에는 별도 API 요금이 발생합니다. 사진을 생성할까요?')) {
    return;
  }
  const ticket = photoRequestGate.begin();
  if (!ticket.allowed) return;
  photoBusy = true;
  reviewPhotoButton.textContent = '생성 중 · 3초 후 재요청 가능';
  reviewPhotoStatus.textContent = ticket.replaced ?
    '이전 브라우저 요청을 중단하고 다시 요청했습니다. 이미 처리된 서버 요청은 과금될 수 있습니다.' :
    'AI 사진을 제작 중입니다. 3초 이내 추가 요청은 차단됩니다.';
  try {
    const r = await WordCollectorAI.createImage({
      word:reviewForm.elements.en.value.trim() || reviewForm.elements.ko.value.trim(),
      koreanMeaning:reviewForm.elements.ko.value.trim(),
      subject:courseNames(draft.selected)[0],
      definition:(reviewForm.elements.koDef.value || reviewForm.elements.enDef.value).slice(0,700)
    }, {signal:ticket.signal});
    if (!photoRequestGate.isCurrent(ticket.id)) return;
    photoDraft = r.image;
    reviewPhotoImage.src = 'data:' + r.image.mimeType + ';base64,' + r.image.data;
    reviewPhotoImage.hidden = false;
    reviewPhotoButton.textContent = '사진 다시 생성 (추가 과금)';
    reviewPhotoStatus.textContent = '사진 제작 완료. 단어장에 저장하면 사진도 함께 저장됩니다.';
  } catch (error) {
    if (!photoRequestGate.isCurrent(ticket.id)) return;
    reviewPhotoStatus.textContent = error?.message || '사진을 생성하지 못했습니다.';
  } finally {
    if (photoRequestGate.finish(ticket.id)) {
      photoBusy = false;
      reviewPhotoButton.textContent = photoDraft ? '사진 다시 생성 (추가 과금)' : '사진 생성 (별도 유료 API 1회)';
    }
  }
});

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
// Keep the selected notebook ID (not the display name) across UI navigation and new notebooks.
// This also handles Safari PWA resumes and another tab creating/deleting a notebook.
const initialCourseId = new URLSearchParams(location.search).get('course');
function refreshNotebookChoices() {
  const oldSelection = courseInput.value || initialCourseId;
  const oldReview = reviewCourse.value;
  state = load();
  const notebookEntries = Object.entries(allCourses());
  const options = () => notebookEntries.map(([id, [name]]) => new Option(name, id));
  courseInput.replaceChildren(...options());
  reviewCourse.replaceChildren(...options());
  if (oldSelection && hasCourse(oldSelection)) courseInput.value = oldSelection;
  if (oldReview && hasCourse(oldReview)) reviewCourse.value = oldReview;
  $('#existing-notebook-count').textContent = '등록된 ' + notebookEntries.length + '개 단어장';
  const existingButton = $('#btn-mode-existing');
  existingButton.disabled = notebookEntries.length === 0;
  if (!notebookEntries.length) {
    existingButton.setAttribute('aria-label', '단어장이 없습니다. 직접 입력으로 먼저 만들어 주세요.');
    if ($('#section-mode-existing').classList.contains('hidden') === false) setCategoryMode('direct');
  } else {
    existingButton.removeAttribute('aria-label');
  }
}
refreshNotebookChoices();
window.addEventListener('pageshow', () => {
  if (!analyzing) refreshNotebookChoices();
});

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
  state = load();
  return Object.keys(allCourses()).map(id => [id, courseNames(id)]).map(([id, [course]]) => ({
    course,
    words: Object.values(state.terms).filter(word => word.course === id).map(word =>
      Object.fromEntries(['en', 'ko', 'enDef', 'koDef'].map(field => [field, word[field] ?? ''])))
  }));
}

function showRecommendation(result, autoCourse, context) {
  $('#recommendation-details').hidden = !autoCourse;
  $('#review-analysis-basis').textContent = autoCourse ?
    (result.classification?.reviewedWords === 0 ?
      '저장된 단어가 없어 단어장 이름과 입력 단어·참고 문장으로 임시 추천했습니다. 아래에서 저장 위치를 직접 선택할 수 있습니다.' :
      '분류 기준: 각 단어장에 저장된 단어와 뜻·정의') :
    context ? '분석 기준: 참고 문장 최우선 · 저장 위치: 직접 선택한 단어장' :
      '분석 기준: 직접 선택한 단어장 (참고 문장 없음)';
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
  status.textContent = '';
}

function showToast(message) {
  status.textContent = message;
}

captureScreen.addEventListener('input', event => {
  if (!analyzing && inputControls.includes(event.target)) invalidateReview();
});
for (const control of inputControls.filter(control => control.tagName === 'BUTTON')) {
  control.addEventListener('click', invalidateReview, {capture: true});
}

analysisButton.addEventListener('click', async () => {
  if (draft && !reviewForm.hidden) {
    reviewForm.scrollIntoView({block:'start'});
    status.textContent = '이미 분석이 완료됐습니다. 검수한 후 저장하거나 입력 내용을 바꿔 새로 분석할 수 있습니다.';
    return;
  }
  const directCourse = !$('#section-mode-direct').classList.contains('hidden');
  const autoCourse = !directCourse && !$('#section-mode-ai').classList.contains('hidden');
  if ($('#ref-section-sentence').classList.contains('hidden')) {
    status.textContent = '참고 문장 탭에서 분석해 주세요.';
    return;
  }
  const term = termInput.value.trim();
  refreshNotebookChoices();
  let selected = courseInput.value;
  const context = contextInput.value.trim();
  if (!/[a-z\p{Script=Hangul}]/iu.test(term)) {
    status.textContent = '한국어 또는 영어 전공 단어를 입력하세요.';
    return;
  }
  if (autoCourse && !Object.keys(allCourses()).length) {
    status.textContent = '단어장이 없습니다. 직접 입력에서 새 단어장 이름을 먼저 생성해 주세요.';
    return;
  }
  if (!directCourse && !autoCourse && (!selected || !hasCourse(selected))) {
    status.textContent = '저장할 기존 단어장을 선택하거나 직접 입력에서 새 단어장을 만들어 주세요.';
    return;
  }
  const remaining = analysisRequestGate.remainingMs();
  if (remaining > 0) {
    status.textContent = '3초 이내 중복 요청을 차단했습니다. ' +
      Math.ceil(remaining / 1000) + '초 후에도 미완료라면 다시 눌러 재요청할 수 있습니다.';
    return;
  }
  if (directCourse) {
    const name = customCourseInput.value.trim();
    if (!name || name.length > 60) {
      status.textContent = '새 단어장 이름을 1~60자로 입력하세요.';
      customCourseInput.focus();
      return;
    }
    state = load();
    selected = Object.keys(allCourses()).find(id => normalize(courseNames(id)[0]) === normalize(name));
    if (!selected) {
      selected = 'notebook_' + crypto.randomUUID();
      if (!commit({...state, courses: {...allCourses(), [selected]: [name, '']}})) return;
    }
    for (const select of [courseInput, reviewCourse]) {
      if (![...select.options].some(option => option.value === selected)) select.add(new Option(courseNames(selected)[0], selected));
    }
    courseInput.value = selected;
  }
  const ticket = analysisRequestGate.begin();
  if (!ticket.allowed) return;
  analyzing = true;
  draft = null;
  photoDraft = null;
  reviewPhotoImage.hidden = true;
  reviewPhotoImage.removeAttribute('src');
  reviewPhotoButton.textContent = '사진 생성 (별도 유료 API 1회)';
  reviewForm.hidden = true;
  for (const item of inputControls) item.disabled = true;
  // Leave this button active so an unfinished request can be retried after 3 seconds.
  analysisLabel.textContent = '분석 중 · 3초 후 재요청 가능';
  status.textContent = ticket.replaced ?
    '이전 브라우저 요청을 중단하고 재요청했습니다. 이전 서버 요청도 과금될 수 있습니다.' :
    'Gemini에 분석을 요청했습니다. 3초 이내 중복 요청은 차단됩니다.';
  try {
    const result = await WordCollectorAI.request({term,
      course: autoCourse ? undefined : courseNames(selected)[0], context, autoCourse,
      notebooks: currentNotebooks()}, {signal:ticket.signal});
    if (!analysisRequestGate.isCurrent(ticket.id)) return;
    for (const key of Object.keys(resultFields)) reviewForm.elements[key].value = result[key];
    const target = autoCourse ?
      Object.keys(allCourses()).find(id => courseNames(id)[0] === result.course) : selected;
    if (!target) throw new Error('추천 과목을 확인할 수 없습니다. 다시 분석해 주세요.');
    if (autoCourse && (!result.classification || !Array.isArray(result.classification.relatedTerms))) {
      throw new Error('단어장 추천 근거를 확인할 수 없습니다. 다시 분석해 주세요.');
    }
    draft = {term, referenceSentence: context, model: result.model, recommended: autoCourse ? target : null, selected: target,
      diagram: supportsEddyDiagram(result.en, target) ? 'eddy-loops' : null};
    reviewCourse.value = target;
    // Users always control the destination, including when the notebook contains no words.
    $('#review-course-row').hidden = false;
    drawDiagram();
    updateReviewTarget();
    showRecommendation(result, autoCourse, context);
    reviewForm.hidden = false;
    reviewForm.scrollIntoView({block: 'start'});
    status.textContent = result.needsManualCompletion ?
      '서버 호환 모드에서 품사와 예문 번역이 비어 있습니다. 지금 그대로 저장하거나 나중에 채울 수 있습니다.' :
      '분석 완료. 아래 결과를 검토하세요.';
    // Present completed results immediately, including direct notebook selection.
  } catch (error) {
    if (!analysisRequestGate.isCurrent(ticket.id)) return;
    status.textContent = ['TimeoutError','AbortError'].includes(error.name) ?
      '분석 시간이 초과됐습니다. 다시 시도해 주세요.' :
      error instanceof TypeError || error instanceof SyntaxError ?
      'AI 분석 서버에 연결할 수 없습니다. 인터넷 연결과 선택한 서버를 확인하세요.' : error.message;
  } finally {
    if (analysisRequestGate.finish(ticket.id)) {
      analyzing = false;
      for (const item of inputControls) item.disabled = false;
      analysisLabel.textContent = 'AI 분석 시작';
    }
  }
});

reviewForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!draft) return;
  state = load();
  const result = Object.fromEntries(Object.keys(resultFields).map(key =>
    [key, reviewForm.elements[key].value.trim()]));
  const validation = WordCollectorPartialTerm.validate(result);
  if (!validation.ok) {
    status.textContent = validation.message;
    status.scrollIntoView({block: 'center'});
    return;
  }
  if (!hasCourse(draft.selected)) {
    status.textContent = '저장할 단어장이 삭제됐습니다. 단어장을 다시 선택해 주세요.';
    return;
  }
  const existing = WordCollectorPartialTerm.findExisting(state.terms, draft.selected, result);
  if (existing && !confirm('이 단어장에 같은 단어가 있어요. 검수한 결과로 기존 단어를 업데이트할까요?')) return;
  const [id, previous] = existing || ['term_' + crypto.randomUUID(), {formula: ''}];
  const word = {...previous, ...result, course: draft.selected, referenceSentence: draft.referenceSentence, pron: result.pos, analysisModel: draft.model};
  delete word.diagram;
  if (draft.diagram && supportsEddyDiagram(result.en, draft.selected)) word.diagram = draft.diagram;
  if (commit({...state, terms: {...state.terms, [id]: word}})) {
    if (photoDraft) {
      try {
        await WordCollectorPhoto.save(id, photoDraft);
      } catch (error) {
        status.textContent = '단어는 저장됐지만 사진 저장에 실패했습니다: ' + error.message;
        return;
      }
    }
    draft = null;
    location.href = '../' + route('words.html', {course: word.course});
  }
});

const testerToken = $('#tester-token');
const testerStatus = $('#tester-status');
const testerMode = $('#ai-server-mode');
const isHostedWeb = location.protocol === 'https:' && !['android', 'ios'].includes(window.Capacitor?.getPlatform?.());
if (isHostedWeb) {
  const localOption = testerMode.querySelector('option[value="local"]');
  if (localOption) localOption.disabled = true;
  testerMode.value = 'cloud';
}
const registerTesterButton = $('#register-tester');
const clearTesterButton = $('#clear-tester');
let testerBusy = false;

async function configureTester(clear = false) {
  if (testerBusy) return;
  testerBusy = true;
  registerTesterButton.disabled = true;
  clearTesterButton.disabled = true;
  try {
    if (clear) {
      await WordCollectorAI.clearTesterToken();
      testerToken.value = '';
      testerStatus.textContent = '기기에 저장된 인증 코드를 삭제했습니다.';
      return;
    }
    if (testerMode.value === 'local') {
      WordCollectorAI.setLocalServer(true);
      testerToken.value = '';
      testerStatus.textContent = 'PC 로컬 개발 서버를 선택했습니다. 저장된 Cloudflare 코드는 유지됩니다.';
      return;
    }
    const result = await WordCollectorAI.rememberTesterToken(testerToken.value);
    testerToken.value = '';
    testerStatus.textContent = result.persistent ?
      '인증 코드를 기기에 암호화해 저장했습니다. 다음 실행부터 자동으로 사용됩니다.' :
      '인증 코드를 웹 브라우저 세션에 등록했습니다. 브라우저 저장소를 정리하면 다시 등록해야 합니다.';
  } catch (error) {
    testerStatus.textContent = error?.message || '인증 코드를 저장하지 못했습니다.';
  } finally {
    testerBusy = false;
    registerTesterButton.disabled = false;
    clearTesterButton.disabled = false;
  }
}
registerTesterButton.addEventListener('click', () => { void configureTester(); });
clearTesterButton.addEventListener('click', () => { void configureTester(true); });
testerMode.addEventListener('change', async () => {
  WordCollectorAI.setLocalServer(testerMode.value === 'local');
  if (testerMode.value === 'local') {
    testerStatus.textContent = 'PC 로컬 개발 서버를 선택했습니다. 저장된 Cloudflare 코드는 유지됩니다.';
    return;
  }
  try {
    const stored = await WordCollectorAI.restoreTesterToken();
    testerStatus.textContent = stored ?
      '인증 코드가 현재 브라우저 세션에 등록되어 있습니다.' :
      'Cloudflare HTTPS를 선택했습니다. 인증 코드를 등록해 주세요.';
  } catch (error) {
    testerStatus.textContent = error?.message || '저장된 인증 코드를 불러오지 못했습니다.';
  }
});
void WordCollectorAI.restoreTesterToken().then(stored => {
  if (stored && testerMode.value === 'cloud') {
    testerStatus.textContent = '인증 코드가 현재 브라우저 세션에 등록되어 있습니다.';
  }
}).catch(error => {
  testerStatus.textContent = error?.message || '인증 코드 자동 등록에 실패했습니다.';
});
