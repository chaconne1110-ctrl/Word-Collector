import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import worker from './worker.mjs';

globalThis.crypto ??= webcrypto;
const token = 'wc_' + 'a'.repeat(64);
const baseUrl = 'https://word-collector-api.example.workers.dev';

async function tokenHash(value) {
  const digest = await crypto.subtle.digest(
    'SHA-256', new TextEncoder().encode(value)
  );
  return Buffer.from(digest).toString('hex');
}
function mockEnv({secret = 'dummy-not-real', live = false, rejectBatch = false} = {}) {
  const state = {calls: [], used: 0, batchCalls: 0, hash: null};
  const db = {
    prepare(sql) {
      const stmt = {
        args: [],
        bind(...args) { this.args = args; return this; },
        async first() {
          if (sql.includes('sqlite_master')) return {total: 3};
          if (sql.includes('FROM testers')) {
            return this.args[0] === state.hash
              ? {tester_id: 'owner-test-01', is_active: 1, expires_at: null}
              : null;
          }
          if (sql.includes('FROM tester_daily_usage')) return {request_count: state.used};
          throw new Error('Unexpected SQL');
        }
      };
      return stmt;
    },
    async batch(stmts) {
      state.batchCalls++;
      assert.equal(stmts.length, 2);
      if (rejectBatch) throw new Error('daily_limit_100');
      state.used++;
      return [
        {success: true, meta: {changes: 1}},
        {success: true, meta: {changes: 1}}
      ];
    }
  };
  return {
    state,
    env: {DB: db, GEMINI_API_KEY: secret,
      ...(live ? {ENABLE_LIVE_ANALYSIS:'true'} : {})}
  };
}

test('health is available without exposing secrets', async () => {
  const {env} = mockEnv();
  const res = await worker.fetch(new Request(baseUrl + '/health'), env);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.model, 'gemini-3.5-flash-lite');
  assert.equal(body.status, 'disabled-for-review');
  assert.equal(body.dailyLimitPerTester, 100);
  assert.equal(body.dailyGlobalLimit, 1000);
  assert.ok(!JSON.stringify(body).includes('dummy-not-real'));
});

test('analyze rejects unauthenticated requests without any reservation', async () => {
  const {env, state} = mockEnv();
  const res = await worker.fetch(new Request(baseUrl + '/api/analyze', {method:'POST'}), env);
  assert.equal(res.status, 401);
  assert.equal(state.batchCalls, 0);
});

test('authenticated usage read does not reserve a call', async () => {
  const {env, state} = mockEnv();
  state.hash = await tokenHash(token);
  const res = await worker.fetch(new Request(baseUrl + '/api/usage', {
    headers: {Authorization: 'Bearer ' + token}
  }), env);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.limit, 100);
  assert.equal(body.remaining, 100);
  assert.equal(state.batchCalls, 0);
});

test('authenticated analyze remains blocked until explicit enable', async () => {
  const {env, state} = mockEnv();
  state.hash = await tokenHash(token);
  const res = await worker.fetch(new Request(baseUrl + '/api/analyze', {
    method:'POST', headers:{Authorization:'Bearer ' + token}
  }), env);
  assert.equal(res.status, 503);
  assert.equal(state.batchCalls, 0);
});

test('admin quota test reserves exactly once without Gemini', async () => {
  const {env, state} = mockEnv();
  state.hash = await tokenHash(token);
  const res = await worker.fetch(new Request(baseUrl + '/internal/quota-test', {
    method:'POST', headers:{
      Authorization:'Bearer ' + token, 'X-Quota-Test':'reserve-once'
    }
  }), env);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(state.batchCalls, 1);
  assert.equal(body.geminiCalled, false);
  assert.equal(body.usage.used, 1);
  assert.equal(body.usage.remaining, 99);
});

test('D1 trigger rejection returns 429 and never calls Gemini', async () => {
  const {env, state} = mockEnv({rejectBatch: true});
  state.hash = await tokenHash(token);
  const res = await worker.fetch(new Request(baseUrl + '/internal/quota-test', {
    method:'POST', headers:{
      Authorization:'Bearer ' + token, 'X-Quota-Test':'reserve-once'
    }
  }), env);
  assert.equal(res.status, 429);
  assert.equal(state.used, 0);
  assert.equal(state.batchCalls, 1);
});
