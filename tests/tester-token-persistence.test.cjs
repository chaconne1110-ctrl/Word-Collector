const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('www/analysis-api.js', 'utf8');
const code = 'wc_' + 'a'.repeat(64);

const response = {
  model: 'gemini-3.5-flash-lite',
  en: 'Transformer', ko: '변압기', discipline: '전기기기', pos: 'noun',
  enDef: 'An electrical transformer.', koDef: '변압기.',
  exampleEn: 'The transformer steps down voltage.',
  exampleKo: '변압기가 전압을 낮춘다.', course: '전기기기'
};

function makeAndroid(store, requests) {
  const scope = {
    Capacitor: {
      getPlatform: () => 'android',
      Plugins: {
        TesterTokenStore: store,
        CapacitorHttp: {
          request: async call => {
            requests.push(call);
            return {status: 200, data: response};
          }
        }
      }
    }
  };
  scope.globalThis = scope;
  vm.runInNewContext(source, scope, {filename: 'www/analysis-api.js'});
  return scope.WordCollectorAI;
}

test('Android tester code survives page reloads and is never stored in JS localStorage', async () => {
  let saved = '';
  const requests = [];
  const store = {
    async save({token}) { saved = token; return {}; },
    async read() { return {token: saved}; },
    async clear() { saved = ''; return {}; }
  };
  const page1 = makeAndroid(store, requests);
  const result = await page1.rememberTesterToken(code);
  assert.equal(result.persistent, true);
  assert.equal(saved, code);

  const page2 = makeAndroid(store, requests);
  assert.equal(await page2.restoreTesterToken(), true);
  const analysis = await page2.request({term: 'Transformer'});
  assert.equal(analysis.en, 'Transformer');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].headers.Authorization, 'Bearer ' + code);
  assert.equal(requests[0].url, 'https://word-collector-api.yechan-lim-elec.workers.dev/api/analyze');

  page2.setLocalServer(true);
  await page2.request({term: 'Transformer'});
  assert.equal(requests[1].url, 'http://127.0.0.1:8787/api/analyze');
  assert.equal(Object.hasOwn(requests[1].headers, 'Authorization'), false);
  assert.equal(saved, code);

  await page2.clearTesterToken();
  assert.equal(saved, '');
  const page3 = makeAndroid(store, requests);
  assert.equal(await page3.restoreTesterToken(), false);
  await page3.request({term: 'Transformer'});
  assert.equal(Object.hasOwn(requests.at(-1).headers, 'Authorization'), false);
});

test('Android refuses to silently save credentials when native secure plugin is missing', async () => {
  const api = makeAndroid({}, []);
  await assert.rejects(() => api.rememberTesterToken(code), /최신 APK/);
  await assert.rejects(() => api.restoreTesterToken(), /최신 APK/);
});

test('Browser credentials remain temporary and are not persisted', async () => {
  const calls = [];
  function makeBrowser() {
    const scope = {
      AbortSignal,
      fetch: async (url, data) => {
        calls.push({url, data});
        return {status: 200, json: async () => response};
      }
    };
    scope.globalThis = scope;
    vm.runInNewContext(source, scope, {filename: 'www/analysis-api.js'});
    return scope.WordCollectorAI;
  }
  const page1 = makeBrowser();
  assert.equal((await page1.rememberTesterToken(code)).persistent, false);
  await page1.request({term: 'Transformer'});
  assert.equal(calls.length, 1);
  assert.equal(calls[0].data.headers.Authorization, 'Bearer ' + code);
  const page2 = makeBrowser();
  assert.equal(await page2.restoreTesterToken(), false);
  await page2.request({term: 'Transformer'});
  assert.equal(calls.length, 2);
  assert.equal(Object.hasOwn(calls[1].data.headers, 'Authorization'), false);
});

