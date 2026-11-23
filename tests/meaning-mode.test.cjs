const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('input screen offers 일반 의미 / 전공 의미 (with a major text field) / 전공 모름', () => {
  const html = fs.readFileSync('www/quick_capture/code.html', 'utf8');
  assert.match(html, /id="btn-meaning-general"[^>]*onclick="setMeaningMode\('general'\)"/);
  assert.match(html, /id="btn-meaning-major"[^>]*onclick="setMeaningMode\('major'\)"/);
  assert.match(html, /id="btn-meaning-context"[^>]*onclick="setMeaningMode\('context'\)"><span[^>]*>travel_explore<\/span><span[^>]*>전공 모름<\/span>/);
  assert.match(html, /id="major-input"[^>]*maxlength="60"/);
  assert.match(html, /function currentMeaningMode\(\)/);
  const capture = fs.readFileSync('www/quick_capture/capture.js', 'utf8');
  assert.match(capture, /context, meaningMode, majorField, createdAt/);
  const analysis = fs.readFileSync('www/quick_capture/analysis.js', 'utf8');
  // 일반 의미 unless 전공 의미 was chosen with a typed major, or 전공 모름 with a reference sentence.
  assert.match(analysis, /meaningMode: request\.meaningMode === 'major' && request\.majorField \? 'major'\n\s+: request\.meaningMode === 'context' && context \? 'context' : 'general'/);
});

test('일반 의미 is the default; 전공 의미 needs a typed major', () => {
  const html = fs.readFileSync('www/quick_capture/code.html', 'utf8');
  assert.match(html, /id="btn-meaning-general" aria-pressed="true"/);
  assert.match(html, /id="btn-meaning-major" aria-pressed="false"/);
  assert.match(html, /<div class="hidden flex flex-col gap-space-xs" id="section-meaning-major">/);
  assert.doesNotMatch(html, /비워 두면 단어장과 참고 문장으로 전공을 판단/);
  const capture = fs.readFileSync('www/quick_capture/capture.js', 'utf8');
  assert.match(capture, /setMeaningMode\(\['major', 'context'\]\.includes\(saved\.meaningMode\) \? saved\.meaningMode : 'general'\)/);
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
  // 한국어 뜻 starts at one line and grows with the text (several parts of speech fit);
  // 관련 단어 starts at two lines, one "word(뜻)" each.
  assert.match(fs.readFileSync('www/quick_capture/analysis.js', 'utf8'), /input\.rows = \['en', 'pos', 'discipline', 'ko'\]\.includes\(key\) \? 1 : 2;/);
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

test('일반 의미 hides the reference card and sends no reference; 전공 모름 requires one and shows the found field', () => {
  const html = fs.readFileSync('www/quick_capture/code.html', 'utf8');
  // Card 4 is hidden by default (일반 의미 is the default) and toggled with the meaning mode.
  assert.match(html, /border border-outline-variant\/30 hidden" id="reference-card">/);
  assert.match(html, /document\.getElementById\('reference-card'\)\.classList\.toggle\('hidden', mode === 'general'\)/);
  assert.match(html, /document\.getElementById\('reference-required'\)\.classList\.toggle\('hidden', mode !== 'context'\)/);
  const capture = fs.readFileSync('www/quick_capture/capture.js', 'utf8');
  assert.match(capture, /const context = meaningMode === 'general' \? '' : contextInput\.value\.trim\(\);/);
  assert.match(capture, /if \(meaningMode === 'context' && !context\) \{\n\s+status\.textContent = '전공을 모를 때는 단어가 쓰인 참고 문장을 입력해 주세요\.';/);
  const analysis = fs.readFileSync('www/quick_capture/analysis.js', 'utf8');
  assert.match(analysis, /참고 문장으로 찾은 가장 관련 있는 전공: \$\{foundField\}/);
  assert.match(fs.readFileSync('www/quick_capture/review.html', 'utf8'), /<p id="review-context-field" hidden/);
  for (const file of ['cloudflare/worker.mjs', 'server/server.cjs']) {
    const src = fs.readFileSync(file, 'utf8');
    assert.match(src, /\['general', 'major', 'context'\]\.includes\(meaningMode\)/, file);
    assert.match(src, /if \(meaningMode === 'context' && !referenceText\) failInput\('전공을 모를 때는 단어가 쓰인 참고 문장이 필요합니다\.'\);/, file);
    assert.match(src, /meaningMode="context"이면 사용자가 전공 분야를 전혀 모르는 경우입니다\. referenceText에서 이 단어가 실제로 쓰인 뜻으로 분석하고, specialization에는 그 뜻과 가장 관련이 깊은 전공\(학문 분야\) 하나를/, file);
  }
});

test('server: 전공 모름 is accepted with a reference sentence and rejected without one', async () => {
  const {createServer} = require('../server/server.cjs');
  const {once} = require('node:events');
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/api/analyze`;
  const send = body => fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({term: 'current', course: 'book', autoCourse: false, notebooks: [{course: 'book', words: []}], ...body})});
  try {
    const missing = await send({meaningMode: 'context'});
    assert.equal(missing.status, 400);
    assert.match((await missing.json()).error, /전공을 모를 때는 단어가 쓰인 참고 문장이 필요합니다/);
    const unknown = await send({meaningMode: 'guess', context: 'The current flows.'});
    assert.equal(unknown.status, 400);
    assert.match((await unknown.json()).error, /의미 기준\(일반\/전공\/전공 모름\)/);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
