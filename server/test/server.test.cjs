'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {once} = require('node:events');
const {createServer, MODEL, LEGACY_MODEL} = require('../server.cjs');

const fixture = () => ({
  word: '와전류', referenceText: '시간에 따라 변하는 자기장이 도체에 와전류를 유도한다.', autoSubject: true, selectedSubject: '전기기기',
  notebooks: [
    {name: '전자기학', terms: [{englishTerm: 'eddy current', koreanMeaning: '와전류', englishDefinition: 'A circulating induced current.', koreanDefinition: '순환하는 유도 전류.'}]},
    {name: '전기기기', terms: [{englishTerm: 'motor', koreanMeaning: '전동기', englishDefinition: 'A rotating machine.', koreanDefinition: '회전 기기.'}]}
  ]
});
const output = overrides => ({englishTerm: 'eddy current', koreanMeaning: '와전류', specialization: '전기공학', notebookName: '전자기학',
  englishDefinition: 'A circulating current induced in a conductor by a changing magnetic field.',
  koreanDefinition: '변하는 자기장에 의해 도체에 유도되는 순환 전류.',
  exampleSentence: 'Eddy currents heat the conductor.', explanation: '전자기 유도에 의해 생깁니다.',
  recommendationReason: '전자기학에 저장된 eddy current의 뜻과 정의에 직접 부합합니다.', relatedTerms: ['eddy current'], ...overrides});
const upstream = data => new Response(JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(data)}]}}]}), {status: 200});
async function serverFor(t, options) {
  const server = createServer({apiKey: 'test-secret-never-print', ...options});
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => {server.closeAllConnections(); server.close(resolve);}));
  const url = `http://127.0.0.1:${server.address().port}`;
  return {server, url, send: body => fetch(`${url}/api/analyze`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)})};
}

test('model per app: X-WC-Models with Gemini 4 gets Gemini 4; older apps (no header) keep the previous model', async t => {
  assert.equal(MODEL, 'gemini-4-hydrogen');
  assert.equal(LEGACY_MODEL, 'gemini-3.5-flash-lite');
  const urls = [];
  const {url} = await serverFor(t, {fetchImpl: async target => { urls.push(target); return upstream(output()); }});
  for (const headers of [{'x-wc-models': 'gemini-4-hydrogen'}, {}, {'x-wc-models': 'gemini-9-unknown'}]) {
    const response = await fetch(`${url}/api/analyze`, {method: 'POST',
      headers: {'content-type': 'application/json', ...headers}, body: JSON.stringify(fixture())});
    assert.equal(response.status, 200);
    assert.equal((await response.json()).model, headers['x-wc-models'] === MODEL ? MODEL : LEGACY_MODEL);
  }
  assert.deepEqual(urls.map(target => target.split('/models/')[1]), [
    'gemini-4-hydrogen:generateContent', 'gemini-3.5-flash-lite:generateContent', 'gemini-3.5-flash-lite:generateContent']);
});

test('Gemini 4 thinks at MEDIUM; Gemini 3.5 gets no thinking setting; a rejected setting is retried once without it', async t => {
  const bodies = [];
  let reject = false;
  const {url} = await serverFor(t, {fetchImpl: async (_, init) => {
    const body = JSON.parse(init.body);
    bodies.push(body.generationConfig.thinkingConfig);
    if (reject && body.generationConfig.thinkingConfig) {
      return new Response(JSON.stringify({error: {code: 400, message: 'Unknown name "thinkingLevel" at generation_config.thinking_config'}}), {status: 400});
    }
    return upstream(output());
  }});
  const call = headers => fetch(`${url}/api/analyze`, {method: 'POST',
    headers: {'content-type': 'application/json', ...headers}, body: JSON.stringify(fixture())});
  assert.equal((await call({'x-wc-models': 'gemini-4-hydrogen'})).status, 200);
  assert.equal((await call({})).status, 200);
  assert.deepEqual(bodies, [{thinkingLevel: 'medium'}, undefined]);
  reject = true; bodies.length = 0;
  assert.equal((await call({'x-wc-models': 'gemini-4-hydrogen'})).status, 200);
  assert.deepEqual(bodies, [{thinkingLevel: 'medium'}, undefined]);
});

