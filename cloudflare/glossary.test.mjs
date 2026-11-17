import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import worker from './worker.mjs';
import {glossaryKey, glossaryKeys, glossaryApplies, lookupGlossary, glossaryResponse, GLOSSARY_MODEL} from './glossary.mjs';

globalThis.crypto ??= webcrypto;
const baseUrl = 'https://word-collector-api.example.workers.dev';
const ENTRY = {v: 2, en: 'current', ko: '전류', pos: '명사', enDef: 'The movement of electric charge.', koDef: '전하의 움직임.',
  exampleEn: 'When you switch on the lamp, a small current runs through it.', exampleKo: '램프를 켜면 작은 전류가 흐른다.',
  relatedWords: [{en: 'voltage', ko: '전압'}, {en: 'resistance', ko: '저항'}], field: '전기공학',
  references: [{sourceId: 'kuphaldt-lec-dc', pdfPage: 31, printedPage: '21'}], model: 'gemini-4-hydrogen', builtAt: '2026-11-17T00:00:00+00:00'};
const SEMI = {...ENTRY, en: 'threshold voltage', ko: '문턱 전압', field: '반도체', references: [{sourceId: 'paper-semi-01', pdfPage: 3, printedPage: null}]};
const input = (extra = {}) => ({legacy: true, autoSubject: false, word: 'current', meaningMode: 'major', majorField: '전기공학',
  referenceText: '', selectedSubject: 'book', ...extra});

function glossaryDb(rows = {'전기공학|current': ENTRY, '반도체|threshold voltage': SEMI}) {
  const queries = [];
  return {queries, prepare(sql) {
    return {args: [], bind(...args) { this.args = args; return this; },
      async all() {
        if (!sql.includes('FROM glossary_terms')) throw new Error('unexpected ' + sql);
        queries.push(this.args);
        return {results: this.args.filter(key => rows[key]).map(key => ({lookup_key: key, entry_json: JSON.stringify(rows[key])}))};
      }};
  }};
}

test('keys follow the Python rule and try simple singulars', () => {
  assert.equal(glossaryKey('  Dark-Current '), 'dark current');
  assert.deepEqual(glossaryKeys('Resistors'), ['resistors', 'resistor']);
  assert.deepEqual(glossaryKeys('capacitances'), ['capacitances', 'capacitance']);
  assert.deepEqual(glossaryKeys('batteries'), ['batteries', 'battery', 'batterie']);
  assert.deepEqual(glossaryKeys('loss'), ['loss']);
  assert.deepEqual(glossaryKeys('전류'), ['전류']);
});

test('only 전공 의미 in a registered field (전기공학, 반도체), without a reference sentence', () => {
  assert.equal(glossaryApplies(input()), true);
  assert.equal(glossaryApplies(input({majorField: '반도체공학과'})), true);
  assert.equal(glossaryApplies(input({majorField: '전자공학과'})), true);
  assert.equal(glossaryApplies(input({meaningMode: 'general', majorField: ''})), false, '일반 의미 -> Gemini');
  assert.equal(glossaryApplies(input({majorField: '경제학'})), false, 'other majors -> Gemini');
  assert.equal(glossaryApplies(input({referenceText: 'The current in the river was strong.'})), false, 'reference -> Gemini');
  assert.equal(glossaryApplies(input({autoSubject: true})), false);
});

test('lookup returns a checked entry, or null when missing, malformed or the table is absent', async () => {
  const hit = await lookupGlossary(input({word: 'Currents'}), glossaryDb());
  assert.equal(hit.en, 'current');
  assert.equal(await lookupGlossary(input({word: 'dark current'}), glossaryDb()), null);
  assert.equal(await lookupGlossary(input(), glossaryDb({'전기공학|current': {...ENTRY, ko: ''}})), null);
  assert.equal(await lookupGlossary(input(), glossaryDb({'전기공학|current': {...ENTRY, v: 1}})), null, 'old format is ignored');
  // Each field has its own entries: a semiconductor term is found only for a semiconductor major.
  assert.equal((await lookupGlossary(input({word: 'threshold voltage', majorField: '반도체공학'}), glossaryDb())).en, 'threshold voltage');
  assert.equal(await lookupGlossary(input({word: 'threshold voltage'}), glossaryDb()), null);
  assert.equal(await lookupGlossary(input({majorField: '반도체공학'}), glossaryDb()), null);
  const noTable = {prepare() { return {bind() { return this; }, async all() { throw new Error('no such table: glossary_terms'); }}; }};
  assert.equal(await lookupGlossary(input(), noTable), null);
});

