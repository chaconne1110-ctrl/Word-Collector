const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('word input has no dead microphone button (use the keyboard voice input)', () => {
  const html = fs.readFileSync('www/quick_capture/code.html', 'utf8');
  assert.doesNotMatch(html, />mic</);
  assert.match(html, /<input class="[^"]*\bpx-4\b[^"]*" id="term-unified-input"/);
  assert.doesNotMatch(fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8'), /RECORD_AUDIO/);
});

test('word list search hint matches what is searched (no formula symbols any more)', () => {
  const html = fs.readFileSync('www/words.html', 'utf8');
  assert.match(html, /placeholder="단어, 뜻, 관련 단어 검색\.\.\."/);
  assert.doesNotMatch(html, /수식 기호/);
});

test('screens call the storage place 단어장 (never 과목); 전공 is only the field of a word', () => {
  for (const file of ['index.html', 'words.html', 'bookmarks.html', 'flashcard.html', 'edit.html', 'backup.html',
    'export.html', '_6/code.html', 'quick_capture/code.html', 'quick_capture/review.html', 'app.js',
    'quick_capture/analysis.js', 'quick_capture/capture.js']) {
    assert.doesNotMatch(fs.readFileSync('www/' + file, 'utf8'), /과목/, file);
  }
  const capture = fs.readFileSync('www/quick_capture/code.html', 'utf8');
  assert.match(capture, /AI 단어장 자동 분류/);
  assert.match(capture, /기존 단어장 선택/);
});
