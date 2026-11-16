const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('word input has no dead microphone button (use the keyboard voice input)', () => {
  const html = fs.readFileSync('www/quick_capture/code.html', 'utf8');
  assert.doesNotMatch(html, />mic</);
  assert.match(html, /<input class="[^"]*\bpx-4\b[^"]*" id="term-unified-input"/);
  assert.doesNotMatch(fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8'), /RECORD_AUDIO/);
});
