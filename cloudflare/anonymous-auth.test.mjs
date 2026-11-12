import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import worker from './worker.mjs';
globalThis.crypto ??= webcrypto;

const base = 'https://word-collector-api.example.workers.dev';
const origin = 'https://chaconne1110-ctrl.github.io';
const ip = '203.0.113.23';
const hash = async value => Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('hex');
const makeRequest = (pathname, opts = {}) => new Request(base+pathname,{...opts,
  headers:{Origin:origin,...(opts.headers||{})}});

function fakeEnv() {
  const state = {registrations:0, clients:new Map(), tokenHashes:new Map(),
    ipUsed:0, analysisUsed:0,imageUsed:0,analysisExtra:0,imageExtra:0,
    globalUsed:0,globalImageUsed:0,batches:[], authQueries:0};
  const DB = {
    prepare(sql) {
      return {
        sql,params:[],
        bind(...args){this.params=args;return this;},
        async first(){
          if(sql.includes('FROM testers')) {
            const id=state.tokenHashes.get(this.params[0]);
            return id ? {tester_id:id,is_active:1,expires_at:null} : null;
          }
          if(sql.includes('FROM anonymous_clients')) {
            state.authQueries++;
            const ipHash = state.clients.get(this.params[0]);
            return ipHash ? {registration_ip_hash:ipHash}:null;
          }
          if(sql.includes('FROM tester_daily_usage_extra')) return {request_count:state.analysisExtra};
          if(sql.includes('FROM tester_daily_image_usage_extra')) return {request_count:state.imageExtra};
          if(sql.includes('FROM tester_daily_usage')) return {request_count:state.analysisUsed};
          if(sql.includes('FROM tester_daily_image_usage')) return {request_count:state.imageUsed};
          if(sql.includes('sqlite_master')) return {total:3};
          throw new Error('Unexpected SQL first: '+sql);
        }
      };
    },
    async batch(commands) {
      state.batches.push(commands);
      if(commands[0].sql.includes('anonymous_auth_registrations')) {
        assert.equal(commands.length,3);
        if(state.registrations>=2) throw new Error('anonymous_registration_limit_2');
        state.registrations++;
        const [id,digest] = commands[1].params;
        state.tokenHashes.set(digest,id);
        state.clients.set(id,commands[2].params[1]);
        return commands.map(()=>({success:true,meta:{changes:1}}));
      }
      assert.equal(commands.length,3);
      assert.match(commands[2].sql,/anonymous_ip_daily_usage/);
      // Simulates D1's atomic rollback on quota-trigger errors.
      if(state.ipUsed>=400) throw new Error('anonymous_ip_limit_400');
      let kind;
      if(commands[0].sql.includes('tester_daily_image_usage_extra')) kind='imageExtra';
      else if(commands[0].sql.includes('tester_daily_image_usage')) kind='imageUsed';
      else if(commands[0].sql.includes('tester_daily_usage_extra')) kind='analysisExtra';
      else kind='analysisUsed';
      if((kind==='analysisUsed' && state.analysisUsed>=100) ||
         (kind==='imageUsed' && state.imageUsed>=100)) {
        throw new Error(kind==='analysisUsed'?'daily_limit_100':'image_limit_100');
      }
      if((kind==='analysisExtra' && state.analysisExtra>=100) ||
         (kind==='imageExtra' && state.imageExtra>=100)) throw new Error('daily_extra_limit_100');
      state[kind]++;
      state.ipUsed++;
      if(kind.startsWith('image')) state.globalImageUsed++; else state.globalUsed++;
      return commands.map(()=>({success:true,meta:{changes:1}}));
    }
  };
  return {state,env:{
    DB,GEMINI_API_KEY:'not-real-key',AUTO_AUTH_ENABLED:'true',
    AUTO_AUTH_IP_SECRET:'this-is-a-very-long-32-character-test-secret',
    TURNSTILE_SECRET:'not-a-real-turnstile-secret',TURNSTILE_SITE_KEY:'not-a-real-site-key',
    ENABLE_LIVE_ANALYSIS:'true',ENABLE_IMAGE_GENERATION:'true'
  }};
}
function enrollmentRequest(challenge='test-captcha') {
  return makeRequest('/api/auth/anonymous',{
    method:'POST',headers:{'CF-Connecting-IP':ip,'Content-Type':'application/json'},
    body:JSON.stringify({turnstileToken:challenge})
  });
}
function withMockFetch(callback) {
  const prev=globalThis.fetch;
  globalThis.fetch=async (url,init) => {
    if(String(url).includes('/siteverify')) {
      const secret=init.body.get('secret');
      assert.equal(secret,'not-a-real-turnstile-secret');
      assert.equal(init.body.get('remoteip'),ip);
      return Response.json({success:true,hostname:'chaconne1110-ctrl.github.io',action:'wordcollector-auth'});
    }
    return callback(url,init);
  };
  return () => {globalThis.fetch=prev;};
}
const analysisOutput={
  englishTerm:'Voltage', koreanMeaning:'전압', specialization:'전기공학', notebookName:'전기공학',
  englishDefinition:'Electric potential difference.', koreanDefinition:'전위 차.',
  exampleSentence:'Voltage is measured in volts.', explanation:'정의', recommendationReason:'선택',
  relatedTerms:[],pos:'noun',exampleKo:'전압은 볼트로 측정된다.'
};
const analysisRequest = token => makeRequest('/api/analyze',{
  method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify({term:'Voltage',course:'전기공학',autoCourse:false,
    notebooks:[{course:'전기공학',words:[]}]})
});
const photoRequest = token => makeRequest('/api/image',{
  method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify({word:'Voltage',koreanMeaning:'전압',subject:'전기공학',definition:'전위 차.'})
});

