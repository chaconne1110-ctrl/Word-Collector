const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('successful text analysis triggers exactly one photo generation and displays review first',()=>{
  const s=fs.readFileSync('www/quick_capture/analysis.js','utf8');
  assert.equal((s.match(/startReviewPhoto\(\{automatic:true\}\)/g)||[]).length,1);
  assert.match(s,/async function startReviewPhoto\(\{automatic = false\} = \{\}\)/);
  const at=s.indexOf('void startReviewPhoto({automatic:true})');
  assert.ok(at > s.indexOf("reviewForm.hidden = false;"));
  assert.match(s,/photoRequestGate\.begin\(\)/);
  assert.match(s,/photoRequestGate\.isCurrent\(ticket\.id\)/);
  assert.match(s,/사진 생성에 실패했습니다/);
});
test('photo request includes fallback Korean meaning and definition',()=>{
  const s=fs.readFileSync('www/quick_capture/analysis.js','utf8');
  assert.match(s,/const word = .* \|\| draft\.term;/);
  assert.match(s,/const koreanMeaning = .* \|\| word;/);
  assert.match(s,/const definition = /);
});
test('new per-tester caps represent 400 actual API attempts and at most 200 pairs',()=>{
  const worker=fs.readFileSync('cloudflare/worker.mjs','utf8');
  assert.match(worker,/const PERSONAL_LIMIT = 200/);
  assert.match(worker,/const IMAGE_PERSONAL_LIMIT = 200/);
  assert.match(worker,/const limit = PERSONAL_LIMIT \+ IMAGE_PERSONAL_LIMIT/);
  assert.match(worker,/analysis: \{used:analysisUsed/);
  assert.match(worker,/image: \{used:imageUsed/);
  assert.match(fs.readFileSync('cloudflare/schema.sql','utf8'),/daily_limit_100/);
  const migration=fs.readFileSync('cloudflare/migrations/0003_personal_daily_400_overflow.sql','utf8');
  assert.match(migration,/tester_daily_usage_extra/);
  assert.match(migration,/tester_daily_image_usage_extra/);
  assert.match(fs.readFileSync('cloudflare/migrations/0002_image_daily_limits.sql','utf8'),/image_limit_100/);
});
