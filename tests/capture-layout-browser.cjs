const assert=require('node:assert/strict');
const {once}=require('node:events');
const {chromium}=require('playwright');
const {createServer}=require('../server/server.cjs');
(async()=>{
 const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage();page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let safe=0;
 await page.route(/\.(?:html|css)(?:\?.*)?$/,async route=>{
  const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace(/env\(safe-area-inset-top\s*,\s*0px\)/g,`${safe?24:0}px`).replace(/env\(safe-area-inset-bottom\s*,\s*0px\)/g,`${safe}px`)});
 });
 try {
  await page.goto(base+'/index.html');
  await page.evaluate(()=>localStorage.setItem('lexicon-word-collector-v1',JSON.stringify({courses:{book:['전기공학과 반도체 기초 이론 단어장','']},terms:{},saved:[]})));
  for(const [width,height] of [[320,568],[390,844],[844,390]]) for(safe of [0,34]){
   await page.setViewportSize({width,height});await page.goto(base+'/quick_capture/code.html');
   const text=await page.locator('body').textContent();
   for(const removed of ['AI 어시스턴트 활성','논문 및 전공 원서 맞춤형 AI 추출 파이프라인','분석 결과는 검수 후 단어장에 저장할 수 있어요.','영문 표제어, 국문 역어, 병기 표기 모두 입력 가능하며 AI가 형태소 및 어휘를 자동 파싱합니다.','PDF / 자료 첨부','카메라 스캔 OCR']) assert.ok(!text.includes(removed),removed);
   assert.equal(await page.locator('#btn-mode-direct,#section-mode-direct,#tab-ref-pdf,#tab-ref-sentence,#ref-section-pdf,#custom-subject-input').count(),0);
   await page.locator('#term-unified-input').fill('current');
   await page.locator('#btn-mode-ai').click();
   assert.ok(await page.locator('#section-mode-ai').isVisible());
   await page.locator('#btn-mode-existing').click();
   assert.ok(await page.locator('#section-mode-existing').isVisible());
   await page.locator('#context-sentence-input').fill('Current flows through a conductor.');
   await page.locator('#ai-auth-settings summary').click();
   await page.locator('#tester-token').fill('wc_'+'a'.repeat(64));
   await page.locator('#ai-auth-settings summary').click();
   const geometry=await page.evaluate(()=>{
    const button=document.querySelector('#submit-action-btn').getBoundingClientRect();
    const bar=document.querySelector('#analysis-action-bar').getBoundingClientRect();
    const nav=document.querySelector('nav').getBoundingClientRect();
    return {bodyWidth:document.documentElement.scrollWidth,buttonTop:button.top,buttonBottom:button.bottom,barBottom:bar.bottom,navTop:nav.top,
     hit:document.elementFromPoint(button.x+button.width/2,button.y+button.height/2)?.closest('button')?.id};
   });
   assert.ok(geometry.bodyWidth<=width,JSON.stringify({width,height,safe,...geometry}));
   assert.ok(geometry.barBottom<=geometry.navTop+1,JSON.stringify(geometry));
   assert.equal(geometry.hit,'submit-action-btn');
   // Run the remaining analysis UI with deterministic model/photo responses.
   await page.evaluate(()=>{
    WordCollectorAI.request=async()=>({en:'current',ko:'전류',discipline:'전기',pos:'noun',enDef:'Charge flow.',koDef:'전하의 흐름',exampleEn:'Current flows.',exampleKo:'전류가 흐릅니다.',referenceTranslation:'전류가 도체를 통해 흐릅니다.',model:'gemini-3.5-flash-lite'});
    WordCollectorAI.createImage=async()=>{throw new Error('test image failure');};
   });
   await page.locator('#submit-action-btn').click();
   await page.locator('#analysis-review').waitFor({state:'visible'});
   await page.locator('[name=referenceTranslation]').fill('화면 검증용 해석');
   await page.locator('#analysis-review button[type=submit]').click();
   await page.waitForURL('**/words.html?**');
   await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('lexicon-word-collector-v1'));s.terms={};localStorage.setItem('lexicon-word-collector-v1',JSON.stringify(s));});
   if(width===320 && safe===34){await page.goto(base+'/quick_capture/code.html');await page.screenshot({path:'/tmp/capture-clean-320.png',fullPage:true});}
  }
  await page.evaluate(()=>localStorage.removeItem('lexicon-word-collector-v1'));
  await page.goto(base+'/quick_capture/code.html');
  assert.ok(await page.locator('#no-notebooks').isVisible());
  assert.ok(await page.locator('#section-mode-ai').isVisible());
  assert.ok(await page.locator('#btn-mode-existing').isDisabled());
  await page.locator('#no-notebooks a').click();await page.waitForURL('**/index.html');
  assert.ok(await page.locator('#create-notebook').isVisible());
  assert.deepEqual(errors,[]);
  console.log('PASS: removed controls/text, two modes, authentication, analysis/review/save, no horizontal overflow or action/menu overlap at 320/390/844px and safe insets 0/34, empty-notebook home link.');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
