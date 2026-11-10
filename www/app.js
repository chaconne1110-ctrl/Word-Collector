const page = document.body.dataset.page;
const params = new URLSearchParams(location.search);
const storageKey = 'lexicon-word-collector-v1';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function load() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || structuredClone(seed);
  } catch {
    return structuredClone(seed);
  }
}

let state = load();
function commit(next) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
    state = next;
    return true;
  } catch {
    alert('변경 내용을 저장할 수 없습니다. 브라우저의 사이트 저장 설정을 확인해 주세요.');
    return false;
  }
}

const courseNames = id => state.courses?.[id] || seed.courses[id];
const allCourses = () => Object.fromEntries(Object.entries({...seed.courses, ...state.courses})
  .filter(([id]) => !(state.deletedCourses || []).includes(id)));
const hasCourse = id => Object.hasOwn(allCourses(), id);
const hasTerm = id => Object.hasOwn(state.terms, id);
const termId = params.get('term');
const course = hasCourse(params.get('course')) ? params.get('course') :
  hasTerm(termId) ? state.terms[termId].course : 'electromagnetics';
const fromBookmark = params.get('from') === 'bookmark';
const listFilter = params.get('filter') || 'all';
const query = params.get('q') || '';

function route(file, values = {}) {
  const search = new URLSearchParams(Object.entries(values).filter(([, value]) => value));
  return file + (search.size ? '?' + search : '');
}

function listUrl(bookmark, subject = course, filter = listFilter, q = query) {
  return bookmark ? route('bookmarks.html', {filter}) :
    route('words.html', {course: subject, filter, q});
}

function cardUrl(id, bookmark = fromBookmark, subject = course, filter = listFilter, q = query) {
  return route('flashcard.html', {term: id, from: bookmark ? 'bookmark' : 'words', course: subject, filter, q});
}

function matches(term, q) {
  return [term.en, term.ko, term.formula, term.koDef].some(value => value?.toLowerCase().includes(q.trim().toLowerCase()));
}

function idsFor(bookmark, subject, filter, q) {
  const ids = bookmark ? state.saved.filter(hasTerm) :
    Object.keys(state.terms).filter(id => state.terms[id].course === subject);
  return ids.filter(id => {
    const term = state.terms[id];
    if (bookmark) return !hasCourse(filter) || term.course === filter;
    if (!matches(term, q)) return false;
    if (filter === 'saved') return state.saved.includes(id);
    return !['high', 'medium'].includes(filter) || term.importance === filter;
  });
}

function bindFields(root, values) {
  $$('[data-field]', root).forEach(node => {
    node.textContent = values[node.dataset.field] || '—';
  });
}

function paintBookmark(button, id) {
  const saved = state.saved.includes(id);
  const icon = $('span.material-symbols-outlined', button);
  button.setAttribute('aria-pressed', String(saved));
  button.setAttribute('aria-label', saved ? '북마크 해제' : '북마크 등록');
  icon.textContent = 'bookmark';
  icon.style.fontVariationSettings = saved ? "'FILL' 1" : "'FILL' 0";
  if (page === 'card') button.replaceChildren(icon, document.createTextNode(saved ? '저장됨' : '저장'));
}

function toggleBookmark(id) {
  const saved = state.saved.includes(id) ? state.saved.filter(item => item !== id) : [id, ...state.saved];
  return commit({...state, saved});
}

function rowLink(row, url) {
  row.tabIndex = 0;
  row.setAttribute('role', 'link');
  row.addEventListener('click', event => {
    if (!event.target.closest('button, a')) location.href = url;
  });
  row.addEventListener('keydown', event => {
    if (event.target === row && event.key === 'Enter') location.href = url;
  });
}

