(function(root){
  'use strict';
  const api=typeof module!=='undefined'&&module.exports?require('./word-export.js'):root.WordCollectorExport;
  const fields=['en','ko','discipline','course','enDef','koDef','exampleEn','exampleKo','originalTerm','pos'];
  function read(raw,initial){
    const state=raw===null?structuredClone(initial):JSON.parse(raw);
    api.toRows(state);
    if(!Array.isArray(state.saved))throw Error('북마크 데이터가 올바르지 않습니다.');
    return state;
  }
  function save(state,record,id=''){
    api.toRows(state);
    const word={};
    for(const field of fields){
      const value=record[field]??'';
      if(typeof value!=='string'||value.length>(field==='en'?120:1200))throw Error('입력 길이와 내용을 확인해 주세요.');
      word[field]=value.trim();
    }
    if(!word.en||!word.ko)throw Error('영어 단어와 한국어 뜻을 입력하세요.');
    if(!Object.hasOwn(state.courses,word.course))throw Error('과목을 선택하세요.');
    if(id&&!Object.hasOwn(state.terms,id))throw Error('수정할 단어를 다시 선택하세요.');
    const next=structuredClone(state);
    id=id||'term_'+crypto.randomUUID();
    next.terms[id]={...(next.terms[id]||{}),...word};
    return {state:next,id};
  }
  const example={en:'Eddy current',ko:'와전류',discipline:'전기전자공학',course:'electromagnetics',enDef:'A circulating electric current induced by a changing magnetic field.',koDef:'변화하는 자기장에 의해 도체 내부에 유도되는 순환 전류.',exampleEn:'Eddy currents cause losses in transformer cores.',exampleKo:'와전류는 변압기 철심에서 손실을 일으킨다.',originalTerm:'와전류',pos:'noun'};
  const result={read,save,example,fields};
  if(typeof module!=='undefined'&&module.exports)module.exports=result;else root.WordCollectorDemoData=result;
})(globalThis);
