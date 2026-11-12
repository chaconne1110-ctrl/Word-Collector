const test = require('node:test');
const assert = require('node:assert/strict');
const {once} = require('node:events');
const {createServer} = require('../server/server.cjs');
const {createClient} = require('../www/analysis-api.js');
const reference = 'Current flows through the conductor.\nThe conductor warms up.';
const translation = '전류가 도체를 통해 흐릅니다.\n도체가 따뜻해집니다.';
const output = {
  englishTerm:'current', koreanMeaning:'전류', specialization:'전기공학', notebookName:'전기',
  englishDefinition:'A flow of electric charge.', koreanDefinition:'전하의 흐름.',
  exampleSentence:'The current is measured.', exampleKo:'전류를 측정합니다.', pos:'noun',
  explanation:'전하의 이동입니다.', recommendationReason:'문맥 기준', relatedTerms:[],
  referenceTranslation:translation
};
const requestBody = {
  term:'current', context:reference, course:'전기', autoCourse:false,
  notebooks:[{course:'전기',words:[]}], translateReference:true
};
const token = 'wc_' + 'a'.repeat(64);

for (const target of ['server', 'worker']) {
  test(`${target}: translate the reference in the same call, validate it, preserve old clients`, async t => {
    let generated = {...output}, calls = 0, sent;
    const upstream = async (_, options) => {
      calls++; sent = JSON.parse(options.body);
      return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(generated)}]}}]}));
    };
    let send;
    if (target === 'server') {
      const server = createServer({apiKey:'test-only',fetchImpl:upstream});
      server.listen(0,'127.0.0.1'); await once(server,'listening');
      t.after(() => new Promise(resolve => {server.closeAllConnections();server.close(resolve);}));
      send = body => fetch(`http://127.0.0.1:${server.address().port}/api/analyze`, {
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
      });
    } else {
      const worker = (await import('../cloudflare/worker.mjs')).default;
      const original = globalThis.fetch;
      globalThis.fetch = upstream; t.after(() => {globalThis.fetch = original;});
      const env = {GEMINI_API_KEY:'test-only',ENABLE_LIVE_ANALYSIS:'true',DB:{
        prepare(sql) {return {bind(){return this;},async first(){
          return sql.includes('FROM testers') ? {tester_id:'test',is_active:1} : {request_count:0};
        }};},
        async batch(){return [{success:true,meta:{changes:1}},{success:true,meta:{changes:1}}];}
      }};
      send = body => worker.fetch(new Request('https://test/api/analyze', {
        method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)
      }),env);
    }
    let res = await send(requestBody), data = await res.json();
    assert.equal(res.status,200,JSON.stringify(data));
    assert.equal(calls,1);
    assert.equal(data.referenceTranslation,translation);
    assert.equal(data.exampleKo,output.exampleKo);
    assert.notEqual(data.referenceTranslation,data.exampleKo);
    assert.equal(JSON.parse(sent.contents[0].parts[0].text).referenceText,reference);
    assert.ok(sent.generationConfig.responseSchema.required.includes('referenceTranslation'));

    const modern = {word:'current',referenceText:reference,selectedSubject:'전기',autoSubject:false,
      notebooks:[{name:'전기',terms:[]}],translateReference:true};
    res = await send(modern); data = await res.json();
    assert.equal(res.status,200); assert.equal(data.analysis.referenceTranslation,translation);
    for (const bad of [undefined, '', 17, '가'.repeat(1201)]) {
      generated = {...output,referenceTranslation:bad};
      res = await send(requestBody); assert.equal(res.status,502);
    }
    generated = {...output}; delete generated.referenceTranslation;
    res = await send({...requestBody,translateReference:false});
    assert.equal(res.status,200);
    assert.ok(!sent.generationConfig.responseSchema.required.includes('referenceTranslation'));
    res = await send({...requestBody,context:''}); assert.equal(res.status,200);
    assert.ok(!Object.hasOwn(await res.json(),'referenceTranslation'));
  });
}
test('modern compatibility fallback preserves reference translation without another model request', async () => {
  const calls = [];
  const client = createClient({token,fetchImpl:async (_, init) => {
    calls.push(JSON.parse(init.body));
    return calls.length === 1 ? new Response(JSON.stringify({error:'저장할 기존 단어장을 선택해 주세요.'}),{status:400}) :
      new Response(JSON.stringify({model:'gemini-3.5-flash-lite',analysis:output}));
  }});
  const result = await client.request(requestBody);
  assert.equal(calls.length,2); // First response is a pre-quota validation error.
  assert.equal(calls[1].translateReference,true);
  assert.equal(result.referenceTranslation,translation);
  assert.equal(result.exampleKo,''); // Never substitute the reference for the generated example.
});
