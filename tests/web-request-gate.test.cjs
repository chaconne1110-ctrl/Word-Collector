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

test('web UI uses separate gates for analysis and both image-generation buttons',()=>{
  const fs=require('node:fs');
  const review=fs.readFileSync('www/quick_capture/analysis.js','utf8');
  const deck=fs.readFileSync('www/app.js','utf8');
  // v7: analysis requests are sent from the separate analysis page
  const captureHtml=fs.readFileSync('www/quick_capture/review.html','utf8');
  const deckHtml=fs.readFileSync('www/flashcard.html','utf8');
  const sw=fs.readFileSync('www/sw.js','utf8');
  assert.match(review,/const analysisRequestGate = WordCollectorRequestGate\.create\(\)/);
  assert.match(review,/const photoRequestGate = WordCollectorRequestGate\.create\(\)/);
  assert.match(review,/analysisRequestGate\.begin\(\)/);
  assert.match(review,/photoRequestGate\.begin\(\)/);
  assert.match(review,/analysisRequestGate\.isCurrent\(ticket\.id\)/);
  assert.match(review,/photoRequestGate\.isCurrent\(ticket\.id\)/);
  assert.match(review,/reviewForm\.scrollIntoView\(\{block: 'start'\}\)/);
  assert.doesNotMatch(review,/reviewForm\.requestSubmit\(\)/);
  assert.doesNotMatch(review,/analysisButton\.disabled = true/);
  assert.match(deck,/const photoGate = WordCollectorRequestGate\.create\(\)/);
  assert.match(deck,/photoGate\.begin\(\)/);
  assert.match(deck,/photoGate\.isCurrent\(ticket\.id\)/);
  assert.match(captureHtml,/request-gate\.js/);
  assert.match(deckHtml,/request-gate\.js/);
  assert.match(sw,/request-gate\.js/);
});
