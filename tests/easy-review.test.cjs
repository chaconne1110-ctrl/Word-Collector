const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('definitions and explanation are written for high-school students (both servers)', () => {
  for (const file of ['cloudflare/worker.mjs', 'server/server.cjs']) {
    const src = fs.readFileSync(file, 'utf8');
    assert.match(src, /englishDefinition은 고등학생이 이해할 수 있는 쉬운 영어/, file);
    // The Korean definition is a faithful translation of the English one (same meaning).
    assert.match(src, /koreanDefinition은 englishDefinition을 그대로 옮긴 충실한 한국어 번역/, file);
    assert.match(src, /두 정의는 반드시 같은 의미여야 합니다/, file);
    assert.doesNotMatch(src, /일상적인 비유나 예를 하나 들어 주세요/, file);
    assert.match(src, /explanation은 고등학생이 이해할 수 있는 쉬운 한국어/, file);
  }
});

test('review shows 단어, 한국어 뜻, 영어/한국어 정의, 영어/한국어 예문, 관련 단어, then 전공 and 단어장; no pictures', () => {
  const js = fs.readFileSync('www/quick_capture/analysis.js', 'utf8');
  const order = ['en', 'ko', 'enDef', 'koDef', 'exampleEn', 'exampleKo', 'pos', 'related', 'discipline'];
  const block = js.slice(js.indexOf('const resultFields = {'), js.indexOf('};', js.indexOf('const resultFields = {')));
  const keys = [...block.matchAll(/^\s+(\w+): '/gm)].map(m => m[1]);
  assert.deepEqual(keys.slice(0, order.length), order);
  assert.match(block, /en: '단어'/);
  assert.match(block, /koDef: '한국어 정의'/);
  assert.match(block, /exampleKo: '한국어 예문'/);
  assert.match(js, /key === 'discipline' \? '#review-fields-top' : '#review-fields'/);
  assert.doesNotMatch(js, /word\.diagram = draft\.diagram/);
  const html = fs.readFileSync('www/quick_capture/review.html', 'utf8');
  const top = html.indexOf('id="review-fields-top"');
  const course = html.indexOf('id="review-course-row"');
  const rest = html.indexOf('id="review-fields"');
  assert.ok(rest > 0 && top > rest && course > top, '나머지 -> 전공 -> 단어장');
  assert.match(html, /<section id="diagram-review" hidden>/);
  assert.doesNotMatch(html, /photo-review|<img/);
});

test('review keeps the order but groups 단어 / 정의 / 예문 in boxes with full accessible names', () => {
  const js = fs.readFileSync('www/quick_capture/analysis.js', 'utf8');
  assert.match(js, /\['단어', \['en', 'ko'\], \{\}\]/);
  assert.match(js, /\['정의', \['enDef', 'koDef'\], \{enDef: '영어', koDef: '한국어'\}\]/);
  assert.match(js, /\['예문', \['exampleEn', 'exampleKo'\], \{exampleEn: '영어', exampleKo: '한국어'\}\]/);
  assert.match(js, /setAttribute\('aria-label', resultFields\[key\]\)/);
  assert.match(fs.readFileSync('www/assets/styles/mobile-layout.css', 'utf8'), /\.review-group > legend/);
});
