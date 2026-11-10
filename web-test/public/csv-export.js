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
  function base64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return btoa(binary);
  }
  async function save(bytes, name, mimeType) {
    const cap = window.Capacitor;
    if (cap?.getPlatform?.() === 'android') {
      const plugin = cap.Plugins?.WordExport;
      if (typeof plugin?.save !== 'function') throw new Error('파일 저장 기능이 포함된 최신 APK로 업데이트해 주세요.');
      if (bytes.length > 24 * 1024 * 1024) throw new Error('파일이 24 MiB를 넘었습니다. 단어장을 나눠 내보내 주세요.');
      const result = await plugin.save({filename: name, mimeType: mimeType.split(';')[0], base64: base64(bytes)});
      return result.cancelled ? '저장을 취소했습니다.' : '파일을 저장했습니다.';
    }
    const file = new File([bytes], name, {type: mimeType});
    if (navigator.canShare?.({files: [file]})) {
      await navigator.share({files: [file], title: '단어장 내보내기'});
      return '공유를 완료했습니다. 선택한 앱에서 파일을 확인하세요.';
    }
    const url = URL.createObjectURL(file), link = document.createElement('a');
    link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return '파일 다운로드를 요청했습니다. 브라우저의 다운로드 목록을 확인하세요.';
  }
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
