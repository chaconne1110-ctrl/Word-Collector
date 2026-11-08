(() => {
  'use strict';
  const KEY = 'lexicon-word-collector-v1';
  const $ = id => document.getElementById(id);
  let reviewed = null;
  let currentExported = false;

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
  function validate(value) {
    if (!isRecord(value) || !isRecord(value.courses) || !isRecord(value.terms) || !Array.isArray(value.saved)) {
      throw new Error('courses, terms, saved 구조가 올바르지 않습니다.');
    }
    for (const [id, names] of Object.entries(value.courses)) {
      if (!id || !Array.isArray(names) || names.length < 1 || !names.every(name => typeof name === 'string')) {
        throw new Error('단어장 구조가 올바르지 않습니다.');
      }
    }
    for (const [id, term] of Object.entries(value.terms)) {
      if (!id || !isRecord(term) || typeof term.course !== 'string' ||
          !Object.hasOwn(value.courses, term.course) || typeof term.en !== 'string' || typeof term.ko !== 'string') {
        throw new Error('단어 정보 또는 단어장 연결이 올바르지 않습니다.');
      }
    }
    if (!value.saved.every(id => typeof id === 'string' && Object.hasOwn(value.terms, id)) ||
        new Set(value.saved).size !== value.saved.length) {
      throw new Error('북마크 목록에 잘못된 ID 또는 중복 ID가 있습니다.');
    }
    return value;
  }
  const counts = data => ({courses: Object.keys(data.courses).length,
    terms: Object.keys(data.terms).length, saved: data.saved.length});
  function readCurrent() {
    const raw = localStorage.getItem(KEY);
    if (raw === null) throw new Error('이 주소에 저장된 단어 데이터가 없습니다. 기존 앱에서 단어 저장 후 다시 확인하세요.');
    return {raw, data: validate(JSON.parse(raw))};
  }
  function refresh() {
    try {
      const c = counts(readCurrent().data);
      $('current').textContent = `단어장 ${c.courses}개 · 단어 ${c.terms}개 · 북마크 ${c.saved}개\n저장 주소: ${location.origin}`;
      $('export').disabled = false; $('pc-export').disabled = false;
    } catch (error) {
      $('current').textContent = error.message + '\n저장 주소: ' + location.origin;
      $('export').disabled = true; $('pc-export').disabled = true;
    }
  }
  function download(data, name) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.style.display = 'none';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  $('pc-export').addEventListener('click', async () => {
    const button = $('pc-export');
    button.disabled = true;
    $('export-status').textContent = 'PC에 백업 저장 요청 중…';
    try {
      const {raw} = readCurrent();
      const response = await fetch('/api/backup', {method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({format:'word-collector-backup',version:1,createdAt:new Date().toISOString(),
          sourceOrigin:location.origin,storageKey:KEY,data:JSON.parse(raw)})});
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'PC 서버 저장 요청 실패');
      currentExported = true;
      $('export-status').textContent = `PC 백업 저장 및 파일 확인 완료.\n폴더: ${result.folder}\n파일명: ${result.filename}`;
      $('export-status').className = 'ok';
    } catch (error) {
      $('export-status').textContent = 'PC 백업 실패: ' + error.message;
      $('export-status').className = 'warn';
    } finally { button.disabled = false; }
  });
  $('export').addEventListener('click', () => {
    try {
      const {raw} = readCurrent();
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      download({format: 'word-collector-backup', version: 1, createdAt: new Date().toISOString(),
        sourceOrigin: location.origin, storageKey: KEY, data: JSON.parse(raw)}, `WordCollector_Backup_${stamp}.json`);
      $('export-status').textContent = '백업 파일 다운로드를 요청했습니다. 휴대폰의 다운로드 폴더에서 실제 파일이 만들어졌는지 확인하세요.';
      $('export-status').className = 'ok';
    } catch (error) { $('export-status').textContent = '백업 실패: ' + error.message; }
  });
  $('file').addEventListener('change', async () => {
    reviewed = null;
    $('review').style.display = 'none';
    $('confirm').value = '';
    $('restore').disabled = true;
    $('status').textContent = '';
    $('review-error').textContent = '';
    const file = $('file').files[0];
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('파일 크기가 20MB를 초과합니다.');
      const obj = JSON.parse(await file.text());
      if (!isRecord(obj) || obj.format !== 'word-collector-backup' || obj.version !== 1 ||
          obj.storageKey !== KEY || !isRecord(obj.data)) throw new Error('지원하는 Word Collector 백업 파일이 아닙니다.');
      const data = validate(obj.data);
      reviewed = {data, createdAt: obj.createdAt || '미기록', sourceOrigin: obj.sourceOrigin || '미기록'};
      const c = counts(data);
      const stats = [`백업 시각: ${reviewed.createdAt}`, `백업 주소: ${reviewed.sourceOrigin}`,
        `단어장 ${c.courses}개 · 단어 ${c.terms}개 · 북마크 ${c.saved}개`];
      try { const cur = counts(readCurrent().data); stats.push(`현재 데이터: 단어장 ${cur.courses}개 · 단어 ${cur.terms}개 · 북마크 ${cur.saved}개`); }
      catch { stats.push('현재 데이터: 유효한 저장 데이터 없음'); }
      $('summary').replaceChildren(...stats.map(s => { const li = document.createElement('li'); li.textContent = s; return li; }));
      $('review').style.display = 'block';
      $('confirm').value = '';
    } catch (error) { $('review-error').textContent = '검수 실패: ' + error.message; }
  });
  $('confirm').addEventListener('input', () => {
    $('restore').disabled = !reviewed || $('confirm').value.trim() !== '복원';
  });
  $('restore').addEventListener('click', () => {
    if (!reviewed || $('confirm').value.trim() !== '복원') return;
    if (!currentExported && !$('backup-verified').checked) {
      $('status').textContent = '먼저 현재 백업 파일이 실제로 저장되었는지 확인하고 확인란을 선택하세요.';
      return;
    }
    if (!confirm('선택한 백업으로 현재 단어·북마크 정보를 교체합니다. 다운로드한 현재 백업 파일을 확인했습니까?')) return;
    const before = localStorage.getItem(KEY);
    try {
      const raw = JSON.stringify(reviewed.data);
      localStorage.setItem(KEY, raw);
      if (localStorage.getItem(KEY) !== raw) throw new Error('저장 검증에 실패했습니다.');
      $('status').textContent = '복원 완료. 홈으로 돌아가 단어와 북마크를 확인하세요.';
      $('status').className = 'ok';
      reviewed = null; $('restore').disabled = true;
      refresh();
    } catch (error) {
      try { if (before === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, before); }
      catch { $('status').textContent = '복원/롤백 실패: 기존 백업 파일을 보관하고 앱을 종료하지 마세요. ' + error.message; return; }
      $('status').textContent = '복원 실패: ' + error.message + ' 기존 저장 내용을 되돌렸습니다.';
    }
  });
  refresh();
})();
