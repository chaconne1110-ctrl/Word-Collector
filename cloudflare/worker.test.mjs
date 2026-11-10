import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import worker, {todayKST} from './worker.mjs';

globalThis.crypto ??= webcrypto;
const token = 'wc_' + 'a'.repeat(64);
const baseUrl = 'https://word-collector-api.example.workers.dev';

async function tokenHash(value) {
  const digest = await crypto.subtle.digest(
    'SHA-256', new TextEncoder().encode(value)
  );
  return Buffer.from(digest).toString('hex');
}
function mockEnv({secret = 'dummy-not-real', live = false, rejectBatch = false} = {}) {
  const state = {calls: [], used: 0, batchCalls: 0, hash: null};
  const db = {
    prepare(sql) {
      const stmt = {
        args: [],
        bind(...args) { this.args = args; return this; },
        async first() {
          if (sql.includes('sqlite_master')) return {total: 3};
          if (sql.includes('FROM testers')) {
            return this.args[0] === state.hash
              ? {tester_id: 'owner-test-01', is_active: 1, expires_at: null}
              : null;
          }
          if (sql.includes('FROM tester_daily_usage')) return {request_count: state.used};
          throw new Error('Unexpected SQL');
        }
      };
      return stmt;
    },
    async batch(stmts) {
      state.batchCalls++;
      assert.equal(stmts.length, 2);
      if (rejectBatch) throw new Error('daily_limit_100');
      state.used++;
      return [
        {success: true, meta: {changes: 1}},
        {success: true, meta: {changes: 1}}
      ];
    }
  };
  return {
    state,
    env: {DB: db, GEMINI_API_KEY: secret,
      ...(live ? {ENABLE_LIVE_ANALYSIS:'true'} : {})}
  };
}

test('health is available without exposing secrets', async () => {
  const {env} = mockEnv();
  const res = await worker.fetch(new Request(baseUrl + '/health'), env);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.model, 'gemini-3.5-flash-lite');
  assert.equal(body.status, 'disabled-for-review');
  assert.equal(body.dailyLimitPerTester, 100);
  assert.equal(body.dailyGlobalLimit, 1500);
  assert.equal(body.imageGenerationEnabled, false);
  assert.equal(body.dailyImageLimitPerTester, 100);
  assert.equal(body.dailyImageGlobalLimit, 1500);
  assert.ok(!JSON.stringify(body).includes('dummy-not-real'));
});

test('analyze rejects unauthenticated requests without any reservation', async () => {
  const {env, state} = mockEnv();
  const res = await worker.fetch(new Request(baseUrl + '/api/analyze', {method:'POST'}), env);
  assert.equal(res.status, 401);
  assert.equal(state.batchCalls, 0);
});

test('authenticated usage read does not reserve a call', async () => {
  const {env, state} = mockEnv();
  state.hash = await tokenHash(token);
  const res = await worker.fetch(new Request(baseUrl + '/api/usage', {
    headers: {Authorization: 'Bearer ' + token}
  }), env);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.limit, 100);
  assert.equal(body.remaining, 100);
  assert.equal(state.batchCalls, 0);
});

test('authenticated analyze remains blocked until explicit enable', async () => {
  const {env, state} = mockEnv();
  state.hash = await tokenHash(token);
  const res = await worker.fetch(new Request(baseUrl + '/api/analyze', {
    method:'POST', headers:{Authorization:'Bearer ' + token}
  }), env);
  assert.equal(res.status, 503);
  assert.equal(state.batchCalls, 0);
});

test('quota test route is absent in production', async () => {
  const {env,state} = mockEnv();
  const res = await worker.fetch(new Request(baseUrl + '/internal/quota-test', {method:'POST'}),env);
  assert.equal(res.status,404); assert.equal(state.batchCalls,0);
});

test('D1 reservation rejection never calls Gemini', async () => {
  const {env,state}=mockEnv({live:true,rejectBatch:true});
  state.hash=await tokenHash(token);
  const previous=globalThis.fetch;
  globalThis.fetch=()=>assert.fail('Gemini must not be called');
  try {
    const res=await worker.fetch(new Request(baseUrl+'/api/analyze',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({term:'전압',course:'회로이론',autoCourse:false})}),env);
    assert.equal(res.status,429); assert.equal(state.used,0);
  } finally {globalThis.fetch=previous;}
});

