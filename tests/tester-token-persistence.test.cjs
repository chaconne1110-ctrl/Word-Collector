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
  const initial=makeNative();
  await initial.request({term:'Transformer'});
  assert.equal(token,code);
  assert.equal(enrolled,1);
  const reopened=makeNative();
  await reopened.request({term:'Transformer'});
  assert.equal(enrolled,1);
  assert.equal(requests.length,2);
  assert.ok(requests.every(c=>c.headers.Authorization==='Bearer '+code));
});