test('Android securely persists newly issued anonymous credentials and reuses them without another registration', async () => {
  let token = '', enrolled = 0;
  const requests = [];
  const store = {
    async save(value) { token = value.token; return {}; },
    async read() { return {token}; },
    async clear() { token = ''; return {}; }
  };
  function makeNative() {
    const scope = {
      Capacitor:{
        getPlatform:()=> 'android',
        Plugins:{
          TesterTokenStore:store,
          CapacitorHttp:{request:async call=>{requests.push(call);return {status:200,data:response};}}
        }
      },
      WordCollectorAnonymousAuth:{async acquire(){enrolled++;return code;}}
    };
    scope.globalThis=scope;
    vm.runInNewContext(source,scope,{filename:'www/analysis-api.js'});
    return scope.WordCollectorAI;
  }
  // Turnstile enrollment is opt-in (explicit ensureAutoAuth); plain requests
  // use the per-device public quota and never start enrollment by themselves.
  const initial=makeNative();
  await initial.ensureAutoAuth();
  await initial.request({term:'Transformer'});
  assert.equal(token,code);
  assert.equal(enrolled,1);
  const reopened=makeNative();
  await reopened.request({term:'Transformer'});
  assert.equal(enrolled,1);
  assert.equal(requests.length,2);
  assert.ok(requests.every(c=>c.headers.Authorization==='Bearer '+code));
});

function makeNativeWith(store, handler) {
  const memory = new Map();
  const scope = {
    crypto: require('node:crypto').webcrypto,
    localStorage: {getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v), removeItem: k => memory.delete(k)},
    Capacitor: {
      getPlatform: () => 'android',
      Plugins: {TesterTokenStore: store, CapacitorHttp: {request: handler}}
    }
  };
  scope.globalThis = scope;
  vm.runInNewContext(source, scope, {filename: 'www/analysis-api.js'});
  return scope.WordCollectorAI;
}

test('Android: an unreadable stored code is dropped and analysis proceeds with the device ID', async () => {
  let cleared = 0;
  const calls = [];
  const store = {
    async read() { throw new Error('저장된 인증 코드를 읽지 못했습니다. 인증 코드를 지우고 다시 등록해 주세요.'); },
    async save() { return {}; },
    async clear() { cleared++; return {}; }
  };
  const ai = makeNativeWith(store, async call => { calls.push(call); return {status: 200, data: response}; });
  await ai.request({term: 'Transformer'});
  assert.equal(cleared, 1);
  assert.equal(calls.length, 1);
  assert.equal(Object.hasOwn(calls[0].headers, 'Authorization'), false);
  assert.match(calls[0].headers['X-WC-Device'], /^wd_[a-f0-9]{64}$/);
});

test('Android: a stored code rejected with 401 is forgotten and the request is re-sent once without it', async () => {
  let stored = code;
  const calls = [];
  const store = {
    async read() { return {token: stored}; },
    async save(v) { stored = v.token; return {}; },
    async clear() { stored = ''; return {}; }
  };
  const ai = makeNativeWith(store, async call => {
    calls.push(call);
    return call.headers.Authorization
      ? {status: 401, data: {error: '유효한 테스터 인증이 필요합니다.'}}
      : {status: 200, data: response};
  });
  await ai.request({term: 'Transformer'});
  assert.equal(calls.length, 2);
  assert.equal(calls[0].headers.Authorization, 'Bearer ' + code);
  assert.equal(Object.hasOwn(calls[1].headers, 'Authorization'), false);
  assert.equal(stored, '');
  // Later requests go straight to the device-ID path.
  await ai.request({term: 'Transformer'});
  assert.equal(calls.length, 3);
  assert.equal(Object.hasOwn(calls[2].headers, 'Authorization'), false);
});

test('Android: non-401 errors with a stored code are not retried', async () => {
  const calls = [];
  const store = {async read() { return {token: code}; }, async save() { return {}; }, async clear() { return {}; }};
  const ai = makeNativeWith(store, async call => { calls.push(call); return {status: 429, data: {error: '한도 초과'}}; });
  await assert.rejects(() => ai.request({term: 'Transformer'}), /한도 초과/);
  assert.equal(calls.length, 1);
});
