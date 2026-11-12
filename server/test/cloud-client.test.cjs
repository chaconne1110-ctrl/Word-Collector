const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createClient}=require('../../www/analysis-api.js');
const result={model:'gemini-3.5-flash-lite',en:'Voltage',ko:'전압',discipline:'전기공학',pos:'noun',enDef:'Potential difference.',koDef:'전위차.',exampleEn:'Voltage rises.',exampleKo:'전압이 상승한다.',course:'회로이론'};
test('cloud client uses HTTPS bearer authentication once and never sends tokens to local servers',async()=>{
 const token='wc_'+'c'.repeat(64);let calls=0;
 assert.doesNotThrow(()=>createClient());
 assert.throws(()=>createClient({token:'not-a-code'}),/인증 코드/);
 assert.throws(()=>createClient({baseUrl:'https://untrusted.example',token}),/허용되지/);
 const client=createClient({native:true,token,nativeHttp:{request:async opts=>{
  calls++;assert.equal(opts.url,'https://word-collector-api.yechan-lim-elec.workers.dev/api/analyze');
  assert.equal(opts.headers.Authorization,'Bearer '+token);assert.equal(opts.disableRedirects,true);
  return {status:200,data:result};
 }}});
 assert.deepEqual(await client.request({term:'Voltage'}),result);assert.equal(calls,1);
 await createClient({token,baseUrl:'',fetchImpl:async(url,opts)=>{assert.equal(url,'/api/analyze');assert.equal(opts.headers.Authorization,undefined);return new Response(JSON.stringify(result));}}).request({});
 let failures=0;
 await assert.rejects(()=>createClient({token,fetchImpl:async()=>{failures++;return new Response(JSON.stringify({error:'GEMINI_NETWORK'}),{status:502});}}).request({}),/GEMINI_NETWORK/);
 assert.equal(failures,1);
});

test('Capacitor identity and bundled web entry remain unchanged',()=>{
 const config=require('../../capacitor.config.json');
 assert.equal(config.appId,'com.yechan.wordcollector');assert.equal(config.webDir,'www');
 assert.equal(config.server?.url,undefined);
});

test('app sends a stable per-install device ID to the cloud and never to local servers',async()=>{
 const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
 const src=fs.readFileSync(path.join(__dirname,'../../www/analysis-api.js'),'utf8');
 const store=new Map();const seen=[];
 const make=()=>{const scope={AbortSignal,crypto:require('node:crypto').webcrypto,
  localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
  fetch:async(url,opts)=>{seen.push({url,headers:opts.headers});return {status:200,json:async()=>result};}};
  scope.globalThis=scope;vm.runInNewContext(src,scope);return scope.WordCollectorAI;};
 await make().request({term:'Voltage'});await make().request({term:'Voltage'});
 assert.match(seen[0].headers['X-WC-Device'],/^wd_[a-f0-9]{64}$/);
 assert.equal(seen[1].headers['X-WC-Device'],seen[0].headers['X-WC-Device']);
 assert.equal(seen[0].headers.Authorization,undefined);
 const local=make();local.setLocalServer(true);await local.request({term:'Voltage'});
 assert.equal(seen[2].headers['X-WC-Device'],undefined);
});
