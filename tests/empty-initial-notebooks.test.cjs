const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const seedSource = fs.readFileSync('www/data.js', 'utf8');
const appSource = fs.readFileSync('www/app.js', 'utf8');
const initialization = appSource.slice(0, appSource.indexOf('function renderHome() {'));
function run(initial) {
  const memory = new Map(initial ? [['lexicon-word-collector-v1', JSON.stringify(initial)]] : []);
  const scope = {
    document: {body:{dataset:{page:'home'}}},
    location: {search:''},
    localStorage:{
      getItem:key => memory.get(key) ?? null,
      setItem:(key,val) => memory.set(key,val)
    },
    URLSearchParams, structuredClone,
    alert: () => { throw Error('Storage warning must not occur'); }
  };
  vm.createContext(scope);
  vm.runInContext(seedSource, scope);
  vm.runInContext(initialization, scope);
  return {
    state: () => JSON.parse(vm.runInContext('JSON.stringify(state)', scope)),
    get: code => vm.runInContext(code, scope),
    memory
  };
}
test('fresh installation has only the 일반 단어장 (no words or bookmarks)', () => {
  const app = run();
  const expected = {courses:{'general-meaning':['일반 단어장','']},terms:{},saved:[]};
  assert.deepEqual(app.state(), expected);
  assert.equal(app.get('Object.keys(allCourses()).length'), 1);
  assert.equal(app.memory.get('lexicon-word-collector-v1'), JSON.stringify(expected));
});
test('previously saved data remains untouched on upgrade', () => {
  const saved = {
    courses: {electromagnetics:['내가 수정한 단어장','']},
    terms: {a:{course:'electromagnetics',en:'Power',ko:'전력'}},
    saved:['a']
  };
  const app = run(saved);
  // Existing records are kept as they are; only the 일반 단어장 is added (listed first).
  const expected = {...saved, courses:{'general-meaning':['일반 단어장',''], ...saved.courses}};
  assert.deepEqual(app.state(), expected);
  assert.deepEqual(Object.keys(app.state().courses), ['general-meaning', 'electromagnetics']);
  assert.equal(app.get('courseNames("electromagnetics")[0]'), '내가 수정한 단어장');
  assert.equal(app.get('Object.keys(allCourses()).length'),2);
  assert.equal(app.memory.get('lexicon-word-collector-v1'),JSON.stringify(expected));
});
test('a deleted 일반 단어장 is not brought back on start-up', () => {
  const saved = {courses:{}, terms:{}, saved:[], deletedCourses:['general-meaning']};
  const app = run(saved);
  assert.deepEqual(app.state(), saved);
  assert.equal(app.memory.get('lexicon-word-collector-v1'), JSON.stringify(saved));
});
test('home can create empty notebooks without requiring AI usage', () => {
  const html=fs.readFileSync('www/index.html','utf8');
  assert.match(html,/id="create-notebook"/);
  assert.match(html,/id="create-notebook-form"/);
  assert.match(html,/id="empty-state-title"/);
  assert.doesNotMatch(html,/data-subject="electromagnetics"/);
  assert.doesNotMatch(html,/data-subject="semiconductor"/);
  const source=fs.readFileSync('www/app.js','utf8');
  assert.match(source,/const id = 'notebook_' \+ crypto\.randomUUID\(\)/);
  assert.match(source,/courses:\{\.\.\.state\.courses, \[id\]:\[name, ''\]\}/);
  const bookmarks=fs.readFileSync('www/bookmarks.html','utf8');
  assert.match(bookmarks,/id="bookmark-filters"/);
  assert.doesNotMatch(bookmarks,/data-filter="circuit"/);
  // v7: the word input page (notebook choice) lives in capture.js
  const add=fs.readFileSync('www/quick_capture/capture.js','utf8');
  assert.match(add,/if \(!notebookEntries\.length\)/);
  assert.match(add,/setDestinationMode\('new'\)/);
  const capturePage=fs.readFileSync('www/quick_capture/code.html','utf8');
  assert.doesNotMatch(capturePage,/등록된 4개 과목/);
  assert.match(capturePage,/id="existing-notebook-count"/);
  assert.match(capturePage,/아직 전공 단어장이 없어요/);
});
