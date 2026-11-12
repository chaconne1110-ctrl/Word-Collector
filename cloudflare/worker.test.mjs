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
  const state = {calls: [], used: 0, imageUsed:0, extraUsed:0, extraImageUsed:0, batchCalls: 0, hash: null,
    anonRows: new Set(), anonActive: true};
  const db = {
    prepare(sql) {
      const stmt = {
        sql,
        args: [],
        bind(...args) { this.args = args; return this; },
        async first() {
          if (sql.includes('sqlite_master')) return {total: 3};
          if (sql.includes('FROM testers WHERE tester_id')) {
            return state.anonRows.has(this.args[0])
              ? {tester_id: this.args[0], is_active: state.anonActive ? 1 : 0} : null;
          }
          if (sql.includes('FROM testers')) {
            return this.args[0] === state.hash
              ? {tester_id: 'owner-test-01', is_active: 1, expires_at: null}
              : null;
          }
          if (sql.includes('FROM tester_daily_usage_extra')) return {request_count: state.extraUsed};
          if (sql.includes('FROM tester_daily_usage')) return {request_count: state.used};
          if (sql.includes('FROM tester_daily_image_usage_extra')) return {request_count: state.extraImageUsed};
          if (sql.includes('FROM tester_daily_image_usage')) return {request_count: state.imageUsed};
          throw new Error('Unexpected SQL');
        },
        async run() {
          if (sql.includes('INSERT OR IGNORE INTO testers')) {
            assert.match(this.args[0], /^anon-[a-f0-9]{32}$/);
            assert.equal(this.args[1], 'anon:' + this.args[0]);
            state.anonRows.add(this.args[0]);
            return {success: true};
          }
          throw new Error('Unexpected SQL');
        }
      };
      return stmt;
    },
    async batch(stmts) {
      state.batchCalls++;
      assert.equal(stmts.length, 2);
      if (rejectBatch) throw new Error('global_limit_1500');
      if (stmts[0].sql.includes('tester_daily_usage_extra')) {
        if (state.extraUsed >= 100) throw new Error('daily_extra_limit_100');
        state.extraUsed++;
      } else {
        if (state.used >= 100) throw new Error('daily_limit_100');
        state.used++;
      }
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
  assert.equal(body.dailyLimitPerTester, 200);
  assert.equal(body.dailyCombinedApiLimitPerTester, 400);
  assert.equal(body.dailyGlobalLimit, 1500);
  assert.equal(body.imageGenerationEnabled, false);
  assert.equal(body.dailyImageLimitPerTester, 200);
  assert.equal(body.dailyImageGlobalLimit, 1500);
  assert.ok(!JSON.stringify(body).includes('dummy-not-real'));
});

test('analyze without a code or client IP is rejected without any reservation', async () => {
  const {env, state} = mockEnv();
  const res = await worker.fetch(new Request(baseUrl + '/api/analyze', {method:'POST'}), env);
  assert.equal(res.status, 401);
  assert.equal(state.batchCalls, 0);
});

test('public analysis without a tester code uses a per-device bucket', async () => {
  const {env, state} = mockEnv({live:true});
  const oldFetch = globalThis.fetch;
  let geminiCalls = 0;
  globalThis.fetch = async () => { geminiCalls++; throw new Error('stop after quota'); };
  const send = device => worker.fetch(new Request(baseUrl + '/api/analyze', {
    method:'POST', headers:{'CF-Connecting-IP':'203.0.113.7','X-WC-Device':device,'Content-Type':'application/json'},
    body: JSON.stringify({term:'전압', course:'회로이론', autoCourse:false})
  }), env);
  try {
    assert.notEqual((await send('wd_' + '1'.repeat(64))).status, 401);
    assert.notEqual((await send('wd_' + '2'.repeat(64))).status, 401);
    assert.equal(state.anonRows.size, 2, 'same IP, different installs -> separate buckets');
    assert.equal(state.batchCalls, 2);
    assert.equal(geminiCalls, 2);
  } finally { globalThis.fetch = oldFetch; }
});

test('public users get the full tester quota (200 analysis) then stop before Gemini', async () => {
  const {env, state} = mockEnv({live:true});
  state.used = 100; state.extraUsed = 100;
  const res = await worker.fetch(new Request(baseUrl + '/api/analyze', {
    method:'POST', headers:{'X-WC-Device':'wd_' + '1'.repeat(64),'Content-Type':'application/json'},
    body: JSON.stringify({term:'전압', course:'회로이론', autoCourse:false})
  }), env);
  assert.equal(res.status, 429);
});

