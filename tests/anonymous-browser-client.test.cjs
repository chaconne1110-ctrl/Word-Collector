const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const api = fs.readFileSync('www/analysis-api.js','utf8');
const anonymous = fs.readFileSync('www/anonymous-auth.js','utf8');
const page = fs.readFileSync('www/quick_capture/code.html','utf8');
const nativePage = fs.readFileSync('www/auth/native-challenge.html','utf8');
const good = 'wc_'+'d'.repeat(64);
const response = {model:'gemini-3.5-flash-lite',en:'Voltage',ko:'전압',discipline:'전기공학',
  enDef:'Electric potential difference.',koDef:'전위차',exampleEn:'Voltage rises.',
  pos:'noun',exampleKo:'전압이 증가한다.',course:'전기공학'};

test('capture page uses per-device public access: no Turnstile script and no tester-code input',()=>{
  assert.equal(page.indexOf('../anonymous-auth.js'),-1);
  assert.doesNotMatch(page,/id="tester-token"|id="ai-auth-settings"/);
  // The dormant opt-in Turnstile helper still never touches word records.
  assert.match(anonymous,/indexedDB\.open\(DB_NAME, 1\)/);
  assert.doesNotMatch(anonymous,/localStorage|word-collector-data|state\.terms/);
  assert.match(api,/WordCollectorAnonymousAuth\.acquire\(\)/);
});

test('existing web browser identity is reused for text and photo requests without manual code',async()=>{
  let acquireCalls=0, restoreCalls=0;
  const calls=[];
  const scope={
    AbortSignal,
    WordCollectorAnonymousAuth:{
      restore: async()=>{restoreCalls++;return good;},
      acquire: async()=>{acquireCalls++;return good;},
      clear:async()=>{}
    },
    fetch: async(url,opts)=>{
      calls.push({url,headers:opts.headers});
      return {
        status:200,
        json:async()=>url.endsWith('/api/analyze')
          ? response : {model:'image-model',image:{mimeType:'image/png',data:'a'.repeat(200)}}
      };
    }
  };
  scope.globalThis=scope;
  vm.runInNewContext(api,scope,{filename:'www/analysis-api.js'});
  await scope.WordCollectorAI.request({term:'Voltage'});
  await scope.WordCollectorAI.createImage({word:'Voltage'});
  assert.equal(acquireCalls,0);
  assert.equal(restoreCalls,1);
  assert.deepEqual(calls.map(x=>x.url.split('/').pop()),['analyze','image']);
  assert.ok(calls.every(x=>x.headers.Authorization==='Bearer '+good));
});

test('explicit opt-in enrollment obtains a single credential; API calls never retry enrollment',async()=>{
  let acquireCalls=0;
  const calls=[];
  const scope={
    AbortSignal,
    WordCollectorAnonymousAuth:{
      restore:async()=>'', clear:async()=>{},
      acquire:async()=>{acquireCalls++;return good;}
    },
    fetch:async(url,opts)=>{
      calls.push(opts.headers.Authorization);
      return {status:200,json:async()=>response};
    }
  };
  scope.globalThis=scope;
  vm.runInNewContext(api,scope,{filename:'www/analysis-api.js'});
  await scope.WordCollectorAI.ensureAutoAuth();
  await scope.WordCollectorAI.request({term:'Voltage'});
  await scope.WordCollectorAI.request({term:'Voltage'});
  assert.equal(acquireCalls,1);
  assert.deepEqual(calls,['Bearer '+good,'Bearer '+good]);
});

test('without any stored credential, requests use the per-device ID and never start enrollment',async()=>{
  let acquireCalls=0;
  const headers=[];
  const store=new Map();
  const scope={
    AbortSignal, crypto: require('node:crypto').webcrypto,
    localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
    WordCollectorAnonymousAuth:{restore:async()=>'',clear:async()=>{},acquire:async()=>{acquireCalls++;return good;}},
    fetch:async(url,opts)=>{headers.push(opts.headers);return {status:200,json:async()=>response};}
  };
  scope.globalThis=scope;
  vm.runInNewContext(api,scope,{filename:'www/analysis-api.js'});
  await scope.WordCollectorAI.request({term:'Voltage'});
  await scope.WordCollectorAI.request({term:'Voltage'});
  assert.equal(acquireCalls,0);
  assert.equal(headers.length,2);
  assert.ok(headers.every(h=>!('Authorization' in h)));
  assert.match(headers[0]['X-WC-Device'],/^wd_[a-f0-9]{64}$/);
  assert.equal(headers[1]['X-WC-Device'],headers[0]['X-WC-Device'],'same install keeps one device ID');
});
