/* Existing app Output tab: selected terms + selected columns, no data mutation. */
(function () {
  'use strict';
  const api = window.WordCollectorExport;
  const query = selector => document.querySelector(selector);
  const groups = query('#subjectGroups'), master = query('#selectAllMaster');
  const button = query('#exportActionBtn'), status = query('#exportStatus');
  let state, selected = new Set(), initialized = false, busy = false;
  function read() {
    const raw = localStorage.getItem('lexicon-word-collector-v1');
    const value = raw === null ? structuredClone(seed) : JSON.parse(raw);
    api.toRows(value); // Validate; never silently replace corrupt saved data with examples.
    return value;
  }
  function columns() {
    return [...document.querySelectorAll('[data-column]:checked')].map(input => input.dataset.column);
  }
  function checkbox(labelText, className, checked, change) {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-3 p-2';
    const input = document.createElement('input');
    input.type = 'checkbox'; input.className = className; input.checked = checked;
    const text = document.createElement('span'); text.textContent = labelText;
    label.append(input, text); input.addEventListener('change', () => change(input.checked));
    return {label, input};
  }
  function counts() {
    const ids = Object.keys(state.terms), count = selected.size;
    master.checked = ids.length > 0 && count === ids.length;
    master.indeterminate = count > 0 && count < ids.length;
    query('#totalWords').textContent = '총 ' + ids.length + '개 표제어 등록됨';
    query('#globalSelectedCount').textContent = count + '개 단어 선택됨';
    query('#columnCount').textContent = columns().length + '개 항목 활성';
    button.querySelector('span:last-child').textContent = count + '개 단어 · ' + columns().length + '개 항목 다운로드';
    button.disabled = busy || !count || !columns().length;
    for (const group of groups.children) {
      const words = [...group.querySelectorAll('.word-checkbox')];
      const checked = words.filter(input => input.checked).length;
      const parent = group.querySelector('.subject-checkbox');
      parent.checked = words.length > 0 && checked === words.length;
      parent.indeterminate = checked > 0 && checked < words.length;
      group.querySelector('[data-group-count]').textContent = checked + '/' + words.length + '개 선택';
    }
  }
  function render() {
    groups.replaceChildren();
    const courses = new Map(Object.entries(state.courses).map(([id, name]) => [id, Array.isArray(name) ? name[0] : id]));
    for (const word of Object.values(state.terms)) if (!courses.has(word.course)) courses.set(word.course, word.course || '미지정');
    for (const [course, name] of courses) {
      const details = document.createElement('details'); details.open = true;
      details.className = 'subject-card rounded-xl bg-surface-container-lowest p-4';
      const summary = document.createElement('summary'); summary.textContent = name;
      const members = Object.entries(state.terms).filter(([, word]) => word.course === course);
      const parent = checkbox('이 단어장 전체 선택', 'subject-checkbox', false, checked => {
        for (const [id] of members) checked ? selected.add(id) : selected.delete(id);
        for (const input of details.querySelectorAll('.word-checkbox')) input.checked = checked;
        counts();
      });
      const count = document.createElement('span'); count.dataset.groupCount = '';
      details.append(summary, parent.label, count);
      for (const [id, word] of members) {
        const child = checkbox((word.en || '') + ' · ' + (word.ko || ''), 'word-checkbox', selected.has(id), checked => {
          checked ? selected.add(id) : selected.delete(id); counts();
        });
        child.input.dataset.termId = id; details.append(child.label);
      }
      groups.append(details);
    }
    counts();
  }
  function refresh() {
    state = read();
    const ids = Object.keys(state.terms);
    selected = initialized ? new Set(ids.filter(id => selected.has(id))) : new Set(ids);
    initialized = true; render();
  }
  function fail(error) { status.textContent = error.message || '내보내기에 실패했습니다.'; button.disabled = true; }
  master.addEventListener('change', () => {
    selected = master.checked ? new Set(Object.keys(state.terms)) : new Set(); render();
  });
  document.querySelectorAll('[data-column]').forEach(input => input.addEventListener('change', counts));
  button.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    try {
      refresh(); // Re-read latest edits/deletions immediately before generating the file.
      if (!selected.size) throw new Error('내보낼 단어를 선택해 주세요.');
      const options = {columns: columns(), termIds: [...selected]};
      const format = query('#exportFormat').value;
      if (!['csv', 'xlsx'].includes(format)) throw new Error('파일 형식을 확인해 주세요.');
      const bytes = format === 'xlsx' ? api.toXlsx(state, '', options).bytes : new TextEncoder().encode(api.toCsv(state, '', options).text);
      status.textContent = await window.WordCollectorSave(bytes, 'wordcollector-' + new Date().toISOString().slice(0, 10) + '.' + format, api.mime[format]);
    } catch (error) {
      status.textContent = error.name === 'AbortError' ? '저장을 취소했습니다.' : error.message;
    } finally {
      busy = false;
      try { refresh(); } catch (error) { fail(error); }
    }
  });
  function update() { try { refresh(); } catch (error) { fail(error); } }
  window.addEventListener('pageshow', update);
  window.addEventListener('storage', event => { if (event.key === 'lexicon-word-collector-v1' || event.key === null) update(); });
  update();
})();
