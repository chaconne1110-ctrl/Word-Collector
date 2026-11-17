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
  assert.match(analysis, /\$\('#review-course-row'\)\.hidden = createsCourse;/);
  assert.match(analysis, /\$\('#review-new-course-row'\)\.hidden = !createsCourse;/);
  assert.match(analysis, /if \(createsCourse\) newCourseInput\.value = newCourseName;/);
  assert.match(analysis, /const createsCourse = createFirstCourse \|\| Boolean\(requestedNewCourse\);/);
  assert.match(analysis, /draft\.newCourseName = newCourseInput\.value\.trim\(\);/);
  assert.match(analysis, /if \(draft\.createsCourse && !draft\.newCourseName\) \{\n?\r?\n?\s*status\.textContent = '새 단어장 이름을 입력해 주세요\.';/);
  // Created together with the word, in the same commit, under the reviewed name.
  assert.match(analysis, /\n\s*courses\[draft\.selected\] = \[draft\.newCourseName, ''\];/);
  // A taken name (any existing notebook, or the 일반 단어장) is refused, never merged.
  assert.match(analysis, /if \(notebookNameTaken\(draft\.newCourseName\)\) \{\s*status\.textContent = NOTEBOOK_NAME_TAKEN_MESSAGE;/);
  assert.doesNotMatch(analysis, /if \(sameName\) draft\.selected = sameName;/);
  assert.match(fs.readFileSync('www/quick_capture/capture.js', 'utf8'),
    /if \(destination === 'new' && notebookNameTaken\(newCourseName\)\) \{\s*status\.textContent = NOTEBOOK_NAME_TAKEN_MESSAGE;/);
  assert.match(analysis, /commit\(\{\.\.\.state, \.\.\.deleted, courses, terms: \{\.\.\.state\.terms, \[id\]: word\}\}\)/);
});

test('notebook and meaning are chosen independently: an existing notebook or a new one (name required), then 일반/전공', () => {
  const capture = fs.readFileSync('www/quick_capture/capture.js', 'utf8');
  assert.ok(capture.includes("const destination = currentDestinationMode();"));
  assert.ok(capture.includes("const selected = destination === 'existing' ? courseInput.value : '';"));
  assert.ok(capture.includes("const notebookEntries = Object.entries(allCourses());"));
  assert.doesNotMatch(capture, /destination === 'general'|id !== GENERAL_COURSE_ID/);
  assert.ok(capture.includes("if (destination === 'new' && !newCourseName) {"));
  assert.ok(analysis.includes('reviewCourse.disabled = false;'));
  assert.doesNotMatch(analysis, /GENERAL_COURSE/);
  // Screen order: 1. 단어 입력, 2. 의미 기준, 3. 단어장 선택, 4. 참고자료.
  const html = fs.readFileSync('www/quick_capture/code.html', 'utf8');
  const order = ['>1. 단어 입력<', 'id="term-unified-input"', '>2. 의미 기준<', 'id="btn-meaning-general"', 'id="major-input"',
    '>3. 단어장 선택<', 'id="subject-select"', 'id="new-notebook-input"', '>4. 참고자료<', 'id="context-sentence-input"'].map(text => html.indexOf(text));
  assert.ok(order.every(index => index > 0), JSON.stringify(order));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.ok(html.includes('placeholder="전공명 또는 학과명 (예: 전기공학, 전기공학과)"'));
  assert.ok(html.includes('for="new-notebook-input">새 단어장 이름 <span class="text-error">*</span></label><input required aria-required="true"'));
});