function renderHome() {
  const input = $('#term-search-input');
  const clear = $('#clear-search-btn');
  const rows = $$('[data-subject]');
  function syncCourses() {
    for (const [id, names] of Object.entries(allCourses())) {
      if (rows.some(row => row.dataset.subject === id)) continue;
      const row = rows[0].cloneNode(true);
      row.id = 'card-' + id;
      row.dataset.subject = id;
      $('h2', row).textContent = names[0];
      const subtitle = $('h2', row).parentElement.nextElementSibling;
      if (subtitle) subtitle.textContent = '직접 만든 단어장';
      $('h2', row).nextElementSibling.textContent = names[1] || '';
      $('.material-symbols-outlined', row).textContent = 'menu_book';
      rows[0].parentElement.append(row);
      rows.push(row);
      rowLink(row, route('words.html', {course: id}));
    }
  }
  for (const row of rows) rowLink(row, route('words.html', {course: row.dataset.subject}));
  function render() {
    syncCourses();
    let visible = 0;
    const q = input.value.trim().toLowerCase();
    for (const row of rows) {
      const id = row.dataset.subject;
      if (!hasCourse(id)) { row.hidden = true; continue; }
      $('h2', row).textContent = courseNames(id)[0];
      const ids = idsFor(false, id, 'all', '');
      const shown = courseNames(id).some(name => name.toLowerCase().includes(q)) ||
        ids.some(term => matches(state.terms[term], q));
      row.hidden = !shown;
      visible += Number(shown);
      $$('span', row).forEach(span => {
        if (/^\d+개 단어 저장됨$/.test(span.textContent.trim())) span.textContent = ids.length + '개 단어 저장됨';
        if (/^북마크 \d+개$/.test(span.textContent.trim())) span.textContent = '북마크 ' + ids.filter(id => state.saved.includes(id)).length + '개';
      });
    }
    $('#rendered-count').textContent = '총 ' + visible + '개 과목 등록됨';
    $('#empty-state').classList.toggle('hidden', visible > 0);
    clear.classList.toggle('hidden', !input.value);
  }
  input.addEventListener('input', render);
  function reset() { input.value = ''; render(); }
  clear.addEventListener('click', reset);
  $('#empty-state button').addEventListener('click', reset);
  window.addEventListener('pageshow', () => { state = load(); render(); });
}

