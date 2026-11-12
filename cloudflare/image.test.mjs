import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import worker from './worker.mjs';

globalThis.crypto ??= webcrypto;
const token = 'wc_' + 'b'.repeat(64);
const base = 'https://word-collector-api.example.workers.dev';
async function sha(text) {
  return Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))).toString('hex');
}
async function fixture({photoEnabled = false, quotaError = null} = {}) {
  let batches = 0;
  const expected = await sha(token);
  const DB = {
    prepare(sql) {
      return {
        sql, params:[],
        bind(...params) {this.params = params; return this;},
        async first() {
          if (this.sql.includes('FROM testers')) return this.params[0] === expected
            ? {tester_id:'owner-test-01',is_active:1,expires_at:null} : null;
          if (this.sql.includes('sqlite_master')) return {total:3};
          if (this.sql.includes('FROM tester_daily_usage_extra')) return {request_count:0};
          if (this.sql.includes('FROM tester_daily_image_usage_extra')) return {request_count:0};
          throw new Error('Unexpected SQL: ' + this.sql);
        }
      };
    },
    async batch(commands) {
      batches++;
      assert.equal(commands.length, 2);
      assert.match(commands[0].sql, /tester_daily_image_usage/);
      assert.match(commands[1].sql, /global_daily_image_usage/);
      if (quotaError) throw new Error(quotaError);
      return commands.map(() => ({success:true,meta:{changes:1}}));
    }
  };
  return {
    env:{DB,GEMINI_API_KEY:'test-api-key-not-real',ENABLE_LIVE_ANALYSIS:'true',
      ...(photoEnabled ? {ENABLE_IMAGE_GENERATION:'true'} : {})},
    used:()=>batches
  };
}
function request(tokenValue=token, data={word:'Transformer', koreanMeaning:'변압기',
  subject:'전기기기',definition:'전자기 유도를 통해 교류 전압을 변환하는 장치.'}) {
  return new Request(base+'/api/image',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+tokenValue},
    body:JSON.stringify(data)
  });
}
test('unauthenticated photo calls are rejected without quota reservation', async()=>{
  const f=await fixture({photoEnabled:true});
  const res=await worker.fetch(request('wc_'+'c'.repeat(64)),f.env);
  assert.equal(res.status,401);assert.equal(f.used(),0);
});
test('image-generation opt-in gate is disabled by default',async()=>{
  const f=await fixture();
  const res=await worker.fetch(request(),f.env);
  assert.equal(res.status,503);assert.equal(f.used(),0);
});
test('invalid photo input is rejected before charging any photo quota',async()=>{
  const f=await fixture({photoEnabled:true});
  const res=await worker.fetch(request(token,{word:'',koreanMeaning:'',subject:'',definition:''}),f.env);
  assert.equal(res.status,400);assert.equal(f.used(),0);
});
test('image quota DB trigger blocks billable upstream fetch',async()=>{
  const f=await fixture({photoEnabled:true,quotaError:'image_global_limit_1500'});
  const res=await worker.fetch(request(),f.env);
  assert.equal(res.status,429);assert.equal(f.used(),1);
});
test('successful photo generation returns only validated original image bytes',async()=>{
  const f=await fixture({photoEnabled:true});
  const priorFetch=globalThis.fetch;
  let called=0;
  globalThis.fetch=async (url,options)=>{
    called++;
    assert.match(url,/gemini-3.1-flash-lite-image:generateContent$/);
    assert.equal(options.headers['x-goog-api-key'],'test-api-key-not-real');
    const body=JSON.parse(options.body);
    assert.deepEqual(body.generationConfig.responseModalities,['IMAGE']);
    assert.equal(body.generationConfig.imageConfig.aspectRatio,'1:1');
    assert.equal(body.generationConfig.imageConfig.imageSize,'1K');
    assert.ok(!Object.hasOwn(body.generationConfig,'responseFormat'));
    return new Response(JSON.stringify({candidates:[{content:{parts:[{
      inlineData:{mimeType:'image/png',data:Buffer.alloc(150,42).toString('base64')}
    }]}}]}),{status:200});
  };
  try {
    const res=await worker.fetch(request(),f.env);
    const body=await res.json();
    assert.equal(res.status,200);
    assert.equal(body.model,'gemini-3.1-flash-lite-image');
    assert.equal(body.image.mimeType,'image/png');
    assert.equal(body.image.data,Buffer.alloc(150,42).toString('base64'));
    assert.equal(f.used(),1);assert.equal(called,1);
    assert.ok(!JSON.stringify(body).includes('test-api-key-not-real'));
  } finally {globalThis.fetch=priorFetch;}
});
test('upstream photo failure is reported without exposing provider details',async()=>{
  const f=await fixture({photoEnabled:true});
  const priorFetch=globalThis.fetch;
  globalThis.fetch=async()=>new Response('API key and request details hidden',{status:402});
  try {
    const res=await worker.fetch(request(),f.env);
    assert.equal(res.status,502);
    const body=await res.json();
    assert.match(body.error,/IMAGE_UPSTREAM_HTTP_402/);
    assert.ok(!JSON.stringify(body).includes('API key and request'));
    assert.equal(f.used(),1);
  }finally{globalThis.fetch=priorFetch;}
});

