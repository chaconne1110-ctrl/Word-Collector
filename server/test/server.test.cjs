'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {once} = require('node:events');
const {createServer, MODEL} = require('../server.cjs');

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

test('health identifies the fixed model without calling Gemini or exposing key', async t => {
  const {url} = await serverFor(t, {fetchImpl: () => assert.fail('health must not call Gemini')});
  const response = await fetch(`${url}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {ok: true, model: 'gemini-3.5-flash-lite'});
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
  assert.equal(response.status, 200); assert.equal(calls, 1); assert.equal(data.model, MODEL);
  assert.equal(data.analysis.notebookName, '전자기학');
  assert.deepEqual(data.analysis.relatedTerms, ['eddy current']);
  assert.deepEqual(JSON.parse(sent.contents[0].parts[0].text), request);
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
    {...fixture(),autoSubject:false,selectedSubject:'없는 과목'}, {...fixture(),notebooks:[]},
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
