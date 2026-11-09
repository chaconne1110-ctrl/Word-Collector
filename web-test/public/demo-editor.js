(function(){
  'use strict';
  const $=s=>document.querySelector(s),key='lexicon-word-collector-v1',model=window.WordCollectorDemoData;
  const read=()=>model.read(localStorage.getItem(key),seed);
  function message(text){$('#demo-status').textContent=text;}
  function fill(word){for(const field of model.fields){const input=$('#demo-'+field);if(input)input.value=word[field]||'';}}
  function targets(selected=''){
    const state=read();
    $('#demo-target').replaceChildren(new Option('새 단어',''));
    for(const [id,word]of Object.entries(state.terms))$('#demo-target').add(new Option(word.en+' · '+word.ko,id));
    $('#demo-course').replaceChildren(...Object.entries(state.courses).map(([id,names])=>new Option(names[0],id)));
    if(Object.hasOwn(state.terms,selected))$('#demo-target').value=selected;
  }
  $('#demo-target').addEventListener('change',()=>{try{const word=read().terms[$('#demo-target').value];fill(word||{course:$('#demo-course').options[0]?.value});message('');}catch(e){message(e.message);}});
  $('#demo-example').addEventListener('click',()=>{try{targets();fill(model.example);message('예시를 채웠습니다. 테스트 단어 저장을 누르세요.');}catch(e){message(e.message);}});
  $('#demo-form').addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const record=Object.fromEntries(model.fields.filter(field=>$('#demo-'+field)).map(field=>[field,$('#demo-'+field).value]));
      const result=model.save(read(),record,$('#demo-target').value);
      localStorage.setItem(key,JSON.stringify(result.state));
      targets(result.id);fill(result.state.terms[result.id]);$('#refresh').click();
      message('저장했습니다. 아래 CSV·XLSX 파일에 최신 내용이 반영됩니다.');
    }catch(e){message('저장하지 못했습니다. '+e.message);}
  });
  $('#demo-reset').addEventListener('click',()=>{
    if(!confirm('이 웹 테스트 페이지의 저장 자료를 기본 예시로 초기화할까요?'))return;
    try{localStorage.removeItem(key);targets();fill({course:$('#demo-course').options[0]?.value});$('#refresh').click();message('기본 예시로 초기화했습니다.');}catch(e){message(e.message);}
  });
  try{targets();}catch(e){message(e.message);}
})();
