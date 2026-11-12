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

test('hosted web includes auth code before analysis script without mutating user records',()=>{
  assert.ok(page.indexOf('../anonymous-auth.js')>=0);
  assert.ok(page.indexOf('../anonymous-auth.js') < page.indexOf('../analysis-api.js'));
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

test('new web browser obtains a single automatic credential; API calls never retry enrollment',async()=>{
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
  await scope.WordCollectorAI.request({term:'Voltage'});
  await scope.WordCollectorAI.request({term:'Voltage'});
  assert.equal(acquireCalls,1);
  assert.deepEqual(calls,['Bearer '+good,'Bearer '+good]);
});

test('browser without the auto-auth helper fails closed before chargeable network access',async()=>{
  let charged=false;
  const scope={AbortSignal,fetch:async()=>{charged=true;return null;}};
  scope.globalThis=scope;
  vm.runInNewContext(api,scope,{filename:'www/analysis-api.js'});
  await assert.rejects(()=>scope.WordCollectorAI.request({term:'Voltage'}),/자동 인증 기능을 찾지 못/);
  assert.equal(charged,false);
});
