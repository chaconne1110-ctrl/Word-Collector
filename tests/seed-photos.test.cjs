const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const seed = new Function(fs.readFileSync('www/data.js', 'utf8') + ';return seed;')();
const app = fs.readFileSync('www/app.js', 'utf8').replace(/\r\n/g, '\n');

test('every first-run word ships with its AI photo (assets/seed-photos/<id>.jpg, a small JPEG)', () => {
  const ids = Object.keys(seed.terms);
  assert.equal(ids.length, 72);
  for (const id of ids) {
    const file = `www/assets/seed-photos/${id}.jpg`;
    assert.ok(fs.existsSync(file), seed.terms[id].en + ': missing photo');
    const bytes = fs.readFileSync(file);
    assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff], seed.terms[id].en + ': not a JPEG');
    assert.ok(bytes.length < 400 * 1024, seed.terms[id].en + ': photo too large');
  }
  // No stray photos for words that are not first-run words.
  for (const name of fs.readdirSync('www/assets/seed-photos')) assert.ok(seed.terms[name.replace(/\.jpg$/, '')], name);
});

test('the built-in photo is used only for a first-run word that is still the same word', () => {
  const start = app.indexOf('function builtInPhotoUrl');
  const end = app.indexOf('\n}\n', start) + 2;
  const builtInPhotoUrl = new Function('seed', app.slice(start, end) + '\nreturn builtInPhotoUrl;')(seed);
  const [id, word] = Object.entries(seed.terms)[0];
  assert.equal(builtInPhotoUrl(id, word), `./assets/seed-photos/${id}.jpg`);
  assert.equal(builtInPhotoUrl(id, {...word, en: ' ' + word.en.toUpperCase() + ' '}), `./assets/seed-photos/${id}.jpg`);
  assert.equal(builtInPhotoUrl(id, {...word, en: 'something else'}), '', 'renamed word: no photo of the old word');
  assert.equal(builtInPhotoUrl('term_user', {en: word.en}), '', "a user's own word has no built-in photo");
  // Both photo spots (flashcard, edit page) fall back to it when the device has no photo.
  assert.equal((app.match(/builtInPhotoUrl\((photoTermId|termId), term\)/g) || []).length, 2);
});
