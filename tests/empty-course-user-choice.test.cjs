const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('client sends user-created empty notebooks for all classification modes',()=>{
  const c=fs.readFileSync('www/quick_capture/analysis.js','utf8');
  assert.match(c,/notebooks: currentNotebooks\(\)/);
  assert.match(c,/refreshNotebookChoices\(\)/);
  assert.match(c,/!hasCourse\(selected\)/);
  assert.match(c,/review-course-row'\)\.hidden = false/);
  assert.match(c,/needsManualCompletion/);
  // v8: the review no longer shows the analysis-basis note; the recommendation
  // summary still reports how many saved words were compared.
  assert.match(c,/분류 참고 단어 ' \+ reviewedWords/);
  assert.doesNotMatch(c,/review-analysis-basis/);
  const html=fs.readFileSync('www/quick_capture/code.html','utf8');
  assert.match(html,/저장된 단어가 없어도/);
  assert.doesNotMatch(html,/value="Permittivity \(유전율\)"/);
});
