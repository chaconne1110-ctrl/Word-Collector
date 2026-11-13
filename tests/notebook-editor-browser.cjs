const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');
(async () => {
  let calls = 0;
  const server = createServer({apiKey:'test-only', fetchImpl: async (_, init) => {
    calls++;
    const input = JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
    assert.deepEqual(input.notebooks, []);
    const output = {englishTerm:'eddy current',koreanMeaning:'와전류',specialization:'전기공학',notebookName:'전자기 유도',englishDefinition:'An induced current.',koreanDefinition:'유도된 전류.',exampleSentence:'Eddy currents heat metal.',explanation:'유도 전류 설명',recommendationReason:'문맥에 따른 이름',relatedTerms:[],pos:'noun',exampleKo:'와전류가 금속을 가열한다.',referenceTranslation:'자기장에 의한 전류'};
    return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(output)}]}}]}));
  }});
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
    const page = await browser.newPage({viewport:{width:390,height:844}});
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base+'/index.html');
    await page.evaluate(()=>localStorage.setItem('lexicon-word-collector-v1',JSON.stringify({courses:{},terms:{},saved:[]})));
    await page.reload();
    assert.equal(await page.locator('[data-subject]:visible').count(),0);
    await page.locator('#create-notebook').click();
    await page.locator('#new-notebook-name').fill('   ');
    await page.locator('#create-notebook-form button[type=submit]').click();
    assert.equal(await page.locator('#create-notebook-dialog').evaluate(e=>e.open),true);
    await page.locator('#new-notebook-name').fill('나의 단어장');
    await page.locator('#create-notebook-form button[type=submit]').click();
    await page.waitForURL('**/words.html?**');
    assert.equal(await page.locator('header h1').textContent(),'나의 단어장');
    await page.goto(base+'/index.html');
    assert.equal(await page.locator('[data-subject]:visible').count(),1);
    await page.locator('#create-notebook').click();
    await page.locator('#new-notebook-name').fill(' 나의 단어장 ');
    await page.locator('#create-notebook-form button[type=submit]').click();
    assert.equal(await page.locator('#create-notebook-dialog').evaluate(e=>e.open),true);
    await page.locator('#cancel-create-notebook').click();
    assert.equal(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).courses).length),1);
    await page.evaluate(()=>localStorage.setItem('lexicon-word-collector-v1',JSON.stringify({courses:{},terms:{},saved:[]})));
    await page.goto(base+'/quick_capture/code.html');
    await page.evaluate(()=>{WordCollectorAI.setLocalServer(true);WordCollectorAI.createImage=()=>new Promise(resolve=>{window.completePhoto=resolve;});});
    await page.locator('#btn-mode-ai').click();
    await page.locator('#term-unified-input').fill('와전류');
    await page.locator('#context-sentence-input').fill('자기장에 의한 전류');
    await page.locator('#submit-action-btn').click();
    await page.waitForFunction(()=>document.querySelector('#analysis-status').textContent.includes('사진 생성이 끝나면'));
    assert.equal(await page.locator('#save-action-btn').isDisabled(),true);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexicon-word-collector-v1'))),{courses:{},terms:{},saved:[]});
    await page.evaluate(()=>{
      const canvas=document.createElement('canvas');canvas.width=12;canvas.height=8;canvas.getContext('2d').fillRect(0,0,12,8);
      window.completePhoto({image:{mimeType:'image/png',data:canvas.toDataURL().split(',')[1]}});
    });
    await page.waitForURL('**/words.html?**');
    assert.equal(await page.locator('header h1').textContent(),'전자기 유도');
    assert.equal(calls,1);
    const termId=await page.locator('#term-list [data-term-id]').first().getAttribute('data-term-id');
    await page.route('**/edit.html?*', async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace(/env\(safe-area-inset-top,\s*0px\)/g, '24px').replace(/env\(safe-area-inset-bottom,\s*0px\)/g, '34px');
      await route.fulfill({response, body});
    });
    for (const [width,height] of [[320,568],[390,844],[844,390]]) {
      await page.setViewportSize({width,height});
      await page.goto(base+'/edit.html?term='+termId);
      await page.waitForFunction(()=>document.querySelector('#edit-analysis-photo').naturalWidth===12);
      assert.ok(await page.locator('#edit-analysis-photo').isVisible());
      assert.ok(await page.evaluate(()=>document.querySelector('main').getBoundingClientRect().top>=document.querySelector('header').getBoundingClientRect().bottom));
    }
    await page.locator('#koreanTermInput').fill('수정한 와전류');
    await page.locator('[aria-label="단어 변경사항 저장"]').click();
    await page.waitForURL('**/flashcard.html?**');
    await page.goto(base+'/edit.html?term='+termId);
    await page.waitForFunction(()=>document.querySelector('#edit-analysis-photo').naturalWidth===12);
    assert.equal(await page.locator('#koreanTermInput').inputValue(),'수정한 와전류');
    await page.goto(base+'/index.html');
    await page.evaluate(()=>localStorage.setItem('lexicon-word-collector-v1',JSON.stringify({courses:{},terms:{},saved:[]})));
    await page.goto(base+'/quick_capture/code.html');
    await page.evaluate(()=>{WordCollectorAI.request=async()=>{throw new Error('분석 실패 검증');};});
    await page.locator('#btn-mode-ai').click();
    await page.locator('#term-unified-input').fill('와전류');
    await page.locator('#submit-action-btn').click();
    await page.waitForFunction(()=>document.querySelector('#analysis-status').textContent==='분석 실패 검증');
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexicon-word-collector-v1'))),{courses:{},terms:{},saved:[]});
    assert.deepEqual(errors,[]);
    console.log('PASS: home create/duplicate/blank checks; empty-state AI course naming and atomic autosave; stored photo restored after edit/reload; header clearance');
  } finally { await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});
