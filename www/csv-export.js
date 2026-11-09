(function () {
  'use strict';
  // Preserve the existing Node CSV entry point for tests and other callers.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = require('./word-export.js');
    return;
  }
  const api = window.WordCollectorExport;
  const $ = selector => document.querySelector(selector);
  const buttons = [...document.querySelectorAll('[data-format]')];
  let busy = false;
  function read() {
    const raw = localStorage.getItem('lexicon-word-collector-v1');
    return raw === null ? structuredClone(seed) : JSON.parse(raw);
  }
  function refresh() {
    const state = read(), selected = $('#course').value;
    if (!state || !state.courses || typeof state.courses !== 'object' || Array.isArray(state.courses)) {
      throw new Error('단어장 구성을 확인해 주세요.');
    }
    $('#course').replaceChildren(new Option('전체 단어장', ''));
    for (const [id, names] of Object.entries(state.courses)) {
      $('#course').add(new Option(Array.isArray(names) ? names[0] : id, id));
    }
    if (Object.hasOwn(state.courses, selected)) $('#course').value = selected;
    // Re-evaluate if an edited/deleted course no longer exists.
    const result = api.toCsv(state, $('#course').value);
    $('#preview').value = result.text;
    $('#count').textContent = result.count + '개 단어 · 7열';
    $('#columns').textContent = api.headers.join(' / ');
    buttons.forEach(button => { button.disabled = busy || result.count === 0; });
    return {state, count: result.count};
  }
  function showError(error) {
    $('#status').textContent = error.message || '내보내기에 실패했습니다.';
    $('#count').textContent = '';
    $('#preview').value = '';
    buttons.forEach(button => { button.disabled = true; });
  }
  function update() {
    try { refresh(); $('#status').textContent = ''; } catch (error) { showError(error); }
  }
  const save = window.WordCollectorSave;
  for (const button of buttons) button.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    try {
      const result = refresh(), format = button.dataset.format;
      if (!result.count) throw new Error('내보낼 단어가 없습니다.');
      const bytes = format === 'xlsx' ? api.toXlsx(result.state, $('#course').value).bytes :
        new TextEncoder().encode(api.toCsv(result.state, $('#course').value).text);
      const now = new Date();
      const stamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
      $('#status').textContent = await save(bytes, 'wordcollector-' + stamp + '.' + format, api.mime[format]);
    } catch (error) {
      $('#status').textContent = error.name === 'AbortError' ? '저장을 취소했습니다.' : error.message;
    } finally {
      busy = false;
      try { refresh(); } catch (error) { showError(error); }
    }
  });
  $('#course').addEventListener('change', update);
  $('#refresh').addEventListener('click', update);
  window.addEventListener('pageshow', update);
  update();
})();