function renderList() {
  const bookmark = page === 'bookmarks';
  const container = $('#term-list');
  const template = $('#term-row');
  const input = $('#searchContainer input');
  let filter = listFilter;
  if (bookmark) {
    const filters = $('#bookmark-filters');
    for (const chip of $$('[data-filter]', filters)) {
      if (chip.dataset.filter === 'circuit') chip.dataset.filter = 'circuit-theory';
      if (chip.dataset.filter === 'electromag') chip.dataset.filter = 'electromagnetics';
      if (chip.dataset.filter === 'machines') chip.dataset.filter = 'electrical-machines';
    }
    const semiconductor = filters.lastElementChild.cloneNode(true);
    semiconductor.dataset.filter = 'semiconductor';
    semiconductor.firstElementChild.textContent = '반도체공학';
    filters.append(semiconductor);
    for (const id of Object.keys(allCourses())) {
      if ($$('[data-filter]', filters).some(chip => chip.dataset.filter === id)) continue;
      const chip = semiconductor.cloneNode(true);
      chip.dataset.filter = id;
      chip.firstElementChild.textContent = courseNames(id)[0];
      filters.append(chip);
    }
  } else {
    $('header h1').textContent = courseNames(course)[0];
    $('header button[aria-label="뒤로 가기"]').addEventListener('click', () => location.href = 'index.html');
    const search = $('#searchContainer');
    $('#searchToggleBtn').addEventListener('click', () => {
      search.classList.toggle('hidden');
      if (!search.classList.contains('hidden')) input.focus();
    });
    const deleteDialog = $('#delete-notebook-dialog');
    function openNotebookDelete() {
      const count = Object.values(state.terms).filter(term => term.course === course).length;
      $('#delete-notebook-description').textContent = '“' + courseNames(course)[0] + '” 단어장과 저장된 단어 ' + count + '개, 해당 북마크를 삭제합니다. 이 작업은 되돌릴 수 없습니다.';
      deleteDialog.showModal();
    }
    $('#delete-notebook').addEventListener('click', openNotebookDelete);
    $('#cancel-notebook-delete').addEventListener('click', () => deleteDialog.close());
    $('#confirm-notebook-delete').addEventListener('click', () => {
      state = load();
      const courses = {...allCourses()};
      delete courses[course];
      const terms = Object.fromEntries(Object.entries(state.terms).filter(([, term]) => term.course !== course));
      const saved = state.saved.filter(id => Object.hasOwn(terms, id));
      if (commit({...state, courses, terms, saved, deletedCourses: [...new Set([...(state.deletedCourses || []), course])]})) location.replace('index.html');
    });
    const renameDialog = $('#rename-notebook-dialog');
    const nameInput = $('#notebook-name');
    $('#notebook-settings').addEventListener('click', () => {
      nameInput.value = courseNames(course)[0];
      renameDialog.showModal();
      nameInput.focus();
      nameInput.select();
    });
    $('#cancel-notebook-rename').addEventListener('click', () => renameDialog.close());
    $('#rename-notebook-form').addEventListener('submit', event => {
      event.preventDefault();
      const name = nameInput.value.trim();
      nameInput.setCustomValidity(name ? '' : '단어장 이름을 입력해 주세요.');
      if (!nameInput.reportValidity()) return;
      const names = [name, courseNames(course)[1]];
      if (!commit({...state, courses: {...allCourses(), [course]: names}})) return;
      $('header h1').textContent = name;
      renameDialog.close();
    });
    nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
    input.value = query;
    if (query) search.classList.remove('hidden');
    input.addEventListener('input', draw);
  }
  const chips = $$('.filter-chip');
  for (const chip of chips) chip.addEventListener('click', () => { filter = chip.dataset.filter; draw(); });
  function draw() {
    const q = input?.value || '';
    history.replaceState(null, '', listUrl(bookmark, course, filter, q));
    const ids = idsFor(bookmark, course, filter, q);
    container.replaceChildren();
    if (!ids.length) {
      const message = document.createElement('p');
      message.className = 'p-4 text-sm text-center text-on-surface-variant';
      message.textContent = bookmark ? '표시할 북마크 단어가 없습니다.' : '표시할 단어가 없습니다.';
      container.append(message);
    }
    for (const id of ids) {
      const row = template.content.firstElementChild.cloneNode(true);
      row.dataset.termId = id;
      bindFields(row, state.terms[id]);
      rowLink(row, cardUrl(id, bookmark, course, filter, q));
      const button = $('[data-action="bookmark"]', row);
      paintBookmark(button, id);
      button.addEventListener('click', () => { if (toggleBookmark(id)) draw(); });
      container.append(row);
    }
    if (bookmark) $('#rendered-count').textContent = '총 ' + ids.length + '개 단어 보관 중';
    for (const chip of chips) {
      const active = chip.dataset.filter === filter;
      chip.setAttribute('aria-pressed', String(active));
      for (const name of ['bg-primary', 'bg-primary-container', 'text-on-primary', 'bg-surface-container', 'bg-surface-container-low', 'text-on-surface-variant', 'active']) {
        chip.classList.remove(name);
      }
      chip.classList.add(...(active ? ['bg-primary', 'text-on-primary'] : ['bg-surface-container-low', 'text-on-surface-variant']));
      const count = idsFor(bookmark, course, chip.dataset.filter, q).length;
      if (bookmark) {
        if (hasCourse(chip.dataset.filter)) chip.firstElementChild.textContent = courseNames(chip.dataset.filter)[0];
        chip.lastElementChild.textContent = count;
      }
      else chip.textContent = ({all: '전체', high: '★ 중요도: 상', medium: '★ 중요도: 중', saved: '북마크'})[chip.dataset.filter] + ' (' + count + ')';
    }
  }
  window.addEventListener('pageshow', () => { state = load(); draw(); });
}