test('new image calls use overflow quota 101-200 and enforce maximum', async()=>{
  let current=100, extra=0, geminiCalls=0, batchCalls=0;
  const expected=await sha(token);
  const DB={
    prepare(sql) {return {sql,bind(...params){this.params=params;return this;},async first() {
      if(sql.includes('FROM testers')) return {tester_id:'owner-test-01',is_active:1,expires_at:null};
      if(sql.includes('FROM tester_daily_image_usage_extra')) return {request_count:extra};
      if(sql.includes('FROM tester_daily_image_usage')) return {request_count:current};
      if(sql.includes('FROM tester_daily_usage_extra')) return {request_count:0};
      if(sql.includes('FROM tester_daily_usage')) return {request_count:0};
      throw Error('Unexpected SQL '+sql);
    }};},
    async batch(commands){
      batchCalls++;
      if(commands[0].sql.includes('tester_daily_image_usage_extra')) {
        if(extra>=100)throw Error('image_extra_limit_100');
        extra++;
      } else {
        if(current>=100)throw Error('image_limit_100');
        current++;
      }
      return commands.map(()=>({success:true,meta:{changes:1}}));
    }
  };
  const env={DB,GEMINI_API_KEY:'dummy',ENABLE_LIVE_ANALYSIS:'true',ENABLE_IMAGE_GENERATION:'true'};
  const prior=globalThis.fetch;
  globalThis.fetch=async()=>{
    geminiCalls++;
    return new Response(JSON.stringify({candidates:[{content:{parts:[{inlineData:{
      mimeType:'image/png',data:Buffer.alloc(150,42).toString('base64')
    }}]}}]}),{status:200});
  };
  try {
    let result=await worker.fetch(request(),env);
    assert.equal(result.status,200,await result.text());
    assert.equal(extra,1);
    extra=99;
    result=await worker.fetch(request(),env);
    assert.equal(result.status,200,await result.text());
    assert.equal(extra,100);
    result=await worker.fetch(request(),env);
    assert.equal(result.status,429);
    assert.equal(geminiCalls,2);
    assert.equal(batchCalls,6);
  }finally{globalThis.fetch=prior;}
});
test('failed photo generation refunds the personal image quota only', async()=>{
  const f=await fixture({photoEnabled:true});
  const updates=[];
  const prepare=f.env.DB.prepare.bind(f.env.DB);
  f.env.DB.prepare=sql=>sql.startsWith('UPDATE ')
    ? {bind(...p){this.p=p;return this;}, async run(){updates.push({sql,p:this.p});return {success:true};}}
    : prepare(sql);
  const priorFetch=globalThis.fetch;
  globalThis.fetch=async()=>new Response('{}',{status:400});
  try {
    const res=await worker.fetch(request(),f.env);
    assert.equal(res.status,502);
    assert.equal(f.used(),1);
    assert.equal(updates.length,1);
    assert.match(updates[0].sql,/^UPDATE tester_daily_image_usage SET request_count = request_count - 1/);
    assert.doesNotMatch(updates[0].sql,/global/);
    assert.equal(updates[0].p[0],'owner-test-01');
  } finally { globalThis.fetch=priorFetch; }
});

test('photo generation re-sends a "location not supported" rejection', async()=>{
  const f=await fixture({photoEnabled:true});
  const priorFetch=globalThis.fetch;
  let calls=0;
  globalThis.fetch=async()=>++calls===1
    ? new Response(JSON.stringify({error:{status:'FAILED_PRECONDITION',message:'User location is not supported for the API use.'}}),{status:400})
    : new Response(JSON.stringify({candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:'iVBORw0KGgo='}}]}}]}));
  try {
    const res=await worker.fetch(request(),f.env);
    assert.equal(res.status,200, await res.clone().text());
    assert.equal(calls,2);
    assert.equal(f.used(),1);
  } finally { globalThis.fetch=priorFetch; }
});