test('legacy Transformer analyze generates real-format response with mock Gemini', async () => {
  const {env, state} = mockEnv({live: true});
  state.hash = await tokenHash(token);
  const originalFetch = globalThis.fetch;
  const mockGeminiOutput = {
    englishTerm: 'Transformer',
    koreanMeaning: '변압기',
    specialization: '전기공학',
    notebookName: '전기기기',
    englishDefinition: 'A device that transfers electrical energy by electromagnetic induction.',
    koreanDefinition: '전자기 유도로 전기 에너지를 전달하는 장치.',
    exampleSentence: 'The transformer reduces AC voltage.',
    explanation: '교류 전압을 조정합니다.',
    recommendationReason: '선택 단어장과 참고 문장을 고려했습니다.',
    relatedTerms: [],
    pos: 'noun',
    exampleKo: '그 변압기는 교류 전압을 낮춥니다.'
  };
  try {
    globalThis.fetch = async (url, opts) => {
      assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
      assert.equal(opts.method, 'POST');
      assert.equal(opts.redirect, 'manual'); // Workers do not implement redirect: error
      assert.equal(opts.headers['x-goog-api-key'], 'dummy-not-real');
      return new Response(JSON.stringify({
        candidates: [{finishReason:'STOP', content: {parts: [{text: JSON.stringify(mockGeminiOutput)}]}}]
      }), {status: 200, headers:{'Content-Type':'application/json'}});
    };
    const payload = {
      term: 'Transformer',
      context: 'The transformer steps down AC voltage in an electrical power system.',
      autoCourse: false,
      course: '전기기기'
    };
    const res = await worker.fetch(new Request(baseUrl + '/api/analyze', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type':'application/json'
      },
      body: JSON.stringify(payload)
    }), env);
    const body = await res.json();
    assert.equal(res.status, 200, JSON.stringify(body));
    assert.equal(body.model, 'gemini-3.5-flash-lite');
    assert.equal(body.course, '전기기기');
    assert.equal(body.en, 'Transformer');
    assert.equal(state.used, 1);
    assert.equal(state.batchCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('quota date changes exactly at Korean midnight', () => {
 const original=Date.now;
 try {
  Date.now=()=>Date.parse('2026-11-10T14:59:59.999Z');assert.equal(todayKST(),'2026-11-10');
  Date.now=()=>Date.parse('2026-11-10T15:00:00.000Z');assert.equal(todayKST(),'2026-11-11');
 } finally {Date.now=original;}
});

test('CORS preflight has a fixed origin allowlist and never reserves usage', async () => {
 const {env,state}=mockEnv();
 const good=await worker.fetch(new Request(baseUrl+'/api/analyze',{method:'OPTIONS',headers:{Origin:'http://127.0.0.1:8000'}}),env);
 assert.equal(good.status,204);assert.equal(good.headers.get('Access-Control-Allow-Origin'),'http://127.0.0.1:8000');
 const bad=await worker.fetch(new Request(baseUrl+'/api/analyze',{method:'POST',headers:{Origin:'https://untrusted.example'}}),env);
 assert.equal(bad.status,403);assert.equal(bad.headers.get('Access-Control-Allow-Origin'),null);assert.equal(state.batchCalls,0);
});

test('Gemini failures are sanitized and never retried or switched', async () => {
  const {env,state}=mockEnv({live:true}); state.hash=await tokenHash(token);
  const original=globalThis.fetch;
  try {
    for (const mode of ['network','redirect','limited','upstream','json']) {
      let calls=0;
      globalThis.fetch=async url=>{
        calls++; assert.match(url,/gemini-3\.5-flash-lite:generateContent$/);
        if(mode==='network') throw new TypeError('private-upstream-detail');
        if(mode==='redirect') return new Response('private-upstream-detail',{status:302,headers:{Location:'https://untrusted.example'}});
        if(mode==='limited') return new Response('private-upstream-detail',{status:429});
        if(mode==='upstream') return new Response('private-upstream-detail',{status:503});
        return new Response('private-upstream-detail');
      };
      const res=await worker.fetch(new Request(baseUrl+'/api/analyze',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({term:'와전류',course:'전자기학',autoCourse:false})}),env);
      assert.equal(res.status,mode==='limited'?429:502);assert.equal(calls,1);
      const body=await res.text();assert.ok(!body.includes('private-upstream-detail'));assert.ok(!body.includes(token));assert.ok(!body.includes(env.GEMINI_API_KEY));
    }
  } finally {globalThis.fetch=original;}
});


test('admin metadata check is authenticated, read-only, and does not call generateContent', async () => {
  const {env, state} = mockEnv({live: true});
  state.hash = await tokenHash(token);
  const old = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async (url, options) => {
      calls++;
      assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite');
      assert.equal(options.method, 'GET');
      assert.equal(options.redirect, 'manual');
      assert.equal(options.headers['x-goog-api-key'], env.GEMINI_API_KEY);
      assert.equal(options.body, undefined);
      return new Response(JSON.stringify({
        name:'models/gemini-3.5-flash-lite',
        supportedGenerationMethods:['generateContent']
      }), {status:200,headers:{'Content-Type':'application/json'}});
    };
    const res = await worker.fetch(new Request(baseUrl + '/internal/model-status',{
      headers:{Authorization:'Bearer '+token}
    }),env);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.upstreamHttpStatus, 200);
    assert.equal(body.generateContentSupported, true);
    assert.equal(state.batchCalls, 0);
    assert.equal(calls, 1);
    assert.ok(!JSON.stringify(body).includes(env.GEMINI_API_KEY));
  } finally { globalThis.fetch = old; }
});

