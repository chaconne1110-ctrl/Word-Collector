// Word input page, in screen order:
//   1. 단어
//   2. 의미 기준: 일반 의미 (word only: the reference card is hidden), 전공 의미 with a
//      major/department name, or 전공 모름 (the field is found from the reference sentence)
//   3. 단어장 선택: an existing notebook or a new one (name typed here, created when
//      the word is saved)
//   4. 참고자료 (required for 전공 모름)
// The meaning and notebook choices are independent. It validates them and opens the separate
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
  const noNotebooks = $('#no-notebooks'); if (noNotebooks) noNotebooks.hidden = notebookEntries.length !== 0;
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
  setMeaningMode(['major', 'context'].includes(saved.meaningMode) ? saved.meaningMode : 'general');
  majorInput.value = saved.majorField || '';
  if (saved.newCourseName) {
    setDestinationMode('new');
    newNotebookInput.value = saved.newCourseName;
  } else if (saved.selected && hasCourse(saved.selected)) {
    setDestinationMode('existing');
    courseInput.value = saved.selected;
  }
}

// ---- PDF·사진에서 고른 단어 (scan.html) ------------------------------------------------
// The scan page leaves the picked words and their sentences here. While there are
// picked words they replace card 1 (단어 입력); 의미 기준 and 단어장 work as usual, and
// each word is analysed with its own sentence as the reference sentence.
const SCAN_SELECTION_KEY = 'word-collector-scan-selection-v1';
const CAPTURE_QUEUE_KEY = 'word-collector-capture-queue-v1';
function readScanSelection() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SCAN_SELECTION_KEY) || 'null');
    if (!saved || typeof saved.id !== 'string' || !Array.isArray(saved.words)) return null;
    const words = saved.words.filter(word => word && typeof word.term === 'string' && word.term.trim())
      .map(word => ({term: word.term.trim().slice(0, 120), sentence: String(word.sentence ?? '').trim().slice(0, 600)}));
    return words.length ? {...saved, words} : null;
  } catch {
    return null;
  }
}
let scanSelection = null;
function showScanSelection() {
  const previous = scanSelection?.id;
  scanSelection = readScanSelection();
  const on = Boolean(scanSelection);
  $('#scan-selection-card').hidden = !on;
  $('#term-card').hidden = on;
  $('#scan-entry').hidden = on;
  $('#scan-reference-note').hidden = !on;
  $('#ref-section-sentence').hidden = on;
  for (const link of [$('#scan-entry'), $('#scan-selection-again')]) link.href = 'scan.html' + location.search;
  $('#submit-btn-text').textContent = on ? `고른 단어 ${scanSelection.words.length}개 분석하기` : '단어 분석하기';
  if (!on) return;
  $('#scan-selection-count').textContent = scanSelection.words.length + '개';
  $('#scan-selection-list').replaceChildren(...scanSelection.words.map(word => {
    const item = document.createElement('li');
    item.className = 'rounded-lg p-3 bg-surface-container-low';
    item.style.minWidth = '0';
    const term = document.createElement('p');
    term.className = 'font-semibold';
    term.style.cssText = 'margin:0;overflow-wrap:anywhere';
    term.textContent = word.term;
    const sentence = document.createElement('p');
    sentence.className = 'font-caption text-caption text-on-surface-variant';
    sentence.style.cssText = 'margin:2px 0 0;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden';
    sentence.textContent = word.sentence;
    item.append(term, sentence);
    return item;
  }));
  // A new pick starts with 전공 모름: the sentence shows which major the word is used in.
  if (scanSelection.id !== previous && !scanSelection.meaningChosen) setMeaningMode('context');
}
$('#scan-selection-clear').addEventListener('click', () => {
  try { sessionStorage.removeItem(SCAN_SELECTION_KEY); } catch {}
  showScanSelection();
  termInput.focus();
});
// Remember that the user changed 의미 기준 for this pick (so coming back keeps it).
for (const mode of MEANING_MODES) {
  document.getElementById('btn-meaning-' + mode).addEventListener('click', () => {
    if (!scanSelection) return;
    scanSelection.meaningChosen = true;
    try { sessionStorage.setItem(SCAN_SELECTION_KEY, JSON.stringify(scanSelection)); } catch {}
  });
}

refreshNotebookChoices();
restoreInputs();
showScanSelection();
autoGrowAll();
window.addEventListener('pageshow', () => {
  refreshNotebookChoices();
  showScanSelection();
  analysisButton.disabled = false;
});

// Several picked words: one request per word, analysed and reviewed one after another
// (review.html moves to the next word after each save or skip).
function startScanQueue({meaningMode, majorField, selected, newCourseName}) {
  const queueId = crypto.randomUUID();
  const total = scanSelection.words.length;
  const requests = scanSelection.words.map((word, index) => ({
    id: crypto.randomUUID(), term: word.term, autoCourse: false, selected,
    ...(newCourseName ? {newCourseName} : {}),
    // 일반 의미 analyses the word only, as on the normal input page.
    context: meaningMode === 'general' ? '' : word.sentence,
    meaningMode, majorField, createdAt: Date.now(),
    batch: {id: queueId, index: index + 1, total}
  }));
  try {
    sessionStorage.setItem(CAPTURE_QUEUE_KEY, JSON.stringify({id: queueId, total, saved: 0, items: requests.slice(1)}));
    sessionStorage.setItem(CAPTURE_REQUEST_KEY, JSON.stringify(requests[0]));
  } catch {
    status.textContent = '브라우저 저장소를 사용할 수 없어 분석 페이지로 이동하지 못했습니다.';
    return;
  }
  analysisButton.disabled = true;
  status.textContent = '';
  location.href = 'review.html';
}

analysisButton.addEventListener('click', () => {
  refreshNotebookChoices();
  scanSelection = readScanSelection();
  const term = scanSelection ? scanSelection.words[0].term : termInput.value.trim();
  const meaningMode = currentMeaningMode();
  // 일반 의미 analyses the word only: the reference card is hidden and not sent.
  const context = meaningMode === 'general' ? '' : contextInput.value.trim();
  const majorField = meaningMode === 'major' ? majorInput.value.trim() : '';
  const destination = currentDestinationMode();
  const newCourseName = destination === 'new' ? newNotebookInput.value.trim() : '';
  const selected = destination === 'existing' ? courseInput.value : '';
  // Checked in the order shown on the screen: 1. 단어 2. 의미 기준 3. 단어장 (4. 참고자료 is optional).
  if (!/[a-z\p{Script=Hangul}]/iu.test(term)) {
    status.textContent = '한국어 또는 영어 단어를 입력하세요.';
    termInput.focus();
    return;
  }
  if (meaningMode === 'major' && !majorField) {
    status.textContent = '전공 의미를 고르면 전공명이나 학과명을 입력해 주세요. (예: 전기공학)';
    majorInput.focus();
    return;
  }
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
  if (scanSelection) {
    startScanQueue({meaningMode, majorField, selected, newCourseName});
    return;
  }
  if (meaningMode === 'context' && !context) {
    status.textContent = '전공을 모를 때는 단어가 쓰인 참고 문장을 입력해 주세요.';
    contextInput.focus();
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