function renderDeck() {
  const container = $('#cardsScrollContainer');
  const back = $('#backNavigationBtn');
  const prev = $('button[aria-label="이전 단어"]');
  const next = $('button[aria-label="다음 단어"]');
  let current = termId;
  back.addEventListener('click', () => location.href = listUrl(fromBookmark));

  function draw(direction = 0) {
    const ids = idsFor(fromBookmark, course, listFilter, query);
    const index = ids.indexOf(current);
    const target = index < 0 ? (direction < 0 ? ids.at(-1) : ids[0]) : ids[index + direction];
    if (direction && !target) return;
    current = target;
    const term = state.terms[current];
    const position = ids.indexOf(current);
    const counter = [position + 1, ids.length].map(n => String(n).padStart(2, '0')).join(' / ');
    $('#topActiveCounter').textContent = counter;
    $('#subjectBadgeKr').textContent = fromBookmark ? '북마크' : courseNames(course)[0];
    $('#subjectBadgeEn').textContent = term ? courseNames(term.course)[1] : '';
    prev.disabled = position <= 0;
    next.disabled = position < 0 || position >= ids.length - 1;
    const dots = $('#verticalIndicators');
    if (dots) dots.hidden = true;
    container.replaceChildren();
    if (!term) {
      container.textContent = '표시할 플래시카드가 없습니다.';
      return;
    }
    history.replaceState(null, '', cardUrl(current));
    const template = $$( 'template[data-card-template]').find(t => t.dataset.cardTemplate === current) ||
      $('template[data-card-template="generic"]');
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.termId = current;
    const flipper = $('.card-flipper', card);
    const referenceSentence = typeof term.referenceSentence === 'string' ? term.referenceSentence.trim() : '';
    bindFields(card, {...term, exampleEn: referenceSentence || term.exampleEn,
      counter, backTitle: term.en + (referenceSentence ? ' · 참고 문장' : ' · 예문')});
    if (referenceSentence) {
      const sentence = $('[data-field="exampleEn"]', card);
      sentence.style.whiteSpace = 'pre-wrap';
      const translation = $('[data-field="exampleKo"]', card);
      if (translation) translation.parentElement.hidden = true;
      const section = sentence.parentElement;
      const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        walker.currentNode.textContent = walker.currentNode.textContent
          .replace('AI 생성 예문', '사용자 참고 문장').replace('Contextual', '직접 입력');
      }
    }
    const savedImage = term.diagram ? diagramImage(term.diagram) : null;
    if (savedImage) {
      const imageSection = document.createElement('div');
      imageSection.className = 'p-2 rounded-lg bg-surface-container-low';
      imageSection.append(savedImage);
      $('.card-back', card).firstElementChild.append(imageSection);
    } else if (current === 'term_resonance_frequency') $('.card-back', card).append($('#resonance-diagram').content.cloneNode(true));
    else if (template.dataset.cardTemplate === 'generic') {
      const notice = document.createElement('p');
      notice.textContent = '첨부된 도해가 없습니다.';
      $('.card-back', card).append(notice);
    }
    // Generated photos are explicitly requested, billed once per tap and retained offline.
    // Existing hand-built SVG diagrams remain available independently of this feature.
    const photoTermId = current;
    const photoPanel = document.createElement('section');
    photoPanel.className = 'rounded-xl border border-surface-container-high bg-surface-container-lowest p-3 space-y-2';
    const photoHeading = document.createElement('p');
    photoHeading.className = 'font-label-ui text-[12px] font-bold text-primary';
    photoHeading.textContent = 'AI 생성 학습 사진';
    const photoImage = document.createElement('img');
    photoImage.alt = term.en + '의 AI 생성 학습 사진';
    photoImage.className = 'w-full max-h-64 rounded-lg object-contain bg-surface-container-low';
    photoImage.hidden = true;
    const photoStatus = document.createElement('p');
    photoStatus.className = 'text-[11px] text-on-surface-variant';
    photoStatus.setAttribute('role', 'status');
    photoStatus.textContent = '사진을 만들면 기기에 저장되고, 다음에는 인터넷 없이 표시됩니다.';
    const photoButton = document.createElement('button');
    photoButton.type = 'button';
    photoButton.dataset.action = 'generate-photo';
    photoButton.className = 'rounded-lg bg-primary text-on-primary px-3 py-2 text-xs font-bold';
    photoButton.textContent = 'AI 사진 생성 (유료 · 1회)';
    photoPanel.append(photoHeading, photoImage, photoStatus, photoButton);
    $('.card-back', card).firstElementChild.append(photoPanel);
    let hasPhoto = false;
    let busyPhoto = false;
    async function refreshPhoto() {
      const blob = await WordCollectorPhoto.get(photoTermId);
      if (!blob || !card.isConnected) return;
      const url = URL.createObjectURL(blob);
      photoImage.onload = () => URL.revokeObjectURL(url);
      photoImage.onerror = () => URL.revokeObjectURL(url);
      photoImage.src = url;
      photoImage.hidden = false;
      hasPhoto = true;
      photoButton.textContent = '사진 다시 생성 (추가 과금)';
      photoStatus.textContent = '기기에 저장된 JPG 사진입니다. 새로 생성하면 기존 사진을 교체합니다.';
    }
    photoButton.addEventListener('click', async () => {
      if (busyPhoto) return;
      if (hasPhoto && !confirm('사진을 다시 생성하면 새로운 API 요금이 발생하고 기존 사진이 교체됩니다. 진행할까요?')) return;
      if (!hasPhoto && !confirm('사진 생성은 별도의 유료 Gemini API를 1회 호출합니다. 기기에 저장할 사진을 생성할까요?')) return;
      busyPhoto = true;
      photoButton.disabled = true;
      photoStatus.textContent = 'AI가 사진을 제작 중입니다. 약간의 시간이 걸릴 수 있습니다.';
      try {
        const result = await WordCollectorAI.createImage({
          word:term.en, koreanMeaning:term.ko,
          subject:courseNames(term.course)[0],
          definition:(term.koDef || term.enDef || term.ko).slice(0, 700)
        });
        await WordCollectorPhoto.save(photoTermId, result.image);
        await refreshPhoto();
        photoStatus.textContent = 'AI 사진 제작과 기기 저장이 완료됐습니다.';
      } catch (error) {
        photoStatus.textContent = error?.message || 'AI 사진을 생성하지 못했습니다.';
      } finally {
        photoButton.disabled = false;
        busyPhoto = false;
      }
    });
    const bookmarkButtons = $$('[data-action="bookmark"]', card);
    bookmarkButtons.forEach(button => paintBookmark(button, current));
    let suppressTapUntil = 0;
    card.addEventListener('click', event => {
      if (Date.now() < suppressTapUntil) return;
      const button = event.target.closest('button');
      if (!button || button.dataset.action === 'flip') flipper.classList.toggle('is-flipped');
      else if (button.dataset.action === 'edit') location.href = cardUrl(current).replace('flashcard.html', 'edit.html');
      else if (button.dataset.action === 'bookmark' && toggleBookmark(current)) {
        if (fromBookmark || listFilter === 'saved') draw();
        else bookmarkButtons.forEach(button => paintBookmark(button, current));
      }
    });
    let start;
    card.addEventListener('touchstart', event => {
      start = event.target.closest('button') ? null : event.changedTouches[0];
    }, {passive: true});
    card.addEventListener('touchend', event => {
      if (!start) return;
      const end = event.changedTouches[0];
      const x = end.clientX - start.clientX;
      const y = end.clientY - start.clientY;
      start = null;
      if (Math.max(Math.abs(x), Math.abs(y)) < 40) return;
      suppressTapUntil = Date.now() + 400;
      if (Math.abs(x) > Math.abs(y)) {
        event.preventDefault();
        flipper.classList.toggle('is-flipped');
      }
    });
    container.append(card);
    container.scrollTop = 0;
    void refreshPhoto().catch(error => {
      photoStatus.textContent = error?.message || '저장된 사진을 읽지 못했습니다.';
    });
  }
  prev.addEventListener('click', () => draw(-1));
  next.addEventListener('click', () => draw(1));
  // Leave wheel and vertical arrow input to the card's native scroll area.
  window.addEventListener('pageshow', () => { state = load(); draw(); });
}

