const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('www/analysis-api.js', 'utf8');
const token = 'wc_' + 'a'.repeat(64);
const valid = {
  model: 'gemini-3.5-flash-lite', en: 'Transformer', ko: '변압기',
  discipline: '전기공학', pos: 'noun', enDef: 'Transformer',
  koDef: '변압기', exampleEn: 'A transformer', exampleKo: '변압기',
  course: 'electromagnetics'
};
function client(store, requests) {
  const scope = {Capacitor: {getPlatform: () => 'ios', Plugins: {
    TesterTokenStore: store,
    CapacitorHttp: {request: async request => {
      requests.push(request);
      return {status: 200, data: valid};
    }}
  }}};
  scope.globalThis = scope;
  vm.runInNewContext(source, scope, {filename: 'www/analysis-api.js'});
  return scope.WordCollectorAI;
}
test('iPhone credentials survive reloads through native Keychain and requests use HTTPS', async () => {
  let value = '';
  const requests = [];
  const store = {
    async save({token}) { value = token; },
    async read() { return {token: value}; },
    async clear() { value = ''; }
  };
  const one = client(store, requests);
  assert.equal((await one.rememberTesterToken(token)).persistent, true);
  const two = client(store, requests);
  assert.equal(await two.restoreTesterToken(), true);
  await two.request({term: 'Transformer'});
  assert.equal(requests[0].url, 'https://word-collector-api.yechan-lim-elec.workers.dev/api/analyze');
  assert.equal(requests[0].headers.Authorization, 'Bearer ' + token);
  two.setLocalServer(true);
  await two.request({term: 'Transformer'});
  assert.equal(requests[1].url, requests[0].url);
  await two.clearTesterToken();
  assert.equal(value, '');
});
test('iOS never stores credentials insecurely if native Keychain bridge is absent', async () => {
  const api = client({}, []);
  await assert.rejects(() => api.rememberTesterToken(token), /안전 저장/);
  await assert.rejects(() => api.restoreTesterToken(), /안전 저장/);
});
test('native iOS build includes Keychain and Files export', () => {
  const native = fs.readFileSync('scripts/ios/NativeBridge.swift', 'utf8');
  assert.match(native, /kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly/);
  assert.match(native, /kSecAttrSynchronizable/);
  assert.match(native, /UIDocumentPickerViewController/);
  assert.match(native, /registerPluginInstance\(TesterTokenStorePlugin\(\)\)/);
  assert.match(native, /registerPluginInstance\(WordExportPlugin\(\)\)/);
});
