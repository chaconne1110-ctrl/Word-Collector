// PDF·사진에서 단어 찾기: what this device already knows about the user, used to rank and
// keep candidates (term-extract.js). Everything stays in this browser:
// - saved: English words already in the notebooks (marked "저장됨", shown a little lower)
// - notebook names: to guess the field (전력공학 → 전기·전자)
// - field: the field the user chose on the scan page
// - learned: words the user picked from scans before (kept in 전공용어 위주, shown higher);
//   only the picked words themselves, at most 500, nothing from the file.
(function(root) {
  'use strict';
  const NOTEBOOK_KEY = 'lexicon-word-collector-v1';
  const FIELD_KEY = 'word-collector-scan-field-v1';
  const LEARNED_KEY = 'word-collector-scan-learned-v1';
  const LEARNED_LIMIT = 500;
  const read = key => { try { return root.localStorage?.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { root.localStorage?.setItem(key, value); } catch {} };

  function notebooks() {
    try {
      const data = JSON.parse(read(NOTEBOOK_KEY) || 'null');
      const courses = data && typeof data.courses === 'object' ? Object.values(data.courses) : [];
      const terms = data && typeof data.terms === 'object' ? Object.values(data.terms) : [];
      return {
        names: courses.flatMap(course => Array.isArray(course) ? course.filter(part => typeof part === 'string') : []),
        majors: terms.map(term => term?.discipline).filter(value => typeof value === 'string'),
        saved: new Set(terms.map(term => String(term?.en ?? '').trim().toLowerCase()).filter(Boolean))
      };
    } catch {
      return {names: [], majors: [], saved: new Set()};
    }
  }
  function learned() {
    try {
      const list = JSON.parse(read(LEARNED_KEY) || '[]');
      return new Set(Array.isArray(list) ? list.filter(word => typeof word === 'string') : []);
    } catch {
      return new Set();
    }
  }
  root.WordCollectorScanContext = {
    load() {
      const books = notebooks();
      return {saved: books.saved, learned: learned(), field: read(FIELD_KEY) || '',
        guessed: root.WordCollectorTermExtract?.guessField([...books.names, ...books.majors]) || ''};
    },
    rememberField(field) { write(FIELD_KEY, field); },
    // The words picked this time (lower case), newest first.
    rememberPicks(terms) {
      const next = [...new Set([...terms.map(term => String(term).trim().toLowerCase()).filter(Boolean), ...learned()])];
      write(LEARNED_KEY, JSON.stringify(next.slice(0, LEARNED_LIMIT)));
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
