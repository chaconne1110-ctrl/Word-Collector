const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');
(async () => {
  const server = createServer(); server.listen(0,'127.0.0.1'); await once(server,'listening');
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
    const page = await browser.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    const base=`http://127.0.0.1:${server.address().port}`;
    await page.addInitScript(()=>{
      const word={course:'book',en:'Electromagnetic induction',ko:'전자기 유도',enDef:'A long definition. '.repeat(50),referenceSentence:'A reference sentence. '.repeat(25),referenceTranslation:'참고 문장 해석. '.repeat(60)};
      localStorage.setItem('lexicon-word-collector-v1',JSON.stringify({courses:{book:['아주 긴 전자기학 단어장 이름 '.repeat(3),'']},terms:{a:word,b:{...word,en:'Current'},c:{...word,en:'Voltage'}},saved:[]}));
    });
    let inset=0;
    await page.route(/\.(?:html|css)(?:\?.*)?$/, async route=>{
      const response=await route.fetch();
      await route.fulfill({response,body:(await response.text()).replace(/env\(safe-area-inset-top,\s*0px\)/g,`${inset?24:0}px`).replace(/env\(safe-area-inset-bottom,\s*0px\)/g,`${inset}px`)});
    });
    const idle=()=>page.waitForFunction(()=>!document.querySelector('#cardsScrollContainer').hasAttribute('aria-busy'));
    const selected=()=>page.locator('article[data-term-id]').getAttribute('data-term-id');
    for(const [width,height] of [[320,568],[390,844],[844,390]]) for(inset of [0,34]) {
      await page.setViewportSize({width,height}); await page.goto(base+'/flashcard.html?term=a');
      assert.equal(await page.locator('#card-navigation,[aria-label="이전 단어"],[aria-label="다음 단어"]').count(),0);
      const geometry=await page.locator('#cardsScrollContainer').evaluate(e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}));
      assert.equal(geometry.left,16);assert.equal(geometry.right,width-16);
      // Synthetic rapid taps are deliberate: the app lock must work without Playwright waiting for stability.
      await page.evaluate(()=>{const button=document.querySelector('.card-front [data-action=flip]');button.click();button.click();button.click();});
      assert.ok(await page.locator('#cardsScrollContainer').getAttribute('aria-busy'));
      assert.ok(await page.evaluate(()=>document.getAnimations().some(a=>a.effect.getKeyframes().some(f=>f.transform?.includes('rotateY(90deg)')))));
      await idle(); assert.ok(await page.locator('.card-back').isVisible());
      assert.equal(await page.locator('.card-front').isVisible(),false);
      for(const selector of ['.card-back','.card-front']) {
        if(selector==='.card-front') { await page.locator('#cardsScrollContainer').focus();await page.keyboard.press('ArrowLeft');await idle(); }
        const face=page.locator(selector);
        const bounds=await face.evaluate(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,width:e.clientWidth,scroll:e.scrollWidth,header:document.querySelector('header').getBoundingClientRect().bottom,nav:document.querySelector('nav').getBoundingClientRect().top}));
        assert.ok(bounds.top>=bounds.header&&bounds.bottom<=bounds.nav&&bounds.scroll<=bounds.width+1,JSON.stringify(bounds));
        await face.evaluate(e=>{e.scrollTop=e.scrollHeight;});assert.ok(await face.evaluate(e=>e.scrollTop>0));
      }
      await page.locator('#cardsScrollContainer').focus();
      await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');
      assert.ok(await page.evaluate(()=>document.getAnimations().some(a=>a.effect.getKeyframes().some(f=>f.transform?.includes('rotateX(14deg)')))));
      await idle();assert.equal(await selected(),'b');
      assert.equal(await page.locator('.card-front').evaluate(e=>e.scrollTop),0);
      await page.keyboard.press('ArrowUp');await idle();assert.equal(await selected(),'a');
      await page.keyboard.press('ArrowUp');assert.equal(await page.locator('#cardsScrollContainer').getAttribute('aria-busy'),null);
      // Navigation/page restore cancels in-flight motion without leaving a hidden card.
      await page.keyboard.press('ArrowDown');
      await page.evaluate(()=>{dispatchEvent(new Event('pagehide'));dispatchEvent(new Event('pageshow'));});
      await idle();assert.ok(await page.locator('.card-front').isVisible());
      assert.equal(await page.evaluate(()=>document.getAnimations().filter(a => a.effect.target.matches('.card-flipper')).length),0);
      if(width===390&&inset===34)await page.screenshot({path:'/tmp/flashcard-3d-ready.png'});
    }
    await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'/flashcard.html?term=a');
    await page.locator('.card-front [data-action=flip]').last().click();
    assert.ok(await page.locator('.card-back').isVisible());
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a => a.effect.target.matches('.card-flipper')).length),0);
    await page.locator('#cardsScrollContainer').focus();await page.keyboard.press('ArrowDown');
    assert.equal(await selected(),'b');assert.equal(await page.locator('#cardsScrollContainer').getAttribute('aria-busy'),null);
    assert.deepEqual(errors,[]);
    console.log('PASS: 3D flip/word animations, rapid-input lock, removed arrows/full width, 6 viewport/inset cases, scrolling both faces, boundaries, page restoration and reduced motion.');
  } finally {await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
