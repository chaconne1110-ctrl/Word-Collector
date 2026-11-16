const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const analysis = fs.readFileSync('www/quick_capture/analysis.js', 'utf8');
const review = fs.readFileSync('www/quick_capture/review.html', 'utf8');

test('first notebook is never saved automatically after analysis', () => {
  assert.doesNotMatch(analysis, /createFirstCourse && !result\.needsManualCompletion\) await saveReview/);
  // saveReview is only called from the save button (form submit).
  const calls = analysis.match(/(?<!function )saveReview\(\)/g) || [];
  assert.equal(calls.length, 1, 'only the submit handler calls saveReview');
  assert.match(analysis, /reviewForm\.addEventListener\('submit'[\s\S]{0,120}saveReview\(\)/);
  // The new notebook is not added to the select (nor storage) before saving.
  assert.doesNotMatch(analysis, /reviewCourse\.add\(new Option\(newCourseName/);
});

test('review shows the AI notebook name in an editable field; save creates it', () => {
  assert.match(review, /<input id="review-new-course" type="text" maxlength="60"/);
  assert.match(review, /id="review-new-course-row" class="block" hidden/);
  assert.match(analysis, /\$\('#review-course-row'\)\.hidden = createFirstCourse;/);
  assert.match(analysis, /\$\('#review-new-course-row'\)\.hidden = !createFirstCourse;/);
  assert.match(analysis, /if \(createFirstCourse\) newCourseInput\.value = newCourseName;/);
  assert.match(analysis, /draft\.newCourseName = newCourseInput\.value\.trim\(\);/);
  assert.match(analysis, /if \(draft\.createsCourse && !draft\.newCourseName\) \{\n?\r?\n?\s*status\.textContent = '새 단어장 이름을 입력해 주세요\.';/);
  // Created together with the word, in the same commit, under the reviewed name.
  assert.match(analysis, /else courses\[draft\.selected\] = \[draft\.newCourseName, ''\];/);
  assert.match(analysis, /commit\(\{\.\.\.state, courses, terms: \{\.\.\.state\.terms, \[id\]: word\}\}\)/);
});
