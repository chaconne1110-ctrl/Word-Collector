const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('../www/request-gate.js');
const {createClient}=require('../www/analysis-api.js');
const token='wc_'+'a'.repeat(64);
test('prevents duplicate within 3 seconds, allows explicit retry and discards late result',()=>{
  let now=1000; const gate=create({now:()=>now});
  const first=gate.begin();
  assert.equal(first.allowed,true);
  now=3999;
  assert.equal(gate.begin().allowed,false);
  assert.equal(gate.remainingMs(),1);
  assert.equal(first.signal.aborted,false);
  now=4000;
  const retry=gate.begin();
  assert.equal(retry.allowed,true);
  assert.equal(retry.replaced,true);
  assert.equal(first.signal.aborted,true);
  assert.equal(gate.isCurrent(first.id),false);
  assert.equal(gate.finish(first.id),false);
  assert.equal(gate.finish(retry.id),true);
});
test('success can be presented immediately, while 3-second dispatch cooldown remains',()=>{
  let now=100;
  const gate=create({now:()=>now});
  const one=gate.begin();
  now=200; assert.equal(gate.finish(one.id),true);
  assert.equal(gate.isPending(),false);
  assert.equal(gate.begin().allowed,false);
  now=3100; assert.equal(gate.begin().allowed,true);
});
test('abort on page exit prevents stale results',()=>{
  const gate=create();
  const one=gate.begin();
  gate.cancel();
  assert.equal(one.signal.aborted,true);
  assert.equal(gate.isCurrent(one.id),false);
});
test('web analyze fetch forwards cancellation',async()=>{
  const ctl=new AbortController();let signal;
  const client=createClient({token,fetchImpl:async(_url,opts)=>{
    signal=opts.signal;
    return new Response(JSON.stringify({model:'gemini-3.5-flash-lite',en:'Voltage',
      ko:'전압',discipline:'전기공학',enDef:'Potential difference',koDef:'전위차',
      exampleEn:'Voltage rises.',exampleKo:'전압 상승',pos:'noun',course:'전력공학'}));
  }});
  await client.request({term:'Voltage',autoCourse:false,course:'전력공학',
    notebooks:[{course:'전력공학',words:[]}]},{signal:ctl.signal});
  assert.ok(signal);
  ctl.abort();
  assert.equal(signal.aborted,true);
});
test('web photo fetch forwards cancellation',async()=>{
  const ctl=new AbortController();let signal;
  const client=createClient({token,fetchImpl:async(_url,opts)=>{
    signal=opts.signal;
    return new Response(JSON.stringify({image:{mimeType:'image/jpeg',data:'a'.repeat(120)}}));
  }});
  await client.requestImage({word:'Voltage'},{signal:ctl.signal});
  assert.ok(signal);
  ctl.abort();
  assert.equal(signal.aborted,true);
});
