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
  // 일반 의미 unless 전공 의미 was chosen with a typed major.
  assert.match(analysis, /meaningMode: request\.meaningMode === 'major' && request\.majorField \? 'major' : 'general'/);
});

test('일반 의미 is the default; 전공 의미 needs a typed major', () => {
  const html = fs.readFileSync('www/quick_capture/code.html', 'utf8');
  assert.match(html, /id="btn-meaning-general" aria-pressed="true"/);
  assert.match(html, /id="btn-meaning-major" aria-pressed="false"/);
  assert.match(html, /<div class="hidden flex flex-col gap-space-xs" id="section-meaning-major">/);
  assert.doesNotMatch(html, /비워 두면 단어장과 참고 문장으로 전공을 판단/);
  const capture = fs.readFileSync('www/quick_capture/capture.js', 'utf8');
  assert.match(capture, /setMeaningMode\(saved\.meaningMode === 'major' \? 'major' : 'general'\)/);
  assert.match(capture, /if \(meaningMode === 'major' && !majorField\) \{/);
  for (const file of ['cloudflare/worker.mjs', 'server/server.cjs']) {
    assert.match(fs.readFileSync(file, 'utf8'), /단어장 이름, 저장 단어, 참고 문장의 분야 때문에 전공 의미\(예: 물리학의 전류\)로 바꾸지 마세요\./, file);
  }
});

test('일반 의미 shows every commonly used part of speech with its meanings', () => {
  for (const file of ['cloudflare/worker.mjs', 'server/server.cjs']) {
    const src = fs.readFileSync(file, 'utf8');
    assert.match(src, /그 단어가 일상에서 많이 쓰이는 품사를 모두 보여 주세요/, file);
    assert.match(src, /"명사: 흐름, 해류 \/ 형용사: 현재의, 지금의"/, file);
    assert.match(src, /pos에는 그 품사들을 같은 순서로 쉼표로 모두 적으세요\(예: 명사, 형용사\)/, file);
    assert.match(src, /"\(noun\) \.\.\.; \(adjective\) \.\.\." 형식/, file);
    assert.match(src, /"\(명사\) \.\.\.; \(형용사\) \.\.\." 형식으로 충실하게 번역/, file);
    assert.doesNotMatch(src, /대표적인 일반 뜻을 1~3개 쉼표로 나열/, file);
  }
  assert.match(fs.readFileSync('www/quick_capture/analysis.js', 'utf8'), /input\.rows = \['en', 'pos'\]\.includes\(key\) \? 1 : 2;/);
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