test('the response has the app shape and never includes the material, titles or copyright', async () => {
  const entry = await lookupGlossary(input(), glossaryDb());
  const result = glossaryResponse(entry, input({majorField: '전기공학과'}), {withEvidence: true});
  assert.equal(result.model, GLOSSARY_MODEL);
  assert.equal(result.source, 'glossary');
  assert.equal(result.discipline, '전기공학');
  assert.equal(result.course, 'book');
  assert.equal(result.exampleEn, ENTRY.exampleEn);
  assert.equal(result.evidence.status, 'found');
  assert.deepEqual(result.evidence.sources, []);
  assert.match(result.evidence.notes[0], /등록 자료를 참고해 AI가 정리/);
  for (const hidden of ['references', 'kuphaldt', 'pdfPage', 'CC BY']) assert.ok(!JSON.stringify(result).includes(hidden), hidden);
  assert.equal(glossaryResponse(entry, input()).evidence, undefined);
});

// Worker: a hit answers without quota or Gemini; a miss goes on to Gemini as before.
function workerEnv(rows) {
  const state = {batchCalls: 0, glossaryQueries: 0, anon: new Set()};
  const DB = {prepare(sql) {
    return {sql, args: [], bind(...args) { this.args = args; return this; },
      async first() {
        if (sql.includes('FROM testers WHERE tester_id')) return state.anon.has(this.args[0]) ? {tester_id: this.args[0], is_active: 1} : null;
        throw new Error('unexpected ' + sql);
      },
      async run() {
        if (sql.includes('INSERT OR IGNORE INTO testers')) { state.anon.add(this.args[0]); return {success: true}; }
        if (sql.startsWith('UPDATE ')) return {success: true};
        throw new Error('unexpected ' + sql);
      },
      async all() {
        state.glossaryQueries++;
        return {results: this.args.filter(key => rows[key]).map(key => ({lookup_key: key, entry_json: JSON.stringify(rows[key])}))};
      }};
  }, async batch() { state.batchCalls++; throw new Error('stop at quota'); }};
  return {state, env: {DB, GEMINI_API_KEY: 'dummy-not-real', ENABLE_LIVE_ANALYSIS: 'true'}};
}
const send = (env, body, headers = {}) => worker.fetch(new Request(baseUrl + '/api/analyze', {method: 'POST',
  headers: {'X-WC-Device': 'wd_' + '3'.repeat(64), 'Content-Type': 'application/json', 'X-WC-Models': 'gemini-4-hydrogen',
    'X-WC-Evidence': '1', ...headers},
  body: JSON.stringify({term: 'current', course: 'book', autoCourse: false, notebooks: [{course: 'book', words: []}],
    meaningMode: 'major', majorField: '전기공학', ...body})}), env);

test('worker: a glossary hit answers at once without using the quota or Gemini', async () => {
  const {env, state} = workerEnv({'전기공학|current': ENTRY});
  const oldFetch = globalThis.fetch;
  let geminiCalls = 0;
  globalThis.fetch = async () => { geminiCalls++; throw new Error('Gemini must not be called'); };
  try {
    const res = await send(env, {}, {'X-WC-Glossary': '1'});
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.model, 'textbook-glossary');
    assert.equal(body.ko, '전류');
    assert.equal(body.evidence.status, 'found');
    assert.equal(state.batchCalls, 0, 'no quota reserved');
    assert.equal(geminiCalls, 0);
  } finally { globalThis.fetch = oldFetch; }
});

test('worker: a miss, an older app, 일반 의미 or a reference sentence all go to Gemini', async () => {
  const cases = [
    [{term: 'dark current'}, {'X-WC-Glossary': '1'}],
    [{}, {}],
    [{meaningMode: 'general', majorField: ''}, {'X-WC-Glossary': '1'}],
    [{context: 'The current of the river.', translateReference: true}, {'X-WC-Glossary': '1'}],
  ];
  for (const [body, headers] of cases) {
    const {env, state} = workerEnv({'전기공학|current': ENTRY});
    const res = await send(env, body, headers);
    assert.equal(state.batchCalls, 1, JSON.stringify(body) + ' reaches the quota step (then Gemini)');
    assert.notEqual(res.status, 200);
  }
});

test('CORS allows the glossary header', async () => {
  const res = await worker.fetch(new Request(baseUrl + '/api/analyze', {method: 'OPTIONS', headers: {Origin: 'https://localhost'}}), {});
  assert.match(res.headers.get('Access-Control-Allow-Headers'), /X-WC-Glossary/);
});
