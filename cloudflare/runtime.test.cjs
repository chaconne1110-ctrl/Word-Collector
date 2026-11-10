// Requires Miniflare (installed outside the application checkout during review).
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {createHash} = require('node:crypto');
const {Miniflare} = require('miniflare');

test('workerd + D1: authentication, single fetch, atomic concurrent quotas and KST date', async t => {
  let calls = 0;
  let upstreamStatus = 200;
  const output = {englishTerm:'Transformer', koreanMeaning:'변압기', specialization:'전기공학', notebookName:'전기기기',
    englishDefinition:'A voltage conversion device.', koreanDefinition:'전압 변환 장치.', exampleSentence:'A transformer changes voltage.',
    explanation:'전자기 유도', recommendationReason:'참고 문장', relatedTerms:[], pos:'noun', exampleKo:'변압기는 전압을 바꾼다.'};
  const mf = new Miniflare({modules:true, scriptPath:__dirname+'/worker.mjs', compatibilityDate:'2025-11-01',
    bindings:{GEMINI_API_KEY:'runtime-test-placeholder',ENABLE_LIVE_ANALYSIS:'true'}, d1Databases:['DB'],
    outboundService: async request => {
      calls++;
      assert.equal(request.url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
      assert.equal(request.headers.get('x-goog-api-key'),'runtime-test-placeholder');
      return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(output)}]}}]}),{status:upstreamStatus});
    }});
  t.after(()=>mf.dispose());
  const db=await mf.getD1Database('DB');
  // D1 exec accepts one statement per line; preserve trigger statement boundaries.
  const schema=readFileSync(__dirname+'/schema.sql','utf8').replace(/^--.*$/gm,'');
  const statements=schema.match(/CREATE TRIGGER[\s\S]*?END;|CREATE TABLE[\s\S]*?;/g);
  for(const sql of statements) await db.prepare(sql).run();
  for(const sql of statements) await db.prepare(sql).run(); // migration is repeatable
  const tokens=Array.from({length:10},(_,i)=>'wc_'+String(i).repeat(64));
  for(let i=0;i<tokens.length;i++) await db.prepare('INSERT INTO testers (tester_id,token_hash) VALUES (?,?)')
    .bind('tester-'+i,createHash('sha256').update(tokens[i]).digest('hex')).run();
  const send=(token=undefined)=>mf.dispatchFetch('https://test/api/analyze',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
    body:JSON.stringify({term:'변압기 Transformer',context:'AC voltage',course:'전기기기',autoCourse:false})});
  assert.equal((await send()).status,401); assert.equal(calls,0);
  await db.prepare('UPDATE testers SET is_active=0 WHERE tester_id=?').bind('tester-0').run();
  assert.equal((await send(tokens[0])).status,401);assert.equal(calls,0);
  await db.prepare('UPDATE testers SET is_active=1, expires_at=? WHERE tester_id=?').bind('2000-01-01T00:00:00Z','tester-0').run();
  assert.equal((await send(tokens[0])).status,401);assert.equal(calls,0);
  await db.prepare('UPDATE testers SET expires_at=NULL WHERE tester_id=?').bind('tester-0').run();

  assert.equal((await mf.dispatchFetch('https://test/internal/quota-test',{method:'POST'})).status,404);
  const date=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
  await db.prepare('INSERT INTO tester_daily_usage(tester_id,usage_date,request_count) VALUES (?,?,?)').bind('tester-0',date,99).run();
  await db.prepare('INSERT INTO global_daily_usage(usage_date,request_count) VALUES (?,?)').bind(date,99).run();
  let results=await Promise.all(Array.from({length:8},()=>send(tokens[0])));
  assert.equal(results.filter(r=>r.status===200).length,1);
  assert.equal(results.filter(r=>r.status===429).length,7); assert.equal(calls,1);
  assert.equal((await db.prepare('SELECT request_count FROM global_daily_usage WHERE usage_date=?').bind(date).first()).request_count,100);
  await db.prepare('UPDATE global_daily_usage SET request_count=1499 WHERE usage_date=?').bind(date).run();
  results=await Promise.all(tokens.slice(1,9).map(token=>send(token)));
  assert.equal(results.filter(r=>r.status===200).length,1);
  assert.equal(results.filter(r=>r.status===429).length,7); assert.equal(calls,2);
  assert.equal((await db.prepare('SELECT SUM(request_count) AS total FROM tester_daily_usage WHERE usage_date=?').bind(date).first()).total,101);
  assert.equal((await db.prepare('SELECT request_count FROM global_daily_usage WHERE usage_date=?').bind(date).first()).request_count,1500);
  // Old day records do not block a new KST usage bucket.
  await db.prepare('UPDATE global_daily_usage SET request_count=0 WHERE usage_date=?').bind(date).run();
  await db.prepare('INSERT INTO tester_daily_usage(tester_id,usage_date,request_count) VALUES (?,?,100)').bind('tester-9','2000-01-01').run();
  upstreamStatus=302;
  const redirected=await send(tokens[9]);
  assert.equal(redirected.status,502); assert.match((await redirected.json()).error,/GEMINI_REDIRECT/); assert.equal(calls,3);
  upstreamStatus=200;
  const success=await send(tokens[9]); assert.equal(success.status,200); assert.equal((await success.json()).course,'전기기기'); assert.equal(calls,4);
  const usage=await mf.dispatchFetch('https://test/api/usage',{headers:{Authorization:'Bearer '+tokens[9]}});
  const summary=await usage.json(); assert.equal(summary.date,date); assert.equal(summary.timezone,'Asia/Seoul'); assert.equal(summary.used,2);
});
