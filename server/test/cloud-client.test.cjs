const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createClient}=require('../../www/analysis-api.js');
const result={model:'gemini-3.5-flash-lite',en:'Voltage',ko:'전압',discipline:'전기공학',pos:'noun',enDef:'Potential difference.',koDef:'전위차.',exampleEn:'Voltage rises.',exampleKo:'전압이 상승한다.',course:'회로이론'};
test('cloud client uses HTTPS bearer authentication once and never sends tokens to local servers',async()=>{
 const token='wc_'+'c'.repeat(64);let calls=0;
 assert.throws(()=>createClient(),/인증 코드/);
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
