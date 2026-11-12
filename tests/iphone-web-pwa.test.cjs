const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const clientSource = fs.readFileSync('www/analysis-api.js','utf8');
const token = 'wc_' + 'b'.repeat(64);
const response = {
  model:'gemini-3.5-flash-lite', en:'Transformer', ko:'변압기',
  discipline:'electrical', pos:'noun', enDef:'Device', koDef:'변압기',
  exampleEn:'A transformer', exampleKo:'변압기', course:'electrical'
};
test('browser retains session-only tester code across pages, but not in localStorage', async () => {
  const state = new Map(), requests = [], local = new Map();
  const sessionStorage = {
    setItem(k,v){state.set(k,v);},getItem(k){return state.get(k)||null;},
    removeItem(k){state.delete(k);}
  };
  function client() {
    const scope={
      sessionStorage,
      localStorage:{setItem(k,v){local.set(k,v);},removeItem(k){local.delete(k);}},
      location:{protocol:'https:'},
      AbortSignal,
      fetch:async (url,init) => {requests.push({url,init});return {status:200,json:async()=>response};}
    };
    scope.globalThis=scope;
    vm.runInNewContext(clientSource,scope,{filename:'analysis-api.js'});
    return scope.WordCollectorAI;
  }
  const page1=client();
  assert.equal((await page1.rememberTesterToken(token)).persistent,false);
  const page2=client();
  assert.equal(await page2.restoreTesterToken(),true);
  await page2.request({term:'Transformer'});
  assert.equal(requests[0].init.headers.Authorization, 'Bearer '+token);
  page2.setLocalServer(true);
  await page2.request({term:'Transformer'});
  assert.equal(requests[1].url, requests[0].url);
  assert.equal(local.size,0);
  await page2.clearTesterToken();
  assert.equal(await client().restoreTesterToken(),false);
});
test('PWA assets are scope-local and static worker never caches API requests', () => {
  const manifest=JSON.parse(fs.readFileSync('www/manifest.webmanifest','utf8'));
  assert.equal(manifest.start_url,'./index.html');
  assert.equal(manifest.scope,'./');
  assert.equal(manifest.display,'standalone');
  assert.match(fs.readFileSync('www/index.html','utf8'),/manifest\.webmanifest/);
  const sw=fs.readFileSync('www/sw.js','utf8');
  assert.match(sw,/req\.method !== 'GET'/);
  assert.match(sw,/url\.origin !== self\.location\.origin/);
  assert.match(sw,/\/api\//);
  const reg=fs.readFileSync('www/pwa-register.js','utf8');
  assert.match(reg,/Capacitor/);
  assert.match(reg,/location\.protocol !== 'https:'/);
});