test('public usage reports 400/day; invalid codes and blocked devices are rejected', async () => {
  const {env, state} = mockEnv({live:true});
  const dev = {'X-WC-Device':'wd_' + '1'.repeat(64),'Content-Type':'application/json'};
  const usage = await worker.fetch(new Request(baseUrl + '/api/usage', {headers:dev}), env);
  assert.equal(usage.status, 200);
  const body = await usage.json();
  assert.equal(body.anonymous, true);
  assert.equal(body.limit, 400);
  assert.equal(body.analysis.limit, 200);
  assert.equal(body.image.limit, 200);
  const bad = await worker.fetch(new Request(baseUrl + '/api/analyze', {
    method:'POST', headers:{...dev, Authorization:'Bearer wc_' + 'b'.repeat(64)}, body:'{}'
  }), env);
  assert.equal(bad.status, 401);
  state.anonActive = false;
  const blocked = await worker.fetch(new Request(baseUrl + '/api/analyze', {method:'POST', headers:dev, body:'{}'}), env);
  assert.equal(blocked.status, 401);
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
  assert.equal(body.limit, 400);
  assert.equal(body.remaining, 400);
  assert.equal(body.analysis.limit, 200);
  assert.equal(body.image.limit, 200);
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

test('analysis requests 101-200 use additive overflow and 201 returns 429',async()=>{
  const {env,state}=mockEnv({live:true});
  state.hash=await tokenHash(token);
  state.used=100;
  const original=globalThis.fetch; let calls=0;
  const mocked={
    englishTerm:'Voltage',koreanMeaning:'전압',specialization:'전기공학',notebookName:'전기기기',
    englishDefinition:'Electric potential difference',koreanDefinition:'전위차',
    exampleSentence:'Voltage rises.', explanation:'설명',recommendationReason:'직접 선택',relatedTerms:[],
    pos:'noun',exampleKo:'전압이 상승한다.'
  };
  globalThis.fetch=async()=>{
    calls++;
    return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(mocked)}]}}]}),{status:200});
  };
  const send=()=>worker.fetch(new Request(baseUrl+'/api/analyze',{method:'POST',headers:{
    Authorization:'Bearer '+token,'Content-Type':'application/json'
  },body:JSON.stringify({term:'전압',course:'전기기기',autoCourse:false})}),env);
  try {
    let result=await send();
    assert.equal(result.status,200,await result.text());
    assert.equal(state.used,100);
    assert.equal(state.extraUsed,1);
    assert.equal(calls,1);
    state.extraUsed=99;
    result=await send();
    assert.equal(result.status,200,await result.text());
    assert.equal(state.extraUsed,100);
    result=await send();
    assert.equal(result.status,429);
    assert.equal(calls,2);
    const usageRes=await worker.fetch(new Request(baseUrl+'/api/usage',{headers:{Authorization:'Bearer '+token}}),env);
    const usageBody=await usageRes.json();
    assert.equal(usageBody.analysis.used,200);
    assert.equal(usageBody.analysis.remaining,0);
    assert.equal(usageBody.limit,400);
  }finally {globalThis.fetch=original;}
});

test('empty notebook auto analysis proposes a new name with one authorized Gemini call', async () => {
  const {env, state} = mockEnv({live:true});
  state.hash = await tokenHash(token);
  const previous = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async (_, options) => {
      calls++;
      const payload = JSON.parse(options.body);
      assert.equal(payload.generationConfig.responseSchema.properties.notebookName.enum, undefined);
      assert.deepEqual(JSON.parse(payload.contents[0].parts[0].text).notebooks, []);
      return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({englishTerm:'Transformer',koreanMeaning:'변압기',specialization:'전기공학',notebookName:'전력 변환',englishDefinition:'An electrical device.',koreanDefinition:'전기 장치.',exampleSentence:'A transformer changes voltage.',explanation:'전압 변환',recommendationReason:'전력 분야',relatedTerms:['invented'],pos:'noun',exampleKo:'변압기가 전압을 바꾼다.'})}]}}]}));
    };
    const response = await worker.fetch(new Request(baseUrl+'/api/analyze',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({term:'Transformer',context:'AC voltage',autoCourse:true,notebooks:[]})}),env);
    const result = await response.json();
    assert.equal(response.status,200,JSON.stringify(result));
    assert.equal(result.course,'전력 변환');
    assert.equal(result.classification.reviewedCourses,0);
    assert.deepEqual(result.classification.relatedTerms,[]);
    assert.equal(calls,1);
    assert.equal(state.batchCalls,1);
  } finally { globalThis.fetch = previous; }
});
