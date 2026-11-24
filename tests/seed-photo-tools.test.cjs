// tools/generate-seed-photos.mjs must work from any folder (spaces, Korean) and must never
// make a paid call it was not asked for. These runs have no key and no relay secret, and are
// set up so that no photo is ever requested.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const seed = new Function(fs.readFileSync('www/data.js', 'utf8') + ';return seed;')();
const ids = Object.keys(seed.terms);

// Every temporary copy is removed when its test ends, passed or failed.
function copyProject(t) {
  // A path like the USB's "D:\Word Collector" or a Korean Desktop folder.
  const base = fs.mkdtempSync(path.join(os.tmpdir(), '경로 테스트 '));
  t.after(() => fs.rmSync(base, {recursive: true, force: true}));
  const root = path.join(base, 'Word Collector');
  for (const file of ['tools/generate-seed-photos.mjs', 'www/data.js', 'cloudflare/deploy/wrangler.v3.jsonc',
    ...fs.readdirSync('cloudflare').filter(name => name.endsWith('.mjs') && !name.endsWith('.test.mjs')).map(name => 'cloudflare/' + name)]) {
    fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
    fs.copyFileSync(file, path.join(root, file));
  }
  return root;
}
function run(root, outDir, ...args) {
  return spawnSync(process.execPath, [path.join(root, 'tools/generate-seed-photos.mjs'), outDir, ...args],
    {cwd: root, encoding: 'utf8', env: {...process.env, GEMINI_API_KEY: '', GEMINI_RELAY_SECRET: ''}});
}

test('generate-seed-photos runs from a folder with spaces and Korean; existing photos are skipped', t => {
  const root = copyProject(t);
  const outDir = path.join(root, '사진 원본');
  fs.mkdirSync(outDir);
  for (const id of ids) fs.writeFileSync(path.join(outDir, id + '.jpg'), '');
  const result = run(root, outDir);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /made 0, already there 72, failed 0\s*$/);
});

test('generate-seed-photos limit 0 makes no photo and reports how many are missing', t => {
  const root = copyProject(t);
  const outDir = path.join(root, '빈 폴더');
  const result = run(root, outDir, '0');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /made 0, already there 0, failed 0, not made \(limit 0\) 72\s*$/);
  assert.deepEqual(fs.readdirSync(outDir), []);
});

test('generate-seed-photos refuses a limit that is not a whole number of 0 or more', t => {
  const root = copyProject(t);
  for (const bad of ['-1', 'abc', '1.5']) {
    const result = run(root, path.join(root, 'out'), bad);
    assert.notEqual(result.status, 0, bad);
    assert.match(result.stderr, /limit must be a whole number of 0 or more/);
  }
});