const fields = {
  disciplineInput: 'discipline',
  subjectSelect: 'course',
  englishTermInput: 'en',
  koreanTermInput: 'ko',
  englishDefArea: 'enDef',
  koreanDefArea: 'koDef',
  exampleSentenceEn: 'exampleEn',
  exampleSentenceKo: 'exampleKo'
};

function renderEditor() {
  if (!hasTerm(termId)) {
    location.replace(listUrl(fromBookmark));
    return;
  }
  const term = state.terms[termId];
  const select = $('#subjectSelect');
  select.replaceChildren(...Object.entries(allCourses()).map(([id, names]) =>
    new Option(courseNames(id).join(' · '), id)));
  for (const [id, key] of Object.entries(fields)) {
    const input = document.getElementById(id);
    input.value = term[key] ?? (key === 'discipline' ? '전자전기공학' : '');
  }
  $('#edit-course-label').textContent = courseNames(term.course)[0];
  $('header button[aria-label^="수정 취소"]').onclick = openFlashcardDirect;
  const diagramButton = $('[onclick="regenerateAiDiagram()"]');
  diagramButton.removeAttribute('onclick');
  diagramButton.title = '이 화면에는 AI 생성 기능이 연결되어 있지 않습니다.';
  if (termId !== 'term_resonance_frequency') diagramButton.parentElement.nextElementSibling.hidden = true;
}

