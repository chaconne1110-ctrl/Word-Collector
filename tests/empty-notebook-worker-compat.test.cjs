const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createClient}=require('../www/analysis-api.js');
const token='wc_'+'a'.repeat(64);
const endpoint='https://word-collector-api.yechan-lim-elec.workers.dev/api/analyze';
const notebooks=[
  {course:'전력공학',words:[]},
  {course:'반도체공정',words:[]}
];
const analysis={
  englishTerm:'Transformer',koreanMeaning:'변압기',specialization:'전기공학',
  notebookName:'전력공학',englishDefinition:'A power conversion device.',
  koreanDefinition:'전압을 변환하는 기기.',exampleSentence:'The transformer reduces voltage.',
  explanation:'변압기입니다.',recommendationReason:'단어장 이름과 단어 입력으로 임시 추천',
  relatedTerms:[]
};
const modern={model:'gemini-3.5-flash-lite',analysis};
function mockFetch(firstMessage, outcomes) {
  const calls=[];
  const fn=async(url,options)=>{
    assert.equal(url,endpoint);
    const data=JSON.parse(options.body);
    calls.push(data);
    if(calls.length===1) return new Response(JSON.stringify({error:firstMessage}),{status:400});
    if(outcomes) return outcomes(calls);
    return new Response(JSON.stringify(modern),{status:200});
  };
  return {fn,calls};
}
test('manual custom empty notebook falls back once to modern Worker input; does not invent translation',async()=>{
  const {fn,calls}=mockFetch('저장할 기존 단어장을 선택해 주세요.');
  const result=await createClient({token,fetchImpl:fn}).request({
    term:'Transformer',course:'전력공학',context:'',autoCourse:false,notebooks
  });
  assert.equal(calls.length,2);
  assert.equal(calls[0].course,'전력공학');
  assert.equal(Object.hasOwn(calls[1],'term'),false);
  assert.equal(calls[1].selectedSubject,'전력공학');
  assert.deepEqual(calls[1].notebooks.map(b=>b.name),['전력공학','반도체공정']);
  assert.equal(result.course,'전력공학');
  assert.equal(result.needsManualCompletion,true);
  assert.equal(result.pos,'');
  assert.equal(result.exampleKo,'');
});
test('empty AI classification retries only rejected legacy validation; retains reviewed zero terms',async()=>{
  const {fn,calls}=mockFetch('분류 기준이 될 저장 단어가 없습니다. 기존 과목을 직접 선택해 먼저 단어를 저장해 주세요.');
  const result=await createClient({token,fetchImpl:fn}).request({
    term:'Transformer',context:'',autoCourse:true,notebooks
  });
  assert.equal(calls.length,2);
  assert.equal(calls[1].autoSubject,true);
  assert.equal(calls[1].notebooks[1].terms.length,0);
  assert.equal(result.classification.reviewedWords,0);
  assert.equal(result.classification.reviewedCourses,2);
  assert.deepEqual(result.classification.relatedTerms,[]);
  assert.equal(result.needsManualCompletion,true);
});
test('quota, upstream failure and authentication do not retry',async()=>{
  for(const status of [401,429,502,503]){
    let calls=0;
    const client=createClient({token,fetchImpl:async()=>{
      calls++;return new Response(JSON.stringify({error:'no retry'}),{status});
    }});
    await assert.rejects(()=>client.request({term:'Transformer',autoCourse:true,notebooks}),/no retry/);
    assert.equal(calls,1);
  }
});
test('unexpected client validation error does not retry',async()=>{
  let calls=0;
  const client=createClient({token,fetchImpl:async()=>{
    calls++;return new Response(JSON.stringify({error:'잘못된 요청'}),{status:400});
  }});
  await assert.rejects(()=>client.request({term:'Transformer',autoCourse:false,notebooks}),/잘못된 요청/);
  assert.equal(calls,1);
});
test('native HTTPS fallback uses CapacitorHttp and never sends token in payload',async()=>{
  const sent=[];
  const client=createClient({native:true,token,nativeHttp:{request:async opts=>{
    sent.push(opts);
    return sent.length===1?
      {status:400,data:{error:'저장할 기존 단어장을 선택해 주세요.'}}:
      {status:200,data:modern};
  }}});
  const result=await client.request({term:'Transformer',autoCourse:false,course:'전력공학',notebooks});
  assert.equal(sent.length,2);
  assert.equal(sent[0].url,endpoint);
  assert.equal(sent[1].headers.Authorization,'Bearer '+token);
  assert.equal(sent[1].data.selectedSubject,'전력공학');
  assert.equal(JSON.stringify(sent.map(s=>s.data)).includes(token),false);
  assert.equal(result.needsManualCompletion,true);
});
test('successful legacy response is not rewritten or retried',async()=>{
  const response={model:'gemini-3.5-flash-lite',en:'Voltage',ko:'전압',discipline:'전기공학',
    pos:'noun',enDef:'Potential difference.',koDef:'전위차.',exampleEn:'Voltage rises.',
    exampleKo:'전압이 상승한다.',course:'전력공학'};
  let calls=0;
  const result=await createClient({token,fetchImpl:async()=>{calls++;return new Response(JSON.stringify(response));}}).request({
    term:'Voltage',autoCourse:false,course:'전력공학',notebooks
  });
  assert.equal(calls,1);
  assert.deepEqual(result,response);
});
