// Shared validation for review and edit forms.
// Empty fields are valid. A single identifying term (English OR Korean) is enough.
(function(root) {
  'use strict';
  const normalize = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  function validate(fields) {
    const en = String(fields?.en ?? '').trim();
    const ko = String(fields?.ko ?? '').trim();
    if (!en && !ko) return {ok:false, message:'영어 표제어 또는 한국어 뜻 중 하나는 입력해 주세요.'};
    if (en && (!/[a-z]/i.test(en) || /\p{Script=Hangul}/u.test(en) || en.length > 120)) {
      return {ok:false,message:'영어 표제어를 확인해 주세요. 영어 표제어를 모르면 비워두고 한국어 뜻만 입력해도 됩니다.'};
    }
    if (ko.length > 1200) return {ok:false,message:'한국어 뜻은 1,200자 이하로 입력해 주세요.'};
    return {ok:true,message:''};
  }
  function findExisting(terms, course, fields) {
    const en = normalize(fields?.en);
    const ko = normalize(fields?.ko);
    return Object.entries(terms || {}).find(([, item]) => {
      if (!item || item.course !== course) return false;
      // Never merge Korean-only cards just because their English text is empty.
      if (en) return normalize(item.en) === en;
      return ko !== '' && !normalize(item.en) && normalize(item.ko) === ko;
    });
  }
  const api = {validate,findExisting};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.WordCollectorPartialTerm = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