function openFlashcardDirect() {
  location.replace(cardUrl(termId));
}

function saveTermChanges() {
  const updated = {...state.terms[termId]};
  for (const [id, key] of Object.entries(fields)) updated[key] = document.getElementById(id).value.trim();
  if (!updated.en || !updated.ko) {
    alert('영어 표제어와 한국어 뜻을 입력해 주세요.');
    return;
  }
  const moved = updated.course !== state.terms[termId].course;
  if (commit({...state, terms: {...state.terms, [termId]: updated}})) {
    const filter = fromBookmark && hasCourse(listFilter) && listFilter !== updated.course ? 'all' : listFilter;
    location.replace(cardUrl(termId, fromBookmark, updated.course, filter, moved || !fromBookmark ? '' : query));
  }
}

function openDeleteModal() {
  const modal = $('#deleteModal');
  $('p', modal).textContent = '“' + state.terms[termId].en + '” 단어와 해당 북마크를 삭제합니다. 이 작업은 되돌릴 수 없습니다.';
  modal.showModal();
}
function closeDeleteModal() {
  $('#deleteModal').close();
}
function confirmDelete() {
  const terms = {...state.terms};
  delete terms[termId];
  if (commit({...state, terms, saved: state.saved.filter(id => id !== termId)})) {
    location.replace(listUrl(fromBookmark));
  }
}
function playAudioPronunciation() {
  if (!('speechSynthesis' in window)) return;
  const speech = new SpeechSynthesisUtterance($('#englishTermInput').value);
  speech.lang = 'en-US';
  speechSynthesis.speak(speech);
}

if (page === 'home') renderHome();
if (page === 'words' || page === 'bookmarks') renderList();
if (page === 'card') renderDeck();
if (page === 'edit') renderEditor();
