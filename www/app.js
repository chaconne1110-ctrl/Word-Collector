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

const hasCourse = id => Object.hasOwn(seed.courses, id);
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
  for (const row of rows) rowLink(row, route('words.html', {course: row.dataset.subject}));
  function render() {
    let visible = 0;
    const q = input.value.trim().toLowerCase();
    for (const row of rows) {
      const id = row.dataset.subject;
      const ids = idsFor(false, id, 'all', '');
      const shown = seed.courses[id].some(name => name.toLowerCase().includes(q)) ||
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
  } else {
    $('header h1').textContent = seed.courses[course][0];
    $('header button[aria-label="뒤로 가기"]').addEventListener('click', () => location.href = 'index.html');
    const search = $('#searchContainer');
    $('#searchToggleBtn').addEventListener('click', () => {
      search.classList.toggle('hidden');
      if (!search.classList.contains('hidden')) input.focus();
    });
    $('header button[aria-label="필터"]').addEventListener('click', () => $('.filter-chip').focus());
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
      if (bookmark) chip.lastElementChild.textContent = count;
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
    $('#subjectBadgeKr').textContent = fromBookmark ? '북마크' : seed.courses[course][0];
    $('#subjectBadgeEn').textContent = term ? seed.courses[term.course][1] : '';
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
    bindFields(card, {...term, counter, backTitle: term.en + ' · 예문'});
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
    const bookmarkButtons = $$('[data-action="bookmark"]', card);
    bookmarkButtons.forEach(button => paintBookmark(button, current));
    card.addEventListener('click', event => {
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
      event.preventDefault();
      if (Math.abs(x) > Math.abs(y)) flipper.classList.toggle('is-flipped');
      else draw(y < 0 ? 1 : -1);
    });
    container.append(card);
  }
  prev.addEventListener('click', () => draw(-1));
  next.addEventListener('click', () => draw(1));
  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      draw(event.key === 'ArrowDown' ? 1 : -1);
    }
  });
  let lastWheel = -Infinity;
  container.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) < 10 || performance.now() - lastWheel < 350) return;
    lastWheel = performance.now();
    draw(event.deltaY > 0 ? 1 : -1);
  }, {passive: true});
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
  select.replaceChildren(...Object.entries(seed.courses).map(([id, names]) =>
    new Option(names.join(' · '), id)));
  for (const [id, key] of Object.entries(fields)) {
    const input = document.getElementById(id);
    input.value = term[key] ?? (key === 'discipline' ? '전자전기공학' : '');
  }
  $('#edit-course-label').textContent = seed.courses[term.course][0];
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
  $('#deleteModal').hidden = false;
  $('#deleteModal').classList.remove('hidden');
}
function closeDeleteModal() {
  $('#deleteModal').hidden = true;
  $('#deleteModal').classList.add('hidden');
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
