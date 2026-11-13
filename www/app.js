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

// A user's reference sentence is translated into the other language: mostly
// Korean -> English translation, otherwise -> Korean translation. One Hangul
// syllable is weighted as two Latin letters (same rule as the Worker).
function referenceTranslationLanguage(text) {
  const value = String(text || '');
  const hangul = (value.match(/\p{Script=Hangul}/gu) || []).length;
  const latin = (value.match(/[A-Za-z]/g) || []).length;
  return hangul * 2 > latin ? 'en' : 'ko';
}
const referenceTranslationLabel = text =>
  referenceTranslationLanguage(text) === 'en' ? '영어 번역' : '한국어 번역';

const courseNames = id => state.courses?.[id] || [id || '단어장', ''];
const allCourses = () => Object.fromEntries(Object.entries(state.courses || {})
  .filter(([id]) => !(state.deletedCourses || []).includes(id)));
const hasCourse = id => Object.hasOwn(allCourses(), id);
const hasTerm = id => Object.hasOwn(state.terms, id);
const termId = params.get('term');
const course = hasCourse(params.get('course')) ? params.get('course') :
  hasTerm(termId) ? state.terms[termId].course : Object.keys(allCourses())[0] || '';
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
  return [term.en, term.ko, term.related, term.koDef].some(value => value?.toLowerCase().includes(q.trim().toLowerCase()));
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

// Related words (from the analysis) replace the old formula field everywhere.
// Only the English words are shown; any "word · 뜻" text keeps the word part.
function relatedEnglishWords(term) {
  return String(term?.related ?? '').split(/\n+/)
    .map(line => line.split(' · ')[0].trim()).filter(Boolean).slice(0, 2);
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
  const container = $('#word-list');
  const empty = $('#empty-state');
  const dialog = $('#create-notebook-dialog');
  const nameInput = $('#new-notebook-name');

  function openCreate() {
    nameInput.value = '';
    nameInput.setCustomValidity('');
    dialog.showModal();
    nameInput.focus();
  }
  $('#create-notebook').addEventListener('click', openCreate);
  $('#cancel-create-notebook').addEventListener('click', () => dialog.close());
  $('#create-notebook-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, ' ');
    nameInput.setCustomValidity(name && name.length <= 60 ? '' : '단어장 이름을 1~60자로 입력하세요.');
    if (!nameInput.reportValidity()) return;
    state = load();
    const exists = Object.values(allCourses()).some(names =>
      names[0].normalize('NFKC').toLocaleLowerCase() === name.normalize('NFKC').toLocaleLowerCase());
    if (exists) {
      nameInput.setCustomValidity('같은 이름의 단어장이 이미 있습니다.');
      nameInput.reportValidity();
      return;
    }
    const id = 'notebook_' + crypto.randomUUID();
    if (commit({...state, courses:{...state.courses, [id]:[name, '']}})) {
      dialog.close();
      location.href = route('words.html', {course:id});
    }
  });
  nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));

  function createCard(id, names) {
    const row = document.createElement('article');
    row.className = 'word-card relative rounded-xl bg-surface-container-lowest p-space-md shadow-sm transition-all cursor-pointer group hover:bg-surface-container-low/40 active:scale-[0.99]';
    row.dataset.subject = id;
    row.innerHTML =
      '<div class="flex items-start gap-space-sm">' +
      '<div class="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-[26px]">menu_book</span></div>' +
      '<div class="flex flex-col min-w-0"><h2 class="font-term-kr-title text-term-kr-title text-on-surface font-bold truncate"></h2>' +
      '<p class="font-caption text-caption text-on-surface-variant mt-0.5 truncate"></p></div></div>' +
      '<div class="mt-space-md pt-2.5 flex items-center justify-between bg-surface-container-low/60 -mx-space-md -mb-space-md px-space-md py-2.5 rounded-b-xl gap-2 flex-wrap">' +
      '<span data-word-count class="font-label-ui text-caption font-semibold text-primary-container"></span>' +
      '<span data-bookmark-count class="font-label-ui text-caption text-on-surface-variant"></span></div>';
    $('h2', row).textContent = names[0];
    $('p', row).textContent = names[1] || '내가 만든 단어장';
    const ids = idsFor(false, id, 'all', '');
    $('[data-word-count]', row).textContent = ids.length + '개 단어 저장됨';
    $('[data-bookmark-count]', row).textContent =
      '북마크 ' + ids.filter(termId => state.saved.includes(termId)).length + '개';
    rowLink(row, route('words.html', {course:id}));
    return row;
  }

  function render() {
    state = load();
    const courses = Object.entries(allCourses());
    const q = input.value.trim().toLowerCase();
    const visible = courses.filter(([id, names]) =>
      names.some(name => name.toLowerCase().includes(q)) ||
      idsFor(false, id, 'all', '').some(termId => matches(state.terms[termId], q)));
    container.replaceChildren(...visible.map(([id, names]) => createCard(id, names)));
    $('#rendered-count').textContent = q ? '검색 결과 ' + visible.length + '개 단어장' :
      '총 ' + courses.length + '개 단어장 등록됨';
    empty.classList.toggle('hidden', visible.length > 0);
    if (!visible.length) {
      $('#empty-state-title').textContent = courses.length && q ? '검색 결과가 없습니다' : '아직 단어장이 없습니다';
      $('#empty-state-description').textContent = courses.length && q ?
        '검색어를 변경하거나 전체 단어장을 확인해 주세요.' :
        '새 단어장을 만든 뒤 원하는 전공 단어를 추가할 수 있습니다.';
      $('#empty-state-action').textContent = courses.length && q ? '검색어 초기화' : '새 단어장 만들기';
    }
    clear.classList.toggle('hidden', !input.value);
  }
  $('#empty-state-action').addEventListener('click', () => {
    if (input.value.trim() && Object.keys(allCourses()).length) {
      input.value = '';
      render();
    } else openCreate();
  });
  input.addEventListener('input', render);
  clear.addEventListener('click', () => { input.value = ''; render(); });
  window.addEventListener('pageshow', render);
  render();
}

