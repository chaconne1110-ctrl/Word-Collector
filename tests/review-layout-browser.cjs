const assert=require('node:assert/strict');
const {once}=require('node:events');
const {chromium}=require('playwright');
const {createServer}=require('../server/server.cjs');
const {setupAnalysisClient}=require('./browser-client-fixture.cjs');
(async()=>{
 const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 const base=`http://127.0.0.1:${server.address().port}`;
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  for(const [width,height] of [[320,568],[390,844],[844,390],[390,300]]) for(const safe of [0,34]){
   const context=await browser.newContext({viewport:{width,height},screen:{width,height},isMobile:true,hasTouch:true});
   const page=await context.newPage();page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route(/\.(?:html|css)(?:\?.*)?$/,async route=>{
    const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/env\(safe-area-inset-top,\s*0px\)/g,`${safe?24:0}px`).replace(/env\(safe-area-inset-bottom,\s*0px\)/g,`${safe}px`)});
   });
   await setupAnalysisClient(page,()=>{
    window.analysisCalls=0;
    WordCollectorAI.request=input=>{window.analysisCalls++;window.analysisInput=input;return new Promise((resolve,reject)=>{window.finishAnalysis=resolve;window.failAnalysis=reject;});};
    WordCollectorAI.createImage=()=>{throw new Error('Unexpected automatic image request');};
   });
   await page.goto(base+'/index.html');
   await page.evaluate(()=>localStorage.setItem('lexicon-word-collector-v1',JSON.stringify({courses:{book:['아주 긴 단어장 이름 '.repeat(5),'']},terms:{},saved:[]})));
   await page.goto(base+'/quick_capture/code.html?course=book');
   await page.locator('#term-unified-input').fill('ElectromagneticInduction'.repeat(5));
   await page.locator('#btn-meaning-major').click();
   await page.locator('#major-input').fill('전자기학');
   await page.locator('#context-sentence-input').fill('Reference sentence. '.repeat(30));
   await page.locator('#submit-action-btn').click();
   await page.waitForFunction(()=>window.analysisCalls===1);
   assert.equal(await page.locator('#analysis-waiting').evaluate(e=>e.open),true);
   await page.keyboard.press('Tab');await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>document.querySelector('#analysis-waiting').contains(document.activeElement)),true);
   const card=await page.locator('.wc-wait-card').evaluate(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,height:innerHeight,scroll:e.scrollWidth,width:e.clientWidth}));
   assert.ok(card.top>=(safe?24:0)&&card.bottom<=card.height-safe&&card.scroll<=card.width+1,JSON.stringify({width,height,safe,card}));
   await page.locator('#analysis-waiting-cancel').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('#analysis-waiting-cancel').evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e;}),true);
   if(width===320&&safe===0){
    await page.waitForTimeout(3100);
    await page.evaluate(()=>{runAnalysis();runAnalysis();});
    assert.equal(await page.evaluate(()=>window.analysisCalls),1);
   }
   await page.evaluate(()=>window.finishAnalysis({en:'ElectromagneticInduction'.repeat(5),ko:'전자기 유도',discipline:'전기공학',pos:'proper noun',enDef:'Definition '.repeat(90),koDef:'한국어 정의 '.repeat(100),exampleEn:'Example.',exampleKo:'예문.',referenceTranslation:'참고 문장 해석입니다. '.repeat(70),relatedWords:[{en:'induction'},{en:'current'}]}));
   await page.locator('#analysis-review').waitFor({state:'visible'});
   assert.equal(await page.locator('[name=pos]').inputValue(),'고유명사');
   assert.equal(await page.locator('#analysis-waiting').evaluate(e=>e.open),false);
   const geometry=await page.evaluate(()=>{
    const main=document.querySelector('main'),button=document.querySelector('#save-action-btn'),r=button.getBoundingClientRect(),word=document.querySelector('[name=en]').getBoundingClientRect(),pos=document.querySelector('[name=pos]').getBoundingClientRect();
    return {bodyWidth:document.documentElement.scrollWidth,width:innerWidth,mainWidth:main.clientWidth,mainScroll:main.scrollWidth,wordRight:word.right,posLeft:pos.left,
     buttonTop:r.top,buttonBottom:r.bottom,header:document.querySelector('header').getBoundingClientRect().bottom,nav:document.querySelector('nav').getBoundingClientRect().top,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')?.id};
   });
   assert.ok(geometry.bodyWidth<=geometry.width+1&&geometry.mainScroll<=geometry.mainWidth+1&&geometry.wordRight<=geometry.posLeft,JSON.stringify(geometry));
   assert.ok(geometry.buttonTop>=geometry.header&&geometry.buttonBottom<=geometry.nav+1&&geometry.hit==='save-action-btn',JSON.stringify(geometry));
   await page.locator('[name=referenceTranslation]').fill('사용자가 검수한 번역');
   await page.waitForFunction(()=>{const field=document.querySelector('[name=referenceTranslation]').getBoundingClientRect(),main=document.querySelector('main').getBoundingClientRect();return field.top>=main.top&&field.bottom<=main.bottom;});
   if(width===844&&safe===34)await page.screenshot({path:'/tmp/v11-review-landscape.png'});
   await page.locator('#save-action-btn').click();await page.waitForURL('**/words.html?**');
   const terms=await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).terms));assert.equal(terms.length,1);assert.equal(terms[0].referenceTranslation,'사용자가 검수한 번역');
   // A failed or restored request must leave an accessible retry, not a stuck waiting overlay.
   await page.goto(base+'/quick_capture/code.html');await page.locator('#term-unified-input').fill('Current');await page.locator('#submit-action-btn').click();await page.waitForFunction(()=>window.analysisCalls===1);
   await page.evaluate(()=>window.failAnalysis(new Error('검증용 오류')));await page.locator('#analysis-error').waitFor({state:'visible'});assert.equal(await page.locator('#analysis-waiting').evaluate(e=>e.open),false);
   await page.reload();await page.locator('#analysis-error').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>window.analysisCalls),0);
   await page.locator('#analysis-retry').click();await page.waitForFunction(()=>window.analysisCalls===1);
   await page.evaluate(()=>{dispatchEvent(new Event('pagehide'));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
   await page.locator('#analysis-error').waitFor({state:'visible'});assert.equal(await page.locator('#analysis-waiting').evaluate(e=>e.open),false);
   if(width===320&&safe===0){
    await page.goto(base+'/quick_capture/code.html');
    await page.locator('#term-unified-input').fill('Cancel this analysis');
    await page.locator('#submit-action-btn').click();await page.waitForFunction(()=>window.analysisCalls===1);
    await page.keyboard.press('Escape');await page.waitForURL('**/quick_capture/code.html');
    assert.equal(await page.locator('#term-unified-input').inputValue(),'Cancel this analysis');
    assert.equal(await page.locator('#submit-action-btn').isDisabled(),false);
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS: mobile scaling, 8 viewport/inset cases, scrollable modal/focus, duplicate blocking, long review/translation/POS, reachable save, failure/reload and restored-page recovery.');
 }finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
