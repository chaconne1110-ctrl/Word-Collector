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
test('fresh installation starts with the three chosen notebooks (전력공학, 회로이론, 전기기기; 24 words each), no bookmarks', () => {
  const app = run();
  const state = app.state();
  const names = Object.values(state.courses).map(([name]) => name).sort();
  assert.deepEqual(names, ['전기기기', '전력공학', '회로이론']);
  const perNotebook = {};
  for (const term of Object.values(state.terms)) perNotebook[state.courses[term.course][0]] = (perNotebook[state.courses[term.course][0]] || 0) + 1;
  assert.deepEqual(perNotebook, {전력공학: 24, 회로이론: 24, 전기기기: 24});
  assert.deepEqual(state.saved, []);
  assert.ok(!names.includes('일반 단어장'));
  assert.equal(app.get('Object.keys(allCourses()).length'), 3);
});
test('previously saved data remains untouched on upgrade', () => {
  const saved = {
    courses: {electromagnetics:['내가 수정한 단어장','']},
    terms: {a:{course:'electromagnetics',en:'Power',ko:'전력'}},
    saved:['a']
  };
  const app = run(saved);
  assert.deepEqual(app.state(), saved);
  assert.equal(app.get('courseNames("electromagnetics")[0]'), '내가 수정한 단어장');
  assert.equal(app.get('Object.keys(allCourses()).length'),1);
  assert.equal(app.memory.get('lexicon-word-collector-v1'),JSON.stringify(saved));
});
test('an empty 일반 단어장 auto-created by v2-v4 is removed; one with words is kept', () => {
  const empty = {courses:{'general-meaning':['일반 단어장',''], book:['회로이론','']}, terms:{a:{course:'book',en:'current'}}, saved:[]};
  const cleaned = run(empty);
  assert.deepEqual(cleaned.state(), {...empty, courses:{book:['회로이론','']}});
  assert.equal(cleaned.memory.get('lexicon-word-collector-v1'), JSON.stringify({...empty, courses:{book:['회로이론','']}}));
  const used = {courses:{'general-meaning':['일반 단어장','']}, terms:{a:{course:'general-meaning',en:'run'}}, saved:[]};
  const kept = run(used);
  assert.deepEqual(kept.state(), used);
  assert.equal(kept.memory.get('lexicon-word-collector-v1'), JSON.stringify(used));
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
  assert.doesNotMatch(capturePage,/아직 단어장이 없어요/); // notice removed; the new-notebook field is shown instead
});
