const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');

(async () => {
  const reference = 'Current flows through the conductor.\nContextual notes: AI 생성 예문.';
  const translation = '전류가 도체를 통해 흐릅니다.\n도체가 따뜻해집니다.';
  let calls = 0;
  const server = createServer({apiKey:'test-only',fetchImpl:async (_, init) => {
    calls++;
    const payload = JSON.parse(init.body);
    assert.equal(JSON.parse(payload.contents[0].parts[0].text).referenceText,reference);
    assert.ok(payload.generationConfig.responseSchema.required.includes('referenceTranslation'));
    return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({
      englishTerm:'current',koreanMeaning:'전류',specialization:'전기공학',notebookName:'전기',
      englishDefinition:'A flow of electric charge.',koreanDefinition:'전하의 흐름.',
      exampleSentence:'The current is measured.',exampleKo:'전류를 측정합니다.',pos:'noun',
      explanation:'전하의 이동',recommendationReason:'문맥',relatedTerms:[],referenceTranslation:translation
    })}]}}]}));
  }});
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
    const context = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      if (!localStorage.getItem('lexicon-word-collector-v1')) {
        localStorage.setItem('lexicon-word-collector-v1',JSON.stringify({courses:{test:['전기','']},terms:{},saved:[]}));
      }
    });
    await page.goto(base+'/quick_capture/code.html');
    await page.evaluate(() => {
      WordCollectorAI.setLocalServer(true);
      WordCollectorAI.createImage = async () => {throw new Error('사진 실패 모의 응답');};
    });
    await page.locator('#btn-mode-existing').click();
    await page.locator('#term-unified-input').fill('current');
    await page.locator('#context-sentence-input').fill(reference);
    await page.locator('#submit-action-btn').click();
    await page.locator('#analysis-review').waitFor({state:'visible'});
    assert.equal(await page.locator('[name=referenceTranslation]').inputValue(),translation);
    assert.ok((await page.locator('#review-reference-sentence').textContent()).includes(reference));
    assert.equal(await page.locator('[name=exampleKo]').inputValue(),'전류를 측정합니다.');
    const corrected = translation+'\n직접 검수한 해석입니다.';
    await page.locator('[name=referenceTranslation]').fill(corrected);
    await page.locator('#analysis-review button[type=submit]').click();
    await page.waitForURL('**/words.html?**');
    const [id, word] = await page.evaluate(() => Object.entries(JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).terms)[0]);
    assert.equal(word.referenceSentence,reference); assert.equal(word.referenceTranslation,corrected);
    assert.equal(calls,1);
    await page.goto(base+'/flashcard.html?term='+id);
    await page.locator('.card-front [data-action=flip]').last().click();
        await page.waitForFunction(() => !document.querySelector('#cardsScrollContainer').hasAttribute('aria-busy'));
    assert.equal(await page.locator('.card-back [data-field=exampleEn]').textContent(),reference);
    assert.equal(await page.locator('.card-back [data-field=exampleKo]').textContent(),corrected);
    await page.reload();
    await page.locator('.card-front [data-action=flip]').last().click();
        await page.waitForFunction(() => !document.querySelector('#cardsScrollContainer').hasAttribute('aria-busy'));
    assert.equal(await page.locator('.card-back [data-field=exampleKo]').textContent(),corrected);

    const longReference = ('Original sentence on the first line.\n'+'UnbrokenWord'.repeat(55)).slice(0,600);
    const longTranslation = ('여러 줄의 긴 참고 문장 해석입니다.\n'.repeat(70)).slice(0,1200);
    await page.evaluate(({longReference,longTranslation}) => {
      const term = {course:'test',en:'current',ko:'전류',enDef:'Electric charge.',exampleEn:'Generated example.',exampleKo:'생성 예문 번역.'};
      localStorage.setItem('lexicon-word-collector-v1',JSON.stringify({courses:{test:['전기','']},saved:[],terms:{
        a:{...term,referenceSentence:longReference,referenceTranslation:longTranslation},
        b:{...term,en:'voltage'},
        c:{...term,en:'power',referenceSentence:'Old reference without a translation.'}
      }}));
    },{longReference,longTranslation});
    let inset = 0;
    await page.route(/\.(?:html|css)(?:\?.*)?$/,async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace(/env\(safe-area-inset-top\s*,\s*0px\)/g,`${inset ? 24 : 0}px`)
        .replace(/env\(safe-area-inset-bottom\s*,\s*0px\)/g,`${inset}px`);
      await route.fulfill({response,body});
    });
    const session = await context.newCDPSession(page);
    const swipe = async (x,from,to) => {
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:from}]});
      for(let i=1;i<=8;i++) {
        await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:from+(to-from)*i/8}]});
        await page.waitForTimeout(35);
      }
      await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForTimeout(220);
    };
    for (const [width,height] of [[320,568],[390,844],[844,390]]) {
      for (inset of [0,34]) {
        await page.setViewportSize({width,height});
        await page.goto(base+'/flashcard.html?term=a');
        await page.locator('.card-front [data-action=flip]').last().click();
        await page.waitForFunction(() => !document.querySelector('#cardsScrollContainer').hasAttribute('aria-busy'));
        const geometry = await page.evaluate(() => {
          const face = document.querySelector('.card-back'), rect = face.getBoundingClientRect();
          return {top:rect.top,bottom:rect.bottom,height:rect.height,left:rect.left,right:rect.right,
            headerBottom:document.querySelector('header').getBoundingClientRect().bottom,
            navTop:document.querySelector('nav').getBoundingClientRect().top,
            scrollWidth:face.scrollWidth,clientWidth:face.clientWidth,scrollHeight:face.scrollHeight,
            clientHeight:face.clientHeight,bodyWidth:document.documentElement.scrollWidth};
        });
        assert.ok(geometry.height>60 && geometry.top>=geometry.headerBottom && geometry.bottom<=geometry.navTop+1,JSON.stringify(geometry));
        assert.ok(geometry.scrollWidth<=geometry.clientWidth+1,JSON.stringify(geometry));
        assert.ok(geometry.bodyWidth<=width,JSON.stringify(geometry));
        assert.ok(geometry.scrollHeight>geometry.clientHeight);
        assert.equal(await page.locator('.card-back [data-field=exampleKo]').textContent(),longTranslation);
        const x = geometry.left+Math.min(100,(geometry.right-geometry.left)/2);
        await swipe(x,geometry.bottom-20,geometry.top+20);
        assert.equal(await page.locator('article[data-term-id]').getAttribute('data-term-id'),'a');
        assert.ok(await page.locator('.card-back').evaluate(e=>e.scrollTop>0),'swipe must read long content before changing cards');
        // Scroll to the last translation line: it must be reachable inside the card.
        await page.locator('.card-back').evaluate(e=>{
          const p=e.querySelector('[data-field=exampleKo]');
          e.scrollTop+=p.getBoundingClientRect().bottom-e.getBoundingClientRect().bottom+12;
        });
        const end = await page.locator('.card-back').evaluate(e=>({bottom:e.querySelector('[data-field=exampleKo]').getBoundingClientRect().bottom,face:e.getBoundingClientRect().bottom}));
        assert.ok(end.bottom<=end.face+1,JSON.stringify(end));
        if(width===320 && inset===34) await page.screenshot({path:'/tmp/wordcollector-reference-320.png'});
        await page.locator('.card-back').evaluate(e=>{e.scrollTop=e.scrollHeight;});
        await page.waitForTimeout(220);
        await swipe(x,geometry.bottom-20,geometry.top+20);
        assert.equal(await page.locator('article[data-term-id]').getAttribute('data-term-id'),'b','edge swipe must advance after reading');
      }
    }
    await page.goto(base+'/flashcard.html?term=b');
    await page.locator('.card-front [data-action=flip]').last().click();
        await page.waitForFunction(() => !document.querySelector('#cardsScrollContainer').hasAttribute('aria-busy'));
    assert.equal(await page.locator('.card-back [data-field=exampleKo]').textContent(),'생성 예문 번역.');
    await page.goto(base+'/flashcard.html?term=c');
    await page.locator('.card-front [data-action=flip]').last().click();
        await page.waitForFunction(() => !document.querySelector('#cardsScrollContainer').hasAttribute('aria-busy'));
    assert.match(await page.locator('.card-back [data-field=exampleKo]').textContent(),/참고 문장 해석이 없습니다/);
    assert.deepEqual(errors,[]);
    console.log('PASS: one-call analysis → translation review/edit → save/reload; 600-character references and 1200-character translations at 320/390/844px, safe insets, no overlap/overflow, touch reading and edge navigation, old cards and no-reference fallback.');
  } finally {
    await browser?.close(); server.closeAllConnections(); await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