test('the app asks for Gemini 4 and accepts both models; the Worker allows the header (CORS) and negotiates', () => {
  const fs = require('node:fs');
  const api = fs.readFileSync('www/analysis-api.js', 'utf8');
  assert.match(api, /const ACCEPTED_MODELS = \[MODEL, 'gemini-3\.5-flash-lite'\];/);
  assert.match(api, /'X-WC-Models': MODEL/);
  assert.match(api, /!ACCEPTED_MODELS\.includes\(result\.model\)/);
  const worker = fs.readFileSync('cloudflare/worker.mjs', 'utf8');
  assert.match(worker, /'Authorization, Content-Type, X-WC-Device, X-WC-Models'/);
  assert.match(worker, /model: analysisModelFor\(request\.headers\.get\('X-WC-Models'\)\)/);
});

test('health identifies the fixed model without calling Gemini or exposing key', async t => {
  const {url} = await serverFor(t, {fetchImpl: () => assert.fail('health must not call Gemini')});
  const response = await fetch(`${url}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {ok: true, model: 'gemini-4-hydrogen'});
});

test('Korean auto classification sends actual notebook definitions, strict schema and one fixed-model request', async t => {
  let calls = 0, sent;
  const {send} = await serverFor(t, {fetchImpl: async (url, init) => {
    calls++; assert.ok(url.endsWith('/gemini-3.5-flash-lite:generateContent'));
    assert.equal(init.headers['x-goog-api-key'], 'test-secret-never-print');
    assert.equal(init.redirect, 'error');
    sent = JSON.parse(init.body); return upstream(output());
  }});
  const request = fixture(), before = JSON.stringify(request);
  const response = await send(request), data = await response.json();
  assert.equal(response.status, 200); assert.equal(calls, 1); assert.equal(data.model, LEGACY_MODEL); // no X-WC-Models header: older app
  assert.equal(data.analysis.notebookName, '전자기학');
  assert.deepEqual(data.analysis.relatedTerms, ['eddy current']);
  // Requests without a meaning choice default to the major meaning (older apps).
  assert.deepEqual(JSON.parse(sent.contents[0].parts[0].text), {...request, meaningMode: 'major'});
  assert.match(sent.systemInstruction.parts[0].text, /참고 문장.*최우선/);
  assert.match(sent.systemInstruction.parts[0].text, /저장 단어의 의미가 주된 분류 기준/);
  assert.equal(sent.generationConfig.responseMimeType, 'application/json');
  assert.deepEqual(sent.generationConfig.responseSchema.properties.notebookName.enum, ['전자기학','전기기기']);
  assert.equal(JSON.stringify(request), before);
  assert.ok(!JSON.stringify(data).includes(request.referenceText));
});

test('English ambiguous meaning follows supplied reference and manual save location always wins', async t => {
  let sent;
  const {send} = await serverFor(t, {fetchImpl: async (_, init) => {
    sent = JSON.parse(init.body);
    return upstream(output({englishTerm: 'Transformer', koreanMeaning: '트랜스포머', specialization: '인공지능',
      englishDefinition: 'A neural network architecture based on self-attention.', koreanDefinition: '자기 주의 집중에 기반한 신경망 구조.',
      notebookName: '전자기학', exampleSentence: 'The Transformer improves language processing.', relatedTerms: ['eddy current']}));
  }});
  const request = fixture(); request.word = 'Transformer'; request.autoSubject = false;
  request.referenceText = 'The Transformer uses self-attention for natural language processing.';
  const response = await send(request), data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.analysis.notebookName, '전기기기');
  assert.equal(data.analysis.specialization, '인공지능');
  assert.match(data.analysis.englishDefinition, /self-attention/);
  assert.match(data.analysis.recommendationReason, /참고 문장을 최우선/);
  assert.deepEqual(data.analysis.relatedTerms, []);
  assert.deepEqual(sent.generationConfig.responseSchema.properties.notebookName.enum, ['전기기기']);
});

test('empty notebooks disclose missing saved-term evidence; invented related terms cannot appear', async t => {
  const {send} = await serverFor(t, {fetchImpl: async () => upstream(output({relatedTerms: ['invented term']}))});
  const request = fixture(); request.notebooks.forEach(notebook => notebook.terms = []);
  const response = await send(request), data = await response.json();
  assert.equal(response.status, 200);
  assert.match(data.analysis.recommendationReason, /저장된 단어가 없어/);
  assert.match(data.analysis.recommendationReason, /임시 추천/);
  assert.deepEqual(data.analysis.relatedTerms, []);
});

test('input validation rejects malformed fields or destinations before calling Gemini', async t => {
  const {send, url} = await serverFor(t, {fetchImpl: () => assert.fail('invalid input must not call Gemini')});
  const cases = [null, {...fixture(),word:''}, {...fixture(),word:{}}, {...fixture(),autoSubject:'true'},
    {...fixture(),autoSubject:false,selectedSubject:'없는 과목'}, {...fixture(),autoSubject:false,notebooks:[]},
    {...fixture(), notebooks:[{name:'전자기학',terms:[{englishTerm:123}]}]}];
  for (const request of cases) {
    const response = await send(request); assert.equal(response.status, 400); assert.equal(typeof (await response.json()).error, 'string');
  }
  const badJson = await fetch(`${url}/api/analyze`, {method:'POST',headers:{'content-type':'application/json'},body:'{'});
  assert.equal(badJson.status,400);
  const tooLarge = await fetch(`${url}/api/analyze`, {method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(256*1024+1)});
  assert.equal(tooLarge.status,400);
});

test('invalid JSON, missing core fields and unknown auto notebook produce sanitized 502', async t => {
  const badOutputs = [output({englishDefinition:''}), output({notebookName:'없는 과목'}), output({exampleSentence:{bad:true}}), output({relatedTerms:'not an array'})];
  let index = 0;
  const {send} = await serverFor(t, {fetchImpl: async () => upstream(badOutputs[index++])});
  for (const ignored of badOutputs) {
    const response = await send(fixture()); assert.equal(response.status,502); assert.ok((await response.json()).error);
  }
});

test('upstream errors never leak keys or raw prompts; 429 is preserved without retry', async t => {
  let calls = 0;
  const {send} = await serverFor(t, {fetchImpl: async () => {calls++; return new Response('test-secret-never-print PRIVATE_PROMPT', {status:429});}});
  const response = await send(fixture());
  assert.equal(response.status,429); assert.equal(calls,1);
  const text = await response.text(); assert.ok(!text.includes('test-secret')); assert.ok(!text.includes('PRIVATE_PROMPT'));
});

test('network exceptions and non-JSON upstream responses return safe Korean errors', async t => {
  const {send} = await serverFor(t, {fetchImpl: async () => {throw new Error('test-secret-never-print PRIVATE_PROMPT');}});
  const response = await send(fixture()); assert.equal(response.status,502);
  assert.ok(!(await response.text()).includes('test-secret'));
  const {send: malformed} = await serverFor(t, {fetchImpl: async () => new Response('bad json', {status:200})});
  assert.equal((await malformed(fixture())).status,502);
});

test('timeout aborts one request and returns 504, with no fallback or retry', async t => {
  let calls = 0, signal;
  const {send} = await serverFor(t, {timeoutMs:20, fetchImpl: async (_, init) => {calls++; signal=init.signal; return new Promise(()=>{});}});
  const response = await send(fixture()); assert.equal(response.status,504);
  assert.match((await response.json()).error,/시간이 초과/); assert.equal(calls,1); assert.equal(signal.aborted,true);
});

test('missing server key returns 503 and unsupported routes or methods do not call Gemini', async t => {
  const {send,url} = await serverFor(t, {apiKey:'',fetchImpl:()=>assert.fail('must not call Gemini')});
  assert.equal((await send(fixture())).status,503);
  assert.equal((await fetch(`${url}/missing`)).status,404);
  assert.equal((await fetch(`${url}/api/analyze`)).status,405);
});

test('truncated or blocked generations are not accepted as completed analyses', async t => {
  const {send} = await serverFor(t, {fetchImpl: async () => new Response(JSON.stringify({
    candidates: [{finishReason:'MAX_TOKENS',content:{parts:[{text:JSON.stringify(output())}]}}]
  }),{status:200})});
  const response = await send(fixture());
  assert.equal(response.status,502);
  assert.match((await response.json()).error,/정상적으로 완료/);
});

test('server-local key file takes precedence over inherited key; blank file value never uses another key', async t => {
  const fs = require('node:fs/promises');
  const path = require('node:path');
  const os = require('node:os');
  const {readApiKey} = require('../server.cjs');
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'wordcollector-env-'));
  t.after(() => fs.rm(directory,{recursive:true,force:true}));
  const file = path.join(directory,'.env');
  assert.equal(readApiKey(file,{GEMINI_API_KEY:'inherited-fixture'}),'inherited-fixture');
  await fs.writeFile(file,'GEMINI_API_KEY=local-fixture\n');
  assert.equal(readApiKey(file,{GEMINI_API_KEY:'inherited-fixture'}),'local-fixture');
  await fs.writeFile(file,'GEMINI_API_KEY=\n');
  assert.equal(readApiKey(file,{GEMINI_API_KEY:'inherited-fixture'}),'');
});

test('일반 의미: the reference sentence is only translated; a general-meaning example is generated', async t => {
  const reference = 'The current through the resistor is 2 A.';
  const schemas = [];
  const {send} = await serverFor(t, {fetchImpl: async (_, init) => {
    const request = JSON.parse(init.body);
    const props = request.generationConfig.responseSchema.properties;
    schemas.push({example: Object.hasOwn(props, 'exampleSentence'), exampleKo: Object.hasOwn(props, 'exampleKo'),
      translation: Object.hasOwn(props, 'referenceTranslation')});
    return upstream(output({notebookName: '일반 단어장', relatedTerms: [], pos: '형용사, 명사',
      exampleSentence: 'Please check the current schedule.', exampleKo: '현재 일정을 확인해 주세요.',
      referenceTranslation: '저항을 흐르는 전류는 2A이다.'}));
  }});
  const base = {term: 'current', context: reference, autoCourse: false, course: '일반 단어장', translateReference: true,
    notebooks: [{course: '일반 단어장', words: []}]};
  const general = await (await send({...base, meaningMode: 'general'})).json();
  assert.equal(general.exampleEn, 'Please check the current schedule.');
  assert.equal(general.exampleKo, '현재 일정을 확인해 주세요.');
  assert.equal(general.exampleSource, undefined);
  assert.equal(general.referenceTranslation, '저항을 흐르는 전류는 2A이다.');
  const major = await (await send({...base, meaningMode: 'major', majorField: '전기공학'})).json();
  assert.equal(major.exampleEn, reference, 'major meaning: the reference becomes the example');
  assert.equal(major.exampleKo, '저항을 흐르는 전류는 2A이다.');
  assert.equal(major.exampleSource, 'reference');
  assert.deepEqual(schemas, [{example: true, exampleKo: true, translation: true}, {example: false, exampleKo: false, translation: true}]);
});

test('일반 의미 in v3+ apps (X-WC-Models): no example sentence, only word, meaning, POS and definitions', async t => {
  const seen = [];
  const {url} = await serverFor(t, {fetchImpl: async (_, init) => {
    const request = JSON.parse(init.body);
    const props = request.generationConfig.responseSchema.properties;
    seen.push({example: Object.hasOwn(props, 'exampleSentence') || Object.hasOwn(props, 'exampleKo'),
      noExample: JSON.parse(request.contents[0].parts[0].text).noExample === true,
      rule: /noExample=true이면 예문을 만들지 마세요/.test(request.systemInstruction.parts[0].text)});
    const {exampleSentence, ...rest} = output({notebookName: '일반 단어장', relatedTerms: [], pos: '형용사, 명사',
      koreanMeaning: '형용사: 현재의, 지금의 / 명사: 흐름, 해류', specialization: '일반',
      referenceTranslation: '저항을 흐르는 전류는 2A이다.'});
    return upstream(rest);
  }});
  for (const context of ['', 'The current through the resistor is 2 A.']) {
    const response = await fetch(`${url}/api/analyze`, {method: 'POST',
      headers: {'content-type': 'application/json', 'x-wc-models': 'gemini-4-hydrogen'},
      body: JSON.stringify({term: 'current', context, autoCourse: false, course: '일반 단어장', translateReference: Boolean(context),
        meaningMode: 'general', notebooks: [{course: '일반 단어장', words: []}]})});
    const json = await response.json();
    assert.equal(response.status, 200, JSON.stringify(json));
    assert.equal(json.exampleEn, '');
    assert.equal(json.exampleKo, '');
    assert.equal(json.exampleSource, 'none');
    assert.equal(json.ko, '형용사: 현재의, 지금의 / 명사: 흐름, 해류');
    assert.equal(json.discipline, '일반');
    assert.equal(json.referenceTranslation, context ? '저항을 흐르는 전류는 2A이다.' : undefined);
  }
  assert.deepEqual(seen, [{example: false, noExample: true, rule: true}, {example: false, noExample: true, rule: true}]);
});

test('apps accept a 일반 result without example; the card hides the example box; photos follow the analysed meaning', () => {
  const fs = require('node:fs');
  const api = fs.readFileSync('www/analysis-api.js', 'utf8');
  assert.match(api, /const noExample = result\?\.exampleSource === 'none';/);
  const app = fs.readFileSync('www/app.js', 'utf8');
  assert.match(app, /node\.parentElement\.hidden = noExample;/);
  assert.match(app, /subject:\(term\.discipline \|\| courseNames\(term\.course\)\[0\]\)\.slice\(0, 100\)/);
  assert.match(app, /definition:\(\[term\.enDef, term\.koDef\]\.filter\(Boolean\)\.join\(' \/ '\)/);
  const worker = fs.readFileSync('cloudflare/worker.mjs', 'utf8');
  assert.match(worker, /Show exactly the meaning given by the definition and the Korean meaning above, in that field; never another sense of the word\./);
  assert.match(worker, /If the field is 일반 \(everyday meaning\), show the first meaning listed as an everyday scene or object/);
  assert.doesNotMatch(worker, /educational visual for an engineering vocabulary flashcard/);
  assert.match(worker, /if \(input\.meaningMode === 'general' && request\.headers\.get\('X-WC-Models'\)\) input\.noExample = true;/);
});

test('legacy client accepts user-created empty notebooks in both manual and automatic selection', async t => {
  let calls=0;
  const {send}=await serverFor(t,{fetchImpl:async (_,init)=>{
    calls++;
    const request=JSON.parse(init.body);
    const auto=request.contents[0].parts[0].text.includes('"autoSubject":true');
    assert.deepEqual(request.generationConfig.responseSchema.properties.notebookName.enum,
      auto?['전력공학','반도체공정']:['반도체공정']);
    return upstream(output({notebookName:auto?'전력공학':'반도체공정',relatedTerms:[], pos:'noun', exampleKo:'변압기가 작동한다.'}));
  }});
  for(const autoCourse of [false,true]){
    const res=await send({
      term:'Transformer',context:'',autoCourse,course:'반도체공정',
      notebooks:[{course:'전력공학',words:[]},{course:'반도체공정',words:[]}]
    });
    const json=await res.json();
    assert.equal(res.status,200,JSON.stringify(json));
    assert.equal(json.course,autoCourse?'전력공학':'반도체공정');
    if(autoCourse){
      assert.equal(json.classification.reviewedCourses,2);
      assert.equal(json.classification.reviewedWords,0);
      assert.deepEqual(json.classification.relatedTerms,[]);
    }
  }
  assert.equal(calls,2);
});

test('automatic analysis with no notebooks names a new course in one request', async t => {
  let calls = 0;
  const {send} = await serverFor(t, {fetchImpl: async (_, init) => {
    calls++;
    const request = JSON.parse(init.body);
    assert.equal(request.generationConfig.responseSchema.properties.notebookName.enum, undefined);
    assert.match(request.systemInstruction.parts[0].text, /새 단어장 이름/);
    return upstream(output({notebookName:'전자기 유도', pos:'noun', exampleKo:'와전류가 도체를 가열한다.'}));
  }});
  const response = await send({term:'와전류',context:'자기장에 의해 생기는 전류',autoCourse:true,notebooks:[]});
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.course, '전자기 유도');
  assert.equal(data.classification.reviewedCourses, 0);
  assert.deepEqual(data.classification.relatedTerms, []);
  assert.equal(calls, 1);
});

test('new notebook names must stay within the UI length limit', async t => {
  const {send} = await serverFor(t, {fetchImpl: async () => upstream(output({notebookName:'가'.repeat(61),pos:'noun',exampleKo:'예문'}))});
  assert.equal((await send({term:'eddy current',context:'',autoCourse:true,notebooks:[]})).status,502);
});
