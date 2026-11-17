// Word input page, in screen order:
//   1. 단어장 선택: an existing notebook (any on the home screen, including the
//      일반 단어장) or a new one (name typed here, created when the word is saved)
//   2. 의미 기준: 일반 의미, or 전공 의미 with a major/department name
//   3. 단어   4. 참고자료
// The two choices are independent. It validates them and opens the separate
// analysis page (review.html), which runs the analysis and the review.
const CAPTURE_REQUEST_KEY = 'word-collector-capture-request-v1';
const status = $('#analysis-status');
const analysisButton = $('#submit-action-btn');
const termInput = $('#term-unified-input');
const courseInput = $('#subject-select');
const contextInput = $('#context-sentence-input');
const majorInput = $('#major-input');
const newNotebookInput = $('#new-notebook-input');

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
  if (oldSelection && notebookEntries.some(([id]) => id === oldSelection)) courseInput.value = oldSelection;
  $('#existing-notebook-count').textContent = '등록된 ' + notebookEntries.length + '개 단어장';
  const existingButton = $('#btn-dest-existing');
  existingButton.disabled = notebookEntries.length === 0;
  $('#no-notebooks').hidden = notebookEntries.length !== 0;
  if (!notebookEntries.length) setDestinationMode('new');
}

// Coming back from the analysis page restores what the user typed. Opening the
// page from a notebook (?course=) preselects that notebook.
function restoreInputs() {
  const saved = readSavedRequest();
  if (!saved || termInput.value || contextInput.value) {
    if (initialCourseId && hasCourse(initialCourseId)) setDestinationMode('existing');
    return;
  }
  termInput.value = saved.term;
  contextInput.value = saved.context || '';
  setMeaningMode(saved.meaningMode === 'major' ? 'major' : 'general');
  majorInput.value = saved.majorField || '';
  if (saved.newCourseName) {
    setDestinationMode('new');
    newNotebookInput.value = saved.newCourseName;
  } else if (saved.selected && hasCourse(saved.selected)) {
    setDestinationMode('existing');
    courseInput.value = saved.selected;
  }
}

refreshNotebookChoices();
restoreInputs();
autoGrowAll();
window.addEventListener('pageshow', () => {
  refreshNotebookChoices();
  analysisButton.disabled = false;
});

analysisButton.addEventListener('click', () => {
  refreshNotebookChoices();
  const term = termInput.value.trim();
  const context = contextInput.value.trim();
  const meaningMode = currentMeaningMode();
  const majorField = meaningMode === 'major' ? majorInput.value.trim() : '';
  const destination = currentDestinationMode();
  const newCourseName = destination === 'new' ? newNotebookInput.value.trim() : '';
  const selected = destination === 'existing' ? courseInput.value : '';
  if (destination === 'new' && !newCourseName) {
    status.textContent = '새 단어장 이름을 입력해 주세요.';
    newNotebookInput.focus();
    return;
  }
  if (destination === 'new' && notebookNameTaken(newCourseName)) {
    status.textContent = NOTEBOOK_NAME_TAKEN_MESSAGE;
    newNotebookInput.focus();
    return;
  }
  if (destination === 'existing' && (!selected || !hasCourse(selected))) {
    status.textContent = '저장할 기존 단어장을 선택해 주세요.';
    return;
  }
  if (meaningMode === 'major' && !majorField) {
    status.textContent = '전공 의미를 고르면 전공명이나 학과명을 입력해 주세요. (예: 전기공학)';
    majorInput.focus();
    return;
  }
  if (!/[a-z\p{Script=Hangul}]/iu.test(term)) {
    status.textContent = '한국어 또는 영어 단어를 입력하세요.';
    termInput.focus();
    return;
  }
  const request = {id: crypto.randomUUID(), term, autoCourse: false, selected,
    ...(newCourseName ? {newCourseName} : {}), context, meaningMode, majorField, createdAt: Date.now()};
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
