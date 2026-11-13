const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('word analysis never requests or saves a photo; the review page has no photo UI',()=>{
  const s=fs.readFileSync('www/quick_capture/analysis.js','utf8');
  const page=fs.readFileSync('www/quick_capture/review.html','utf8');
  assert.doesNotMatch(s,/createImage|startReviewPhoto|WordCollectorPhoto|photoRequestGate/);
  assert.doesNotMatch(page,/photo-review|review-photo|data-step="photo"|analysis-waiting-skip|photo-store\.js/);
});
test('photos are generated only from the flashcard back button, then shown and saved',()=>{
  const app=fs.readFileSync('www/app.js','utf8');
  assert.match(app,/photoButton\.dataset\.action = 'generate-photo'/);
  const click=app.indexOf("photoButton.addEventListener('click'");
  const call=app.indexOf('WordCollectorAI.createImage(', click);
  const save=app.indexOf('WordCollectorPhoto.save(photoTermId, result.image)', call);
  const show=app.indexOf('await refreshPhoto()', save);
  assert.ok(click > 0 && call > click && save > call && show > save, 'button -> generate -> save -> show');
  assert.equal((app.match(/WordCollectorAI\.createImage\(/g)||[]).length,1, 'no other photo request');
  // Fallback meaning and definition are sent with the request.
  assert.match(app,/koreanMeaning:term\.ko/);
  assert.match(app,/definition:\(term\.koDef \|\| term\.enDef \|\| term\.ko \|\| term\.en\)\.slice\(0, 700\)/);
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
