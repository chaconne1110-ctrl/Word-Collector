const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('input screen offers 일반 의미 / 전공 의미 with a major text field', () => {
  const html = fs.readFileSync('www/quick_capture/code.html', 'utf8');
  assert.match(html, /id="btn-meaning-general"[^>]*onclick="setMeaningMode\('general'\)"/);
  assert.match(html, /id="btn-meaning-major"[^>]*onclick="setMeaningMode\('major'\)"/);
  assert.match(html, /id="major-input"[^>]*maxlength="60"/);
  assert.match(html, /function currentMeaningMode\(\)/);
  const capture = fs.readFileSync('www/quick_capture/capture.js', 'utf8');
  assert.match(capture, /context, meaningMode, majorField, createdAt/);
  const analysis = fs.readFileSync('www/quick_capture/analysis.js', 'utf8');
  assert.match(analysis, /meaningMode: request\.meaningMode === 'general' \? 'general' : 'major'/);
});

test('modern request fallback carries the meaning choice', () => {
  const api = fs.readFileSync('www/analysis-api.js', 'utf8');
  assert.match(api, /meaningMode:payload\.meaningMode/);
  assert.match(api, /majorField:payload\.majorField/);
});

test('servers validate the meaning choice and follow it in the prompt', () => {
  for (const file of ['cloudflare/worker.mjs', 'server/server.cjs']) {
    const src = fs.readFileSync(file, 'utf8');
    assert.match(src, /meaningMode:raw\.meaningMode, majorField:raw\.majorField/, file);
    assert.match(src, /value\.meaningMode === undefined \? 'major' : value\.meaningMode/, file);
    assert.match(src, /inputText\(value\.majorField, '전공', 60\)/, file);
    assert.match(src, /current → 흐름, 현재의/, file);
    assert.match(src, /current \+ 전기공학 → 전류/, file);
    assert.match(src, /"전기공학과"처럼 학과 이름이면/, file);
    assert.match(src, /if \(input\.meaningMode === 'general'\) analysis\.specialization = '일반';/, file);
  }
});
