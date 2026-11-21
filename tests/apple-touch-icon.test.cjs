const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const www = path.join(__dirname, '..', 'www');
const mainPages = ['index.html', 'words.html', 'bookmarks.html', 'flashcard.html', 'edit.html', 'export.html',
  'backup.html', 'references.html', 'quick_capture/code.html', 'quick_capture/review.html', '_6/code.html'];

test('iPhone home-screen icon: every main page points at the PNG (not WebP) and the file is a real PNG', () => {
  for (const page of mainPages) {
    const html = fs.readFileSync(path.join(www, page), 'utf8');
    const match = html.match(/<link rel="apple-touch-icon"[^>]*href="([^"]+)"/);
    assert.ok(match, `${page} has an apple-touch-icon`);
    assert.match(match[1], /icons\/apple-touch-icon\.png$/, page);
    const file = path.join(path.dirname(path.join(www, page)), match[1]);
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG', `${page} -> ${match[1]} is a PNG`);
  }
});
