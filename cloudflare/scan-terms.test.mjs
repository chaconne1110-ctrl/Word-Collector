// "AI로 더 정확하게 고르기" (POST /api/scan-terms): input limits, the check that only
// terms really in the read text come back, and the route (off by default, quota, refund).
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import worker from './worker.mjs';
import {validateScanInput, verifyScanTerms, SCAN_TEXT_LIMIT, ScanInputError} from './scan-terms.mjs';

globalThis.crypto ??= webcrypto;
const baseUrl = 'https://word-collector-api-v3.example.workers.dev';
const TEXT = 'Photodiode\nSemiconductor\nPlasmonic\neffect\n\nThe plasmonic effect enhances absorption. ' +
  'A Schottky barrier forms at the metal contact. The dark current is small. ZnO films grow on the substrate.';

test('input: text only, English required, size bounded, mode all|major', () => {
  assert.deepEqual(validateScanInput({text: '  The dark current.  '}), {text: 'The dark current.', mode: 'major'});
  assert.deepEqual(validateScanInput({text: 'Dark current', mode: 'all', field: ' 반도체 '}), {text: 'Dark current', mode: 'all', field: '반도체'});
  for (const bad of [null, [], {}, {text: 5}, {text: '   '}, {text: '전류와 전압'}, {text: 'abc', mode: 'x'},
    {text: 'abc', field: 3}, {text: 'abc', field: 'x'.repeat(61)}, {text: 'a'.repeat(SCAN_TEXT_LIMIT + 1)}]) {
    assert.throws(() => validateScanInput(bad), ScanInputError, JSON.stringify(bad)?.slice(0, 40));
  }
});

test('only terms that are in the text come back, with count and first sentence', () => {
  const terms = verifyScanTerms({terms: ['plasmonic effect', 'Schottky barrier', 'dark current', 'ZnO',
    'photodetector', '광전류', 'quantum dot', 'Plasmonic Effect', 'semiconductor', 'emical', '', 42, 'a'.repeat(130)]}, TEXT);
  assert.deepEqual(terms.map(term => term.term), ['plasmonic effect', 'schottky barrier', 'dark current', 'ZnO', 'semiconductor']);
  const plasmonic = terms[0];
  // "Plasmonic\neffect" (a table row split over two lines) and the sentence: 2 uses.
  assert.equal(plasmonic.count, 2);
  assert.equal(terms.find(term => term.term === 'dark current').sentence, 'The dark current is small.');
  assert.equal(terms.find(term => term.term === 'ZnO').sentence, 'ZnO films grow on the substrate.');
  // Whole words only: "emical" is not taken from "chemical".
  assert.deepEqual(verifyScanTerms({terms: ['emical', 'chemical']}, 'Chemical vapor deposition').map(t => t.term), ['chemical']);
  assert.throws(() => verifyScanTerms({}, TEXT));
  assert.throws(() => verifyScanTerms(null, TEXT));
});

function mockEnv({enabled = true} = {}) {
  const state = {batchCalls: 0, used: 0, refunds: 0, anonRows: new Set()};
  const db = {
    prepare(sql) {
      return {sql, args: [], bind(...args) { this.args = args; return this; },
        async first() {
          if (sql.includes('FROM testers WHERE tester_id')) return state.anonRows.has(this.args[0]) ? {tester_id: this.args[0], is_active: 1} : null;
          if (sql.includes('FROM testers')) return null;
          if (sql.includes('FROM tester_daily_usage')) return {request_count: state.used};
          throw new Error('Unexpected SQL ' + sql);
        },
        async run() {
          if (sql.startsWith('UPDATE ')) { state.refunds++; state.used--; return {success: true}; }
          if (sql.includes('INSERT OR IGNORE INTO testers')) { state.anonRows.add(this.args[0]); return {success: true}; }
          throw new Error('Unexpected SQL ' + sql);
        }};
    },
    async batch(stmts) { state.batchCalls++; state.used++; return stmts.map(() => ({success: true, meta: {changes: 1}})); }
  };
  return {state, env: {DB: db, GEMINI_API_KEY: 'dummy-not-real', ENABLE_LIVE_ANALYSIS: 'true',
    ...(enabled ? {ENABLE_SCAN_TERMS: 'true'} : {})}};
}
const send = (env, body) => worker.fetch(new Request(baseUrl + '/api/scan-terms', {
  method: 'POST', headers: {'Content-Type': 'application/json', 'X-WC-Device': 'wd_' + '3'.repeat(64)},
  body: JSON.stringify(body)
}), env);
async function withGemini(reply, run) {
  const old = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({url: String(url), body: JSON.parse(options.body)}); return reply(); };
  try { await run(calls); } finally { globalThis.fetch = old; }
}
const geminiJson = terms => new Response(JSON.stringify({candidates: [{finishReason: 'STOP',
  content: {parts: [{text: JSON.stringify({terms})}]}}]}));

test('off until ENABLE_SCAN_TERMS=true: no quota, no Gemini', async () => {
  const {env, state} = mockEnv({enabled: false});
  await withGemini(() => geminiJson([]), async calls => {
    const res = await send(env, {text: TEXT});
    assert.equal(res.status, 503);
    assert.match((await res.json()).error, /활성화되지 않았습니다/);
    assert.equal(state.batchCalls, 0);
    assert.equal(calls.length, 0);
  });
});

test('bad input is refused before any quota or Gemini use', async () => {
  const {env, state} = mockEnv();
  await withGemini(() => geminiJson([]), async calls => {
    assert.equal((await send(env, {text: 'a'.repeat(SCAN_TEXT_LIMIT + 1)})).status, 400);
    assert.equal((await send(env, {image: 'data:image/png;base64,AAAA'})).status, 400);
    assert.equal(state.batchCalls, 0);
    assert.equal(calls.length, 0);
  });
});

test('one request: one analysis in the quota, one Gemini call with the text only, verified terms', async () => {
  const {env, state} = mockEnv();
  await withGemini(() => geminiJson(['plasmonic effect', 'made-up term', 'dark current']), async calls => {
    const res = await send(env, {text: TEXT, mode: 'major', field: '반도체'});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.model, 'gemini-4-hydrogen');
    assert.deepEqual(body.terms.map(term => term.term), ['plasmonic effect', 'dark current']);
    assert.equal(state.batchCalls, 1);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /gemini-4-hydrogen:generateContent$/);
    // Only the read text, mode and field are sent: no picture, no file.
    assert.deepEqual(JSON.parse(calls[0].body.contents[0].parts[0].text), {text: TEXT, mode: 'major', field: '반도체'});
    assert.equal(calls[0].body.contents[0].parts.length, 1);
    assert.equal(calls[0].body.generationConfig.responseSchema.properties.terms.type, 'ARRAY');
  });
});

test('a failed Gemini call is refunded to the personal quota', async () => {
  const {env, state} = mockEnv();
  await withGemini(() => new Response('{}', {status: 500}), async () => {
    const res = await send(env, {text: TEXT});
    assert.equal(res.status, 502);
    assert.equal(state.batchCalls, 1);
    assert.equal(state.refunds, 1);
  });
  await withGemini(() => new Response(JSON.stringify({candidates: [{finishReason: 'STOP', content: {parts: [{text: '{"words":[]}'}]}}]})), async () => {
    assert.equal((await send(env, {text: TEXT})).status, 502);
    assert.equal(state.refunds, 2);
  });
});