function renderList() {
  const bookmark = page === 'bookmarks';
  const container = $('#term-list');
  const template = $('#term-row');
  const input = $('#searchContainer input');
  let filter = listFilter;
  if (bookmark) {
    const filters = $('#bookmark-filters');
    const allChip = filters.querySelector('[data-filter="all"]');
    filters.replaceChildren(allChip);
    for (const [id, names] of Object.entries(allCourses())) {
      const chip = allChip.cloneNode(true);
      chip.dataset.filter = id;
      chip.firstElementChild.textContent = names[0];
      filters.append(chip);
    }
  } else {
    if (!hasCourse(course)) { location.replace('index.html'); return; }
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
      bindFields(row, {...state.terms[id], related: relatedEnglishWords(state.terms[id]).join(', ')});
      $$('[data-field="related"]', row).forEach(chip => {
        chip.hidden = !relatedEnglishWords(state.terms[id]).length;
      });
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
  let current = termId;
  let cancelActivePhoto = () => {};
  let moving = false;
  let motionEpoch = 0;
  const animations = new Set();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function stopMotion() {
    motionEpoch++;
    for (const animation of animations) animation.cancel();
    animations.clear();
    moving = false;
    container.removeAttribute('aria-busy');
  }
  window.addEventListener('pagehide', () => { cancelActivePhoto(); stopMotion(); });
  async function animateCard(element, frames, duration) {
    if (!element?.animate) return;
    const animation = element.animate(frames, {duration, easing:'cubic-bezier(.22,.61,.36,1)', fill:'forwards'});
    animations.add(animation);
    try { await animation.finished; } catch { /* Page navigation cancels motion. */ }
    finally { animation.cancel(); animations.delete(animation); }
  }
  async function transition(change, kind, direction = 1) {
    if (moving) return;
    if (reducedMotion.matches || !container.firstElementChild?.animate) { change(); return; }
    moving = true;
    container.setAttribute('aria-busy', 'true');
    const epoch = motionEpoch;
    const rest = 'perspective(1100px) translateY(0) rotateX(0deg) rotateY(0deg) scale(1)';
    const outgoing = kind === 'flip'
      ? `perspective(1100px) rotateY(${direction * 90}deg)`
      : `perspective(1100px) translateY(${-direction * 12}%) rotateX(${direction * 14}deg) scale(.94)`;
    const incoming = kind === 'flip'
      ? `perspective(1100px) rotateY(${-direction * 90}deg)`
      : `perspective(1100px) translateY(${direction * 12}%) rotateX(${-direction * 14}deg) scale(.94)`;
    try {
      await animateCard($('.card-flipper', container), [{transform:rest,opacity:1}, {transform:outgoing,opacity:kind === 'flip' ? 1 : 0}], 140);
      if (epoch !== motionEpoch) return;
      // Switch content edge-on, retaining one visible, independently scrollable face.
      change();
      await animateCard($('.card-flipper', container), [{transform:incoming,opacity:kind === 'flip' ? 1 : 0}, {transform:rest,opacity:1}], 200);
    } finally {
      if (epoch === motionEpoch) { moving = false; container.removeAttribute('aria-busy'); }
    }
  }
  function navigate(direction) {
    const ids = idsFor(fromBookmark, course, listFilter, query);
    if (!ids[ids.indexOf(current) + direction]) return;
    void transition(() => draw(direction), 'word', direction);
  }
  function flip(flipper) {
    void transition(() => flipper.classList.toggle('is-flipped'), 'flip', flipper.classList.contains('is-flipped') ? -1 : 1);
  }
  let wheelGesture;
  const atEdge = (face, direction) => direction < 0 ? face.scrollTop <= 1 :
    face.scrollTop + face.clientHeight >= face.scrollHeight - 1;
  back.addEventListener('click', () => location.href = listUrl(fromBookmark));

  function draw(direction = 0) {
    cancelActivePhoto();
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
    // New words: the example/translation were built from the reference sentence
    // (English sentence + Korean sentence), so show them as stored. Older words
    // kept a generated example and showed the reference + its translation instead.
    const exampleFromReference = term.exampleSource === 'reference';
    const legacyReference = referenceSentence && !exampleFromReference;
    bindFields(card, {...term, exampleEn: legacyReference ? referenceSentence : term.exampleEn,
      exampleKo: legacyReference ? (term.referenceTranslation || '참고 문장 해석이 없습니다. 단어를 다시 분석해 주세요.') : term.exampleKo,
      counter, backTitle: term.en + (referenceSentence ? ' · 참고 문장' : ' · 예문'),
      related: relatedEnglishWords(term).join('\n')});
    // "관련 단어" (two related words from the analysis) replaces the old formula box.
    $$('[data-field="related"]', card).forEach(node => {
      const box = node.parentElement;
      const related = relatedEnglishWords(term).join('\n');
      box.hidden = !related;
      box.style.alignItems = 'flex-start';
      box.style.gap = '10px';
      node.style.whiteSpace = 'pre-line';
      node.style.textAlign = 'right';
      node.style.overflowWrap = 'anywhere';
      node.style.minWidth = '0';
    });
    if (referenceSentence) {
      const sentence = $('[data-field="exampleEn"]', card);
      sentence.style.whiteSpace = 'pre-wrap';
      sentence.style.overflowWrap = 'anywhere';
      const translation = $('[data-field="exampleKo"]', card);
      if (translation) {
        translation.parentElement.hidden = false;
        translation.style.whiteSpace = 'pre-wrap';
        translation.style.overflowWrap = 'anywhere';
      }
      const section = sentence.parentElement;
      const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (sentence.contains(walker.currentNode) || translation?.contains(walker.currentNode)) continue;
        walker.currentNode.textContent = walker.currentNode.textContent
          .replace('AI 생성 예문', '사용자 참고 문장').replace('Contextual', '직접 입력')
          .replace('국문 번역', exampleFromReference ? '국문 번역' : referenceTranslationLabel(referenceSentence));
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
    photoImage.alt = (term.en || term.ko) + '의 AI 생성 학습 사진';
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
    const photoGate = WordCollectorRequestGate.create();
    cancelActivePhoto = () => photoGate.cancel();
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
      photoStatus.textContent = '기기에 저장된 JPG 사진입니다. 새로 생성하면 인터넷 없이 표시됩니다.';
    }
    photoButton.addEventListener('click', async () => {
      const remaining = photoGate.remainingMs();
      if (remaining > 0) {
        photoStatus.textContent = '3초 이내 중복 사진 생성 요청을 차단했습니다. ' +
          Math.ceil(remaining / 1000) + '초 후에도 미완료면 다시 요청할 수 있습니다.';
        return;
      }
      if (busyPhoto) {
        if (!confirm('이전 사진 생성이 아직 처리 중입니다. 재요청 시 추가 요금이 발생할 수 있습니다. 재요청할까요?')) return;
      } else if (hasPhoto) {
        if (!confirm('사진을 다시 생성하면 새로운 API 요금이 발생하고 기존 사진이 교체됩니다. 진행할까요?')) return;
      } else if (!confirm('사진 생성은 별도 유료 Gemini API를 1회 호출합니다. 기기에 저장할 사진을 생성할까요?')) {
        return;
      }
      const ticket = photoGate.begin();
      if (!ticket.allowed) return;
      busyPhoto = true;
      photoButton.textContent = '생성 중 · 3초 후 재요청 가능';
      photoStatus.textContent = ticket.replaced ?
        '이전 브라우저 요청을 중단하고 다시 요청했습니다. 서버에서 이미 처리된 호출은 과금될 수 있습니다.' :
        'AI 사진을 생성 중입니다. 처음 3초간 중복 클릭은 차단됩니다.';
      try {
        const result = await WordCollectorAI.createImage({
          word:term.en || term.ko, koreanMeaning:term.ko,
          subject:courseNames(term.course)[0],
          definition:(term.koDef || term.enDef || term.ko || term.en).slice(0, 700)
        }, {signal:ticket.signal});
        if (!photoGate.isCurrent(ticket.id) || !card.isConnected) return;
        await WordCollectorPhoto.save(photoTermId, result.image);
        if (!photoGate.isCurrent(ticket.id) || !card.isConnected) return;
        await refreshPhoto();
        photoStatus.textContent = 'AI 사진 제작과 기기 저장이 완료됐습니다.';
      } catch (error) {
        if (!photoGate.isCurrent(ticket.id)) return;
        photoStatus.textContent = error?.message || 'AI 사진을 생성하지 못했습니다.';
      } finally {
        if (photoGate.finish(ticket.id)) {
          busyPhoto = false;
          photoButton.textContent = hasPhoto ? '사진 다시 생성 (추가 과금)' : 'AI 사진 생성 (유료 · 1회)';
        }
      }
    });
    const bookmarkButtons = $$('[data-action="bookmark"]', card);
    bookmarkButtons.forEach(button => paintBookmark(button, current));
    let suppressTapUntil = 0;
    card.addEventListener('click', event => {
      if (moving || Date.now() < suppressTapUntil) return;
      const button = event.target.closest('button');
      if (!button || button.dataset.action === 'flip') flip(flipper);
      else if (button.dataset.action === 'edit') location.href = cardUrl(current).replace('flashcard.html', 'edit.html');
      else if (button.dataset.action === 'bookmark' && toggleBookmark(current)) {
        if (fromBookmark || listFilter === 'saved') draw();
        else bookmarkButtons.forEach(button => paintBookmark(button, current));
      }
    });
    let start;
    card.addEventListener('touchstart', event => {
      const face = event.target.closest('.card-front, .card-back');
      start = moving || event.touches.length !== 1 || event.target.closest('button') || !face ? null : {
        x: event.touches[0].clientX, y: event.touches[0].clientY,
        atTop: atEdge(face, -1), atBottom: atEdge(face, 1)
      };
    }, {passive: true});
    card.addEventListener('touchmove', event => {
      if (!start || event.touches.length !== 1) { start = null; return; }
      const x = event.touches[0].clientX - start.x;
      const y = event.touches[0].clientY - start.y;
      if (Math.max(Math.abs(x), Math.abs(y)) > 8) suppressTapUntil = Date.now() + 400;
      // Only capture a vertical swipe that began at the relevant content edge.
      // Other vertical gestures stay native so long definitions remain readable.
      if (Math.abs(y) > Math.abs(x) && (y < 0 ? start.atBottom : start.atTop)) {
        event.preventDefault();
      }
    }, {passive: false});
    card.addEventListener('touchcancel', () => {
      start = null;
      suppressTapUntil = Date.now() + 400;
    });
    card.addEventListener('touchend', event => {
      if (!start) return;
      const end = event.changedTouches[0];
      const x = end.clientX - start.x;
      const y = end.clientY - start.y;
      const edge = y < 0 ? start.atBottom : start.atTop;
      start = null;
      if (Math.max(Math.abs(x), Math.abs(y)) < 40) return;
      suppressTapUntil = Date.now() + 400;
      if (Math.abs(x) > Math.abs(y)) {
        event.preventDefault();
        flip(flipper);
      } else if (edge) {
        event.preventDefault();
        navigate(y < 0 ? 1 : -1);
      }
    }, {passive: false});
    container.append(card);
    container.scrollTop = 0;
    void refreshPhoto().catch(error => {
      photoStatus.textContent = error?.message || '저장된 사진을 읽지 못했습니다.';
    });
  }
  container.addEventListener('keydown', event => {
    if (event.target !== container) return;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' '].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') navigate(event.key === 'ArrowDown' ? 1 : -1);
      else { const flipper = $('.card-flipper', container); if (flipper) flip(flipper); }
    }
  });
  container.addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    if (moving) {
      if (wheelGesture) wheelGesture.lastAt = performance.now();
      event.preventDefault();
      return;
    }
    const face = event.target.closest('.card-front, .card-back');
    if (!face) return;
    const now = performance.now();
    const direction = Math.sign(event.deltaY);
    if (!wheelGesture || now - wheelGesture.lastAt > 180 || direction !== wheelGesture.direction) {
      wheelGesture = {lastAt: now, direction, distance: 0, atEdge: atEdge(face, direction), consumed: false};
    }
    wheelGesture.lastAt = now;
    // One word per wheel/trackpad gesture, including its momentum events.
    if (wheelGesture.consumed) { event.preventDefault(); return; }
    if (!wheelGesture.atEdge || !atEdge(face, direction)) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? face.clientHeight : 1;
    wheelGesture.distance += Math.abs(event.deltaY) * unit;
    if (wheelGesture.distance >= 50) {
      wheelGesture.consumed = true;
      navigate(direction);
    }
  }, {passive: false});
  window.addEventListener('pageshow', () => { stopMotion(); state = load(); draw(); });
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
    location.replace('index.html');
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
  const photo = $('#edit-analysis-photo');
  const photoStatus = $('#edit-photo-status');
  void WordCollectorPhoto.get(termId).then(blob => {
    if (!blob) { photoStatus.textContent = '이 단어에 저장된 분석 이미지가 없습니다.'; return; }
    const url = URL.createObjectURL(blob);
    photo.onload = () => { photo.hidden = false; photoStatus.textContent = '이 단어에 저장된 분석 이미지입니다.'; URL.revokeObjectURL(url); };
    photo.onerror = () => { photoStatus.textContent = '저장된 이미지를 표시하지 못했습니다.'; URL.revokeObjectURL(url); };
    photo.alt = term.en + ' 분석 이미지';
    photo.src = url;
  }).catch(() => { photoStatus.textContent = '저장된 이미지를 불러오지 못했습니다. 다시 열어 주세요.'; });
}

function openFlashcardDirect() {
  location.replace(cardUrl(termId));
}

function saveTermChanges() {
  const updated = {...state.terms[termId]};
  for (const [id, key] of Object.entries(fields)) updated[key] = document.getElementById(id).value.trim();
  const validation = WordCollectorPartialTerm.validate(updated);
  if (!validation.ok) {
    alert(validation.message);
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
