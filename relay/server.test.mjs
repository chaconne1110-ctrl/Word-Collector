import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createRelay, upstreamPath, allowedModels, secretMatches} from './server.mjs';

const SECRET = 's'.repeat(40);

async function withRelay(fetchImpl, run) {
  const server = http.createServer(createRelay({env: {RELAY_SECRET: SECRET}, fetchImpl}));
  await new Promise(resolve => server.listen(0, resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try { await run(base); } finally { await new Promise(resolve => server.close(resolve)); }
}

test('only the Worker endpoints are allowed', () => {
  const models = allowedModels({});
  assert.equal(upstreamPath('POST', '/v1beta/models/gemini-3.5-flash-lite:generateContent', models),
    '/v1beta/models/gemini-3.5-flash-lite:generateContent');
  assert.equal(upstreamPath('POST', '/v1beta/models/gemini-3.1-flash-lite-image:generateContent', models),
    '/v1beta/models/gemini-3.1-flash-lite-image:generateContent');
  assert.equal(upstreamPath('GET', '/v1beta/models/gemini-3.5-flash-lite', models), '/v1beta/models/gemini-3.5-flash-lite');
  assert.equal(upstreamPath('POST', '/v1beta/models/gemini-ultra:generateContent', models), null);
  assert.equal(upstreamPath('GET', '/v1beta/models/gemini-3.5-flash-lite:generateContent', models), null);
  assert.equal(upstreamPath('POST', '/v1beta/models/gemini-3.5-flash-lite:streamGenerateContent', models), null);
  assert.equal(upstreamPath('POST', '/v1beta/files', models), null);
  assert.equal(upstreamPath('POST', '/v1beta/models/gemini-3.5-flash-lite:generateContent?alt=sse', models), null);
});

test('secret comparison requires an exact, long secret', () => {
  assert.equal(secretMatches(SECRET, SECRET), true);
  assert.equal(secretMatches(SECRET.slice(1), SECRET), false);
  assert.equal(secretMatches(undefined, SECRET), false);
  assert.equal(secretMatches('short', 'short'), false);
});

test('requests without the relay secret never reach Gemini', async () => {
  let upstreamCalls = 0;
  await withRelay(async () => { upstreamCalls++; return new Response('{}'); }, async base => {
    const res = await fetch(base + '/v1beta/models/gemini-3.5-flash-lite:generateContent', {
      method: 'POST', headers: {'x-goog-api-key': 'k', 'X-Relay-Secret': 'wrong'}, body: '{}'
    });
    assert.equal(res.status, 401);
    const health = await fetch(base + '/healthz');
    assert.equal(health.status, 200);
  });
  assert.equal(upstreamCalls, 0);
});

test('an allowed call is forwarded with the key and body, and Gemini status/body pass through', async () => {
  const seen = [];
  await withRelay(async (url, options) => {
    seen.push({url, options});
    return new Response(JSON.stringify({error: {status: 'FAILED_PRECONDITION'}}), {
      status: 400, headers: {'content-type': 'application/json'}
    });
  }, async base => {
    const res = await fetch(base + '/v1beta/models/gemini-3.5-flash-lite:generateContent', {
      method: 'POST',
      headers: {'x-goog-api-key': 'test-key', 'X-Relay-Secret': SECRET, 'Content-Type': 'application/json'},
      body: JSON.stringify({contents: [{parts: [{text: 'hi'}]}]})
    });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.status, 'FAILED_PRECONDITION');
  });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
  assert.equal(seen[0].options.headers['x-goog-api-key'], 'test-key');
  assert.equal(seen[0].options.headers['X-Relay-Secret'], undefined, 'relay secret is not sent to Google');
  assert.deepEqual(JSON.parse(seen[0].options.body.toString()), {contents: [{parts: [{text: 'hi'}]}]});
});

test('disallowed paths and missing keys are rejected without an upstream call', async () => {
  let upstreamCalls = 0;
  await withRelay(async () => { upstreamCalls++; return new Response('{}'); }, async base => {
    const blocked = await fetch(base + '/v1beta/models/other-model:generateContent', {
      method: 'POST', headers: {'x-goog-api-key': 'k', 'X-Relay-Secret': SECRET}, body: '{}'
    });
    assert.equal(blocked.status, 404);
    const noKey = await fetch(base + '/v1beta/models/gemini-3.5-flash-lite:generateContent', {
      method: 'POST', headers: {'X-Relay-Secret': SECRET}, body: '{}'
    });
    assert.equal(noKey.status, 400);
  });
  assert.equal(upstreamCalls, 0);
});

test('an unreachable Gemini returns 502 without details', async () => {
  await withRelay(async () => { throw new Error('private network detail'); }, async base => {
    const res = await fetch(base + '/v1beta/models/gemini-3.5-flash-lite:generateContent', {
      method: 'POST', headers: {'x-goog-api-key': 'k', 'X-Relay-Secret': SECRET}, body: '{}'
    });
    assert.equal(res.status, 502);
    assert.doesNotMatch(await res.text(), /private network detail/);
  });
});
