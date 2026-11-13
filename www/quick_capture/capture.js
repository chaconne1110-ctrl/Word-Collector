// Word input page. It only collects the word, the notebook choice and the
// reference sentence, validates them and opens the separate analysis page
// (review.html), which runs the analysis, photo generation and review.
const CAPTURE_REQUEST_KEY = 'word-collector-capture-request-v1';
const status = $('#analysis-status');
const analysisButton = $('#submit-action-btn');
const termInput = $('#term-unified-input');
const courseInput = $('#subject-select');
const contextInput = $('#context-sentence-input');

function showToast(message) {
  status.textContent = message;
}

function readSavedRequest() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CAPTURE_REQUEST_KEY) || 'null');
    return saved && typeof saved.term === 'string' ? saved : null;
  } catch {
    return null;
  }
}

// Keep the selected notebook ID (not the display name) across UI navigation and new notebooks.
// This also handles Safari PWA resumes and another tab creating/deleting a notebook.
const initialCourseId = new URLSearchParams(location.search).get('course');
function refreshNotebookChoices() {
  const oldSelection = courseInput.value || initialCourseId;
  state = load();
  const notebookEntries = Object.entries(allCourses());
  courseInput.replaceChildren(...notebookEntries.map(([id, [name]]) => new Option(name, id)));
  if (oldSelection && hasCourse(oldSelection)) courseInput.value = oldSelection;
  $('#existing-notebook-count').textContent = '등록된 ' + notebookEntries.length + '개 단어장';
  const existingButton = $('#btn-mode-existing');
  existingButton.disabled = notebookEntries.length === 0;
  $('#no-notebooks').hidden = notebookEntries.length !== 0;
  if (!notebookEntries.length) {
    existingButton.setAttribute('aria-label', '단어장이 없어 AI 자동 분류로 새 단어장을 만듭니다.');
    setCategoryMode('ai');
  } else {
    existingButton.removeAttribute('aria-label');
  }
}

// Coming back from the analysis page restores what the user typed.
function restoreInputs() {
  const saved = readSavedRequest();
  if (!saved || termInput.value || contextInput.value) return;
  termInput.value = saved.term;
  contextInput.value = saved.context || '';
  if (saved.autoCourse) setCategoryMode('ai');
  else if (saved.selected && hasCourse(saved.selected)) {
    setCategoryMode('existing');
    courseInput.value = saved.selected;
  }
}

refreshNotebookChoices();
restoreInputs();
window.addEventListener('pageshow', () => {
  refreshNotebookChoices();
  analysisButton.disabled = false;
});

analysisButton.addEventListener('click', () => {
  refreshNotebookChoices();
  const autoCourse = !$('#section-mode-ai').classList.contains('hidden');
  const term = termInput.value.trim();
  const selected = courseInput.value;
  const context = contextInput.value.trim();
  if (!/[a-z\p{Script=Hangul}]/iu.test(term)) {
    status.textContent = '한국어 또는 영어 전공 단어를 입력하세요.';
    termInput.focus();
    return;
  }
  if (!autoCourse && (!selected || !hasCourse(selected))) {
    status.textContent = '저장할 기존 단어장을 선택하거나 홈에서 새 단어장을 만들어 주세요.';
    return;
  }
  const request = {id: crypto.randomUUID(), term, autoCourse, selected: autoCourse ? '' : selected,
    context, createdAt: Date.now()};
  try {
    sessionStorage.setItem(CAPTURE_REQUEST_KEY, JSON.stringify(request));
  } catch {
    status.textContent = '브라우저 저장소를 사용할 수 없어 분석 페이지로 이동하지 못했습니다.';
    return;
  }
  analysisButton.disabled = true;
  status.textContent = '';
  location.href = 'review.html';
});
