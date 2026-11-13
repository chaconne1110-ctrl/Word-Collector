const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function loadMapper() {
  const app = fs.readFileSync('www/app.js', 'utf8').replace(/\r\n/g, '\n');
  const start = app.indexOf('const KOREAN_PART_OF_SPEECH');
  const end = app.indexOf('\n}\n', app.indexOf('function koreanPartOfSpeech')) + 2;
  return new Function(app.slice(start, end) + '\nreturn koreanPartOfSpeech;')();
}

test('part of speech is shown in Korean, including words saved with English labels', () => {
  const ko = loadMapper();
  assert.equal(ko('noun'), '명사');
  assert.equal(ko('Noun'), '명사');
  assert.equal(ko('adj.'), '형용사');
  assert.equal(ko('noun, verb'), '명사, 동사');
  assert.equal(ko('noun / adjective'), '명사, 형용사');
  assert.equal(ko('noun phrase'), '명사구');
  assert.equal(ko('명사'), '명사', 'already Korean');
  assert.equal(ko('/ɪˈlɛktrɪk/'), '/ɪˈlɛktrɪk/', 'unrecognised text (e.g. old pronunciation) is kept');
  assert.equal(ko(''), '');
  assert.equal(ko(undefined), '');
});

test('servers ask for the part of speech in Korean', () => {
  for (const file of ['cloudflare/worker.mjs', 'server/server.cjs']) {
    const src = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(src, /pos는 영어 품사/, file);
    assert.equal((src.match(/pos는 한국어 품사\(예: 명사, 동사, 형용사, 부사, 명사구\)/g) || []).length, 2, file);
  }
});

test('flashcard, word lists and review use the Korean part of speech; review puts it right of the word', () => {
  const app = fs.readFileSync('www/app.js', 'utf8');
  assert.match(app, /pron: koreanPartOfSpeech\(term\.pron\)/);
  assert.match(app, /pron: koreanPartOfSpeech\(state\.terms\[id\]\.pron\)/);
  const review = fs.readFileSync('www/quick_capture/analysis.js', 'utf8');
  assert.match(review, /result\.pos = koreanPartOfSpeech\(result\.pos\)/);
  assert.match(review, /row\.append\(wordLabel, posLabel\)/);
});
