const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {sanitize} = require('../www/evidence.js');

const found = {status: 'found', message: '등록 자료에서 이 의미를 설명하는 근거를 찾았어요.', limitation: '',
  explanation: {ko: '전류는 전자의 흐름이다.', en: 'Current is the flow of electrons.'},
  notes: ['뜻·정의·예문은 AI가 만든 내용이며 자료로 검증되지 않았어요.'],
  sources: [{sourceId: 'kuphaldt-lec-dc', title: 'Lessons In Electric Circuits, Volume I - DC', author: 'Tony R. Kuphaldt',
    url: 'https://www.ibiblio.org/kuphaldt/electricCircuits/DC/DC.pdf', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    quotes: [{text: 'Electric current is the flow of electrons.', verified: true, pdfPage: 31, printedPage: '21'},
      {text: 'model-made quote', verified: false, pdfPage: 3}]}]};

test('only verified quotes and https links survive; pages are kept as numbers', () => {
  const clean = sanitize(found);
  assert.equal(clean.status, 'found');
  assert.deepEqual(clean.sources[0].quotes, [{text: 'Electric current is the flow of electrons.', verified: true, pdfPage: 31, printedPage: '21'}]);
  const bad = sanitize({...found, sources: [{...found.sources[0], url: 'javascript:alert(1)'}]});
  assert.deepEqual(bad.sources, [], 'a source without a safe link is dropped');
});

test('missing, unknown or failed evidence is never shown as verified', () => {
  for (const raw of [undefined, null, {status: 'verified'}, 'found']) assert.equal(sanitize(raw).status, 'unavailable');
  const notFound = sanitize({status: 'not_found', message: '관련 근거를 찾지 못했어요.', explanation: {ko: 'should not show'}, sources: []});
  assert.equal(notFound.explanation, null, 'an explanation is kept only for status found');
});

test('review and flashcard show 근거 보기 and the word keeps its evidence', () => {
  const analysis = fs.readFileSync('www/quick_capture/analysis.js', 'utf8');
  assert.match(analysis, /WordCollectorEvidence\.attach\(\$\('#review-evidence'\), evidence\);/);
  assert.match(analysis, /if \(draft\.evidence\) word\.evidence = draft\.evidence;/);
  assert.match(fs.readFileSync('www/quick_capture/review.html', 'utf8'), /data-step="evidence"[^>]*>.*자료 근거 검색/);
  assert.match(fs.readFileSync('www/app.js', 'utf8'), /WordCollectorEvidence\.attach\(\$\('\.card-back', card\)\.firstElementChild, term\.evidence\)/);
  assert.match(fs.readFileSync('www/analysis-api.js', 'utf8'), /'X-WC-Evidence': '1'/);
  const evidence = fs.readFileSync('www/evidence.js', 'utf8');
  assert.doesNotMatch(evidence, /innerHTML|insertAdjacentHTML|outerHTML/);
});

test('catalog used by the server matches rag/sources.json for registered sources', async () => {
  const {RAG_CATALOG} = await import('../cloudflare/rag-catalog.mjs');
  const sources = JSON.parse(fs.readFileSync('rag/sources.json', 'utf8'));
  const registered = sources.sources.filter(source => source.register);
  assert.equal(RAG_CATALOG.catalogVersion, sources.catalogVersion);
  assert.deepEqual(RAG_CATALOG.sources.map(source => source.id), registered.map(source => source.id));
  for (const source of registered) {
    const runtime = RAG_CATALOG.sources.find(item => item.id === source.id);
    for (const key of ['title', 'author', 'edition', 'url', 'license', 'licenseUrl', 'checkedAt']) assert.equal(runtime[key], source[key], source.id + ' ' + key);
    assert.deepEqual(runtime.restrictedPdfPages, source.restrictedElements.flatMap(element => element.pdfPages));
  }
  const openstax = sources.sources.find(source => source.id === 'openstax-university-physics-2');
  assert.equal(openstax.register, false);
});
