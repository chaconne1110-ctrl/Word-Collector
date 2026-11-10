const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('client sends user-created empty notebooks for all classification modes',()=>{
  const c=fs.readFileSync('www/quick_capture/analysis.js','utf8');
  assert.match(c,/notebooks: currentNotebooks\(\)/);
  assert.match(c,/reviewedWords === 0/);
  const html=fs.readFileSync('www/quick_capture/code.html','utf8');
  assert.match(html,/저장된 단어가 없어도/);
  assert.doesNotMatch(html,/value="Permittivity \(유전율\)"/);
});
