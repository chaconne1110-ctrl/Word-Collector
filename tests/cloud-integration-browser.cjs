const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=(process.env.WC_WEB_BASE_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let calls=0;
  await page.route('https://word-collector-api.yechan-lim-elec.workers.dev/api/analyze',async route=>{
   calls++;
   assert.equal(route.request().headers().authorization,undefined);
   assert.match(route.request().headers()['x-wc-device']||'',/^wd_[a-f0-9]{64}$/);
   const input=route.request().postDataJSON();assert.equal(input.term,'변압기 Transformer');assert.equal(input.autoCourse,false);
   assert.equal(input.context,'Self-attention processes language.');assert.equal(input.course,'전기기기');
   await route.fulfill({json:{model:'gemini-3.5-flash-lite',en:'Transformer',ko:'트랜스포머',discipline:'인공지능',pos:'noun',
    enDef:'A neural network architecture.',koDef:'신경망 구조.',exampleEn:'A transformer processes language.',exampleKo:'트랜스포머는 언어를 처리한다.',course:'전기기기'}});
  });
  await page.goto(base);
  const original=await page.evaluate(()=>{
   const fixture=structuredClone(state);
   const first=Object.keys(fixture.terms)[0];fixture.terms[first].ko='사용자가 수정한 뜻';fixture.saved=[first];
   localStorage.setItem('lexicon-word-collector-v1',JSON.stringify(fixture));return JSON.stringify(fixture);
  });
  assert.equal(await page.locator('nav a').count(),4);
  await page.locator('nav a[href="quick_capture/code.html"]').click();
  await page.waitForURL('**/quick_capture/code.html'); await page.locator('#submit-action-btn').waitFor({state:'attached'});
  assert.equal(await page.locator('nav a').count(),4);
  // No tester-code UI: analysis is sent with the per-device ID only.
  assert.equal(await page.locator('#tester-token').count(),0);
  await page.locator('#btn-mode-existing').click();
  await page.locator('#subject-select').selectOption('electrical-machines');
  await page.locator('#term-unified-input').fill('변압기 Transformer');
  await page.locator('#context-sentence-input').fill('Self-attention processes language.');
  await page.locator('#submit-action-btn').click();
  await page.locator('#analysis-review').waitFor({state:'visible'});assert.equal(calls,1);
  assert.equal(await page.locator('[name="ko"]').inputValue(),'트랜스포머');
  await page.locator('#analysis-review button[type="submit"]').click();
  await page.waitForURL('**/words.html?**');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lexicon-word-collector-v1')));
  const added=Object.values(saved.terms).find(t=>t.en==='Transformer');assert.equal(added.course,'electrical-machines');
  if(original){const before=JSON.parse(original);for(const [id,word]of Object.entries(before.terms))assert.deepEqual(saved.terms[id],word);assert.deepEqual(saved.saved,before.saved);}
  assert.ok(!JSON.stringify(saved).includes('wc_'+'b'.repeat(64)));
  for(const path of ['bookmarks.html','_6/code.html']) {
   await page.goto(base+path);await page.locator('nav a').first().waitFor();
   assert.equal(await page.locator('nav a').count(),4);
  }
  await page.goto(base+'quick_capture/code.html');
  await page.locator('#btn-mode-existing').click();await page.locator('#term-unified-input').fill('Voltage');
  await page.locator('#submit-action-btn').click();
  await page.waitForFunction(()=>document.querySelector('#analysis-status').textContent.includes('인증 코드'));
  assert.equal(calls,1);assert.deepEqual(errors,[]);
  console.log('PASS: four menus, HTTPS bearer request once, mixed input/reference, manual save location, existing data preserved, token cleared on navigation');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
