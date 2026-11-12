const test = require('node:test');
const assert = require('node:assert/strict');
const {DatabaseSync} = require('node:sqlite');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const read = name => readFileSync(join(__dirname,'../cloudflare',name),'utf8');
const migration = 'migrations/0003_personal_daily_400_overflow.sql';
function fixture(t) {
  const db = new DatabaseSync(':memory:'); t.after(()=>db.close());
  db.exec('PRAGMA foreign_keys=ON');
  db.exec(read('schema.sql')); db.exec(read('migrations/0002_image_daily_limits.sql'));
  const token = 'wc_'+'a'.repeat(64);
  const hash = require('node:crypto').createHash('sha256').update(token).digest('hex');
  db.prepare('INSERT INTO testers(tester_id,token_hash) VALUES (?,?)').run('one',hash);
  return {db,token};
}
function d1(db) {
  return {
    prepare(sql) {return {sql,args:[],bind(...args){this.args=args;return this;},async first(){return db.prepare(sql).get(...this.args) || null;}};},
    async batch(statements) {
      db.exec('BEGIN');
      try {
        const results = statements.map(({sql,args})=>({success:true,meta:{changes:Number(db.prepare(sql).run(...args).changes)}}));
        db.exec('COMMIT'); return results;
      } catch(error) {db.exec('ROLLBACK');throw error;}
    }
  };
}
test('additive migration preserves testers, current/history counts, timestamps and global usage', t=>{
  const {db}=fixture(t);
  for(const table of ['tester_daily_usage','tester_daily_image_usage']) {
    for(const day of ['2026-11-11','2026-11-12']) db.prepare(`INSERT INTO ${table}(tester_id,usage_date,request_count) VALUES ('one',?,100)`).run(day);
  }
  for(const table of ['global_daily_usage','global_daily_image_usage']) db.prepare(`INSERT INTO ${table}(usage_date,request_count) VALUES ('2026-11-12',1500)`).run();
  const tables=['testers','tester_daily_usage','tester_daily_image_usage','global_daily_usage','global_daily_image_usage'];
  const before=tables.map(table=>db.prepare(`SELECT * FROM ${table}`).all());
  db.exec(read(migration)); db.exec(read(migration));
  assert.deepEqual(tables.map(table=>db.prepare(`SELECT * FROM ${table}`).all()),before);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});
test('real Worker SQL allows 200+200 attempts, blocks 201, and reports combined usage without data loss',async t=>{
  const {db,token}=fixture(t); db.exec(read(migration));
  const {default:worker,todayKST}=await import('../cloudflare/worker.mjs');
  const env={DB:d1(db),GEMINI_API_KEY:'test-only',ENABLE_LIVE_ANALYSIS:'true',ENABLE_IMAGE_GENERATION:'true'};
  let calls=0;
  const original=globalThis.fetch;
  globalThis.fetch=async()=>{calls++;throw new Error('mock upstream unavailable');};
  t.after(()=>{globalThis.fetch=original;});
  const send=image=>worker.fetch(new Request('https://test/api/'+(image?'image':'analyze'),{
    method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
    body:JSON.stringify(image?{word:'current',koreanMeaning:'전류',subject:'전기',definition:'전하의 흐름'}:
      {term:'current',context:'',course:'전기',autoCourse:false})
  }),env);
  for(let i=0;i<200;i++) {
    // Upstream failures still consume reserved attempts, just as in production.
    assert.equal((await send(false)).status,502);
    assert.equal((await send(true)).status,502);
  }
  assert.equal(calls,400);
  assert.equal((await send(false)).status,429); assert.equal((await send(true)).status,429);
  assert.equal(calls,400);
  const summary=await (await worker.fetch(new Request('https://test/api/usage',{headers:{Authorization:'Bearer '+token}}),env)).json();
  assert.equal(summary.limit,400);assert.equal(summary.used,400);assert.equal(summary.remaining,0);
  assert.deepEqual(summary.analysis,{used:200,limit:200,remaining:0});
  assert.deepEqual(summary.image,{used:200,limit:200,remaining:0});
  for(const table of ['tester_daily_usage','tester_daily_image_usage','tester_daily_usage_extra','tester_daily_image_usage_extra']) {
    assert.equal(db.prepare(`SELECT request_count FROM ${table}`).get().request_count,100);
  }
  for(const table of ['global_daily_usage','global_daily_image_usage']) {
    assert.equal(db.prepare(`SELECT request_count FROM ${table}`).get().request_count,200);
  }
  // Both the original and overflow paths must roll back if the shared cap is exhausted.
  for(const [image,table] of [[false,'tester_daily_usage'],[true,'tester_daily_image_usage']]) {
    const globalTable=image?'global_daily_image_usage':'global_daily_usage';
    for(const count of [0,100]) {
      db.prepare(`UPDATE ${table} SET request_count=?`).run(count);
      db.exec(`UPDATE ${table}_extra SET request_count=0`);
      db.exec(`UPDATE ${globalTable} SET request_count=1500`);
      assert.equal((await send(image)).status,429);
      assert.equal(db.prepare(`SELECT request_count FROM ${table}`).get().request_count,count);
      assert.equal(db.prepare(`SELECT request_count FROM ${table}_extra`).get().request_count,0);
    }
  }
  // Old date records do not consume the new date's allowance.
  for(const table of ['tester_daily_usage','tester_daily_image_usage','tester_daily_usage_extra','tester_daily_image_usage_extra','global_daily_usage','global_daily_image_usage']) {
    db.exec(`UPDATE ${table} SET usage_date='2000-01-01'`);
  }
  assert.equal((await send(false)).status,502);assert.equal((await send(true)).status,502);
  assert.equal(db.prepare('SELECT request_count FROM tester_daily_usage WHERE usage_date=?').get(todayKST()).request_count,1);
  assert.equal(calls,402);
});
