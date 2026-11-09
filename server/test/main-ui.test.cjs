const {test} = require('node:test');
const assert = require('node:assert/strict');
const {once} = require('node:events');
const {createServer} = require('../server.cjs');
const {createClient} = require('../../www/analysis-api.js');
const value = {englishTerm:'eddy current',koreanMeaning:'와전류',specialization:'전기공학',notebookName:'전자기학',
  englishDefinition:'A circulating induced current.',koreanDefinition:'순환하는 유도 전류.',exampleSentence:'Eddy currents heat conductors.',
  explanation:'전자기 유도 현상입니다.',recommendationReason:'저장된 Skin Effect의 자기장 관련 의미와 연관됩니다.',relatedTerms:['Skin Effect'],pos:'noun',exampleKo:'와전류는 도체를 가열합니다.'};
async function fixture(t) {
  const calls=[];
  const server=createServer({apiKey:'fake-local-test',fetchImpl:async(url,init)=>{
    calls.push({url,body:JSON.parse(init.body)});
    return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(value)}]}}]}),{status:200});
  }});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const url=`http://127.0.0.1:${server.address().port}`;
  return {url,calls,send:body=>fetch(url+'/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})};
}
test('GitHub main legacy analysis contract maps saved evidence and seven export fields in one request',async t=>{
  const {send,calls}=await fixture(t);
  const response=await send({term:'와전류',context:'변하는 자기장이 전류를 유도한다.',autoCourse:true,
    notebooks:[{course:'전자기학',words:[{en:'Skin Effect',ko:'표피 효과',enDef:'A current distribution effect.',koDef:'전류 분포 현상.'}]},
      {course:'전기기기',words:[]}]});
  assert.equal(response.status,200);const body=await response.json();
  assert.equal(body.model,'gemini-3.5-flash-lite');assert.equal(body.discipline,'전기공학');assert.equal(body.exampleKo,value.exampleKo);
  assert.deepEqual(body.classification.relatedTerms,[{en:'Skin Effect',ko:'표피 효과'}]);assert.equal(body.classification.reviewedWords,1);
  assert.equal(calls.length,1);assert.match(calls[0].url,/gemini-3.5-flash-lite:generateContent$/);
  assert.ok(calls[0].body.generationConfig.responseSchema.required.includes('exampleKo'));
});
test('legacy direct selection remains the save course with highest-priority reference',async t=>{
  const {send,calls}=await fixture(t);
  const response=await send({term:'Transformer',course:'전기기기',context:'Self-attention is used for language processing.',autoCourse:false});
  assert.equal(response.status,200);assert.equal((await response.json()).course,'전기기기');
  assert.equal(JSON.parse(calls[0].body.contents[0].parts[0].text).referenceText,'Self-attention is used for language processing.');
});
test('only public www files are served and DNS rebind hostnames are refused',async t=>{
  const {url,calls}=await fixture(t);
  assert.equal((await fetch(url+'/')).status,200);
  const css=await fetch(url+'/assets/styles/index_html.css');assert.equal(css.status,200);assert.match(css.headers.get('content-type'),/text\/css/);
  for (const path of ['/server/.env','/.env','/%2e%2e%2fserver%2f.env'])assert.equal((await fetch(url+path)).status,404);
  const hostStatus=await new Promise((resolve,reject)=>{
    require('node:http').get(url+'/health',{headers:{Host:'untrusted.example'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject);
  });
  assert.equal(hostStatus,403);
  assert.equal(calls.length,0);
});
test('Capacitor HTTP transport uses USB-local server without exposing a key or using browser fetch',async()=>{
  let call;
  const result={en:'eddy current',ko:'와전류',discipline:'전기공학',pos:'noun',enDef:'definition',koDef:'정의',exampleEn:'A sentence.',exampleKo:'예문.',course:'전자기학',model:'gemini-3.5-flash-lite'};
  const client=createClient({native:true,nativeHttp:{request:async options=>{call=options;return {status:200,data:JSON.stringify(result)};}},fetchImpl:()=>assert.fail('must use native bridge')});
  const input={term:'와전류',autoCourse:true};assert.deepEqual(await client.request(input),result);
  assert.equal(call.url,'http://127.0.0.1:8787/api/analyze');assert.deepEqual(call.data,input);assert.ok(!JSON.stringify(call).includes('api-key'));
  await assert.rejects(()=>createClient({native:true,nativeHttp:{request:async()=>({status:200,data:{...result,model:'other'}})}}).request(input),/모델 설정/);
  await assert.rejects(()=>createClient({native:true}).request(input),/최신 APK/);
});