test('anonymous enrollment is disabled by default and never exposes secrets',async()=>{
  const {env}=fakeEnv();
  delete env.AUTO_AUTH_ENABLED;
  const config=await worker.fetch(makeRequest('/api/auth/config'),env);
  assert.deepEqual(await config.json(),{enabled:false});
  const blocked=await worker.fetch(enrollmentRequest(),env);
  assert.equal(blocked.status,503);
});

test('anonymous enrollment requires allowed origin, valid captcha, and Cloudflare IP',async()=>{
  const {env,state}=fakeEnv();
  let called=0;
  const prev=globalThis.fetch;
  globalThis.fetch=async()=>{called++;return Response.json({success:false});};
  try {
    const wrong=await worker.fetch(new Request(base+'/api/auth/anonymous',{
      method:'POST',headers:{Origin:'https://attacker.example','CF-Connecting-IP':ip,
        'Content-Type':'application/json'},body:JSON.stringify({turnstileToken:'token'})}),env);
    assert.equal(wrong.status,403);
    const bad=await worker.fetch(enrollmentRequest(),env);
    assert.equal(bad.status,403);
    const noIP=await worker.fetch(makeRequest('/api/auth/anonymous',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({turnstileToken:'token'})}),env);
    assert.equal(noIP.status,403);
    assert.equal(state.registrations,0);
    assert.equal(called,1);
  }finally{globalThis.fetch=prev;}
});

test('new random tokens are hashed in D1, capped at two enrollments per IP per day',async()=>{
  const {env,state}=fakeEnv();
  const restore=withMockFetch(()=>{throw new Error('no Gemini calls on enrollment');});
  try {
    const config=await worker.fetch(makeRequest('/api/auth/config'),env);
    assert.equal((await config.json()).enabled,true);
    const r1=await worker.fetch(enrollmentRequest(),env);assert.equal(r1.status,200);
    const a=await r1.json();
    assert.match(a.token,/^wc_[a-f0-9]{64}$/);
    assert.equal(state.tokenHashes.has(await hash(a.token)),true);
    assert.equal(JSON.stringify(state).includes(a.token),false);
    const r2=await worker.fetch(enrollmentRequest(),env);assert.equal(r2.status,200);
    const b=await r2.json();assert.notEqual(a.token,b.token);
    const third=await worker.fetch(enrollmentRequest(),env);
    assert.equal(third.status,429);
    assert.equal(state.registrations,2);
  }finally{restore();}
});

test('anonymous usage debits both model-specific and shared IP limits atomically',async()=>{
  const {env,state}=fakeEnv();
  let gemini=0,image=0;
  const restore=withMockFetch((url,init)=>{
    if(String(url).includes('gemini-3.5-flash-lite')) {
      gemini++;
      return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(analysisOutput)}]}}]});
    }
    if(String(url).includes('gemini-3.1-flash-lite-image')) {
      image++;
      return Response.json({candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',
        data:Buffer.alloc(150,1).toString('base64')}}]}}]});
    }
    throw new Error('unexpected upstream '+url);
  });
  try {
    const auth=await worker.fetch(enrollmentRequest(),env);
    const {token}=await auth.json();
    const normal=await worker.fetch(analysisRequest(token),env);
    assert.equal(normal.status,200,await normal.clone().text());
    assert.equal(state.ipUsed,1);assert.equal(gemini,1);
    const photo=await worker.fetch(photoRequest(token),env);
    assert.equal(photo.status,200,await photo.clone().text());
    assert.equal(state.ipUsed,2);assert.equal(image,1);
    // A newly registered identity on the same IP cannot reset the shared quota.
    state.ipUsed=400;
    const failed=await worker.fetch(analysisRequest(token),env);
    assert.equal(failed.status,429);assert.equal(gemini,1);
    const failedPhoto=await worker.fetch(photoRequest(token),env);
    assert.equal(failedPhoto.status,429);assert.equal(image,1);
    assert.equal(state.ipUsed,400);
    assert.ok(state.batches.filter(x=>x[0].sql.includes('daily_usage')).every(x=>x.length===3));
  }finally{restore();}
});