test('admin model status exposes only safe upstream status code for upstream failures', async () => {
  const {env, state} = mockEnv({live: true});
  state.hash = await tokenHash(token);
  const old = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('PRIVATE_API_KEY_OR_ERROR_BODY',{status:403});
    const res = await worker.fetch(new Request(baseUrl+'/internal/model-status',{
      headers:{Authorization:'Bearer '+token}
    }),env);
    const body = await res.json();
    assert.equal(res.status,200);
    assert.equal(body.upstreamHttpStatus,403);
    assert.equal(body.available,false);
    assert.match(body.keyFingerprint,/^[a-f0-9]{16}$/);
    assert.equal(body.googleStatus,'UNKNOWN');
    assert.equal(body.category,'OTHER');
    assert.equal(state.batchCalls,0);
    assert.ok(!JSON.stringify(body).includes('PRIVATE_API_KEY_OR_ERROR_BODY'));
  } finally { globalThis.fetch = old; }
});


test('owner model diagnostic categorizes Google 400 location error without sensitive text', async () => {
  const {env,state}=mockEnv({live:true});
  state.hash=await tokenHash(token);
  const oldFetch=globalThis.fetch;
  const upstreamText='User location is not supported for the API use.';
  try {
    globalThis.fetch=async () => new Response(JSON.stringify({
      error:{code:400,status:'FAILED_PRECONDITION',message:upstreamText}
    }),{status:400,headers:{'Content-Type':'application/json'}});
    const res=await worker.fetch(new Request(baseUrl+'/internal/model-status',{
      headers:{Authorization:'Bearer '+token}
    }),env);
    const result=await res.json();
    assert.equal(result.upstreamHttpStatus,400);
    assert.equal(result.googleStatus,'FAILED_PRECONDITION');
    assert.equal(result.category,'REGION_UNSUPPORTED');
    assert.match(result.keyFingerprint,/^[a-f0-9]{16}$/);
    assert.ok(!JSON.stringify(result).includes(upstreamText));
    assert.ok(!JSON.stringify(result).includes(env.GEMINI_API_KEY));
    assert.equal(state.batchCalls,0);
  } finally {globalThis.fetch=oldFetch;}
});

test('published GitHub Pages origin may preflight but still requires bearer authentication', async () => {
 const {env,state}=mockEnv({live:true});
 const origin='https://chaconne1110-ctrl.github.io';
 const preflight=await worker.fetch(new Request(baseUrl+'/api/analyze',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}}),env);
 assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),origin);
 assert.match(preflight.headers.get('Access-Control-Allow-Headers'),/Authorization/);
 const denied=await worker.fetch(new Request(baseUrl+'/api/analyze',{method:'POST',headers:{Origin:origin}}),env);
 assert.equal(denied.status,401);assert.equal(denied.headers.get('Access-Control-Allow-Origin'),origin);assert.equal(state.batchCalls,0);
 const other=await worker.fetch(new Request(baseUrl+'/api/analyze',{method:'OPTIONS',headers:{Origin:'https://other.github.io'}}),env);
 assert.equal(other.status,403);
});

test('empty custom notebooks allow both user-selected save and provisional AI classification', async () => {
  const {env,state} = mockEnv({live:true});
  state.hash=await tokenHash(token);
  const beforeFetch=globalThis.fetch;
  const names=['새 전기공학','새 반도체'];
  const calls=[];
  globalThis.fetch=async (_,init)=>{
    const body=JSON.parse(init.body);
    calls.push(body);
    const isAuto=JSON.parse(body.contents[0].parts[0].text).autoSubject;
    assert.deepEqual(body.generationConfig.responseSchema.properties.notebookName.enum,
      isAuto?names:[names[1]]);
    const generated={
      englishTerm:'Transformer',koreanMeaning:'변압기',specialization:'전기공학',
      notebookName:isAuto?names[0]:names[1],englishDefinition:'Transfers electrical energy.',
      koreanDefinition:'전력을 전달한다.',exampleSentence:'The transformer works.',
      explanation:'전기 기기입니다.',recommendationReason:'임시 분류',
      relatedTerms:[],pos:'noun',exampleKo:'변압기가 작동한다.'
    };
    return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(generated)}]}}]}),{status:200});
  };
  try {
    for(const autoCourse of [false,true]){
      const request={term:'Transformer',autoCourse,course:names[1],
        notebooks:names.map(course=>({course,words:[]}))};
      const res=await worker.fetch(new Request(baseUrl+'/api/analyze',{
        method:'POST',
        headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify(request)
      }),env);
      const body=await res.json();
      assert.equal(res.status,200,JSON.stringify(body));
      assert.equal(body.course,autoCourse?names[0]:names[1]);
      if(autoCourse){
        assert.equal(body.classification.reviewedCourses,2);
        assert.equal(body.classification.reviewedWords,0);
        assert.deepEqual(body.classification.relatedTerms,[]);
        assert.match(body.classification.reason,/임시 추천/);
      }else assert.equal(Object.hasOwn(body,'classification'),false);
    }
    assert.equal(calls.length,2);
    assert.equal(state.used,2);
  }finally {globalThis.fetch=beforeFetch;}
});
