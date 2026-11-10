const {chromium}=require('playwright');
const {once}=require('node:events');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {execFileSync}=require('node:child_process');
const {createServer}=require('../server/server.cjs');
(async()=>{
  for(const file of ['www/index.html','www/_6/code.html','www/assets/styles/index_html.css']) {
    assert.deepEqual(await fs.readFile(file),execFileSync('git',['show','2ab34b7:'+file]),'main UI must remain byte-identical: '+file);
  }
  const calls=[];
  const server=createServer({apiKey:'fake-local-key',fetchImpl:async(url,init)=>{
    const payload=JSON.parse(init.body),input=JSON.parse(payload.contents[0].parts[0].text);
    calls.push(input);assert.ok(url.includes('gemini-3.5-flash-lite:generateContent'));
    const transformer=input.word==='Transformer';
    const result={englishTerm:transformer?'Transformer':'eddy current',koreanMeaning:transformer?'트랜스포머':'와전류',
      specialization:transformer?'인공지능':'전기공학',notebookName:'전자기학',englishDefinition:transformer?'A self-attention neural network architecture.':'A circulating current induced by changing magnetic flux.',
      koreanDefinition:transformer?'자기 주의 집중 신경망 구조.':'변하는 자속에 의해 유도되는 순환 전류.',exampleSentence:transformer?'The Transformer processes language.':'Eddy currents heat conductors.',
      explanation:'학습 해설',recommendationReason:'저장된 Skin Effect와 관련됩니다.',relatedTerms:['Skin Effect'],pos:'noun',exampleKo:transformer?'트랜스포머는 언어를 처리합니다.':'와전류가 도체를 가열합니다.'};
    return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(result)}]}}]}),{status:200});
  }});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
    const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'/');await page.waitForSelector('nav a');
    assert.equal(await page.locator('nav a').count(),4);
    await page.screenshot({path:'/tmp/github-main-ui-proof.png',fullPage:true});
    await page.locator('nav a').filter({hasText:'단어 추가'}).click();
    await page.locator('#btn-mode-ai').click();await page.locator('#tab-ref-sentence').click();
    await page.locator('#term-unified-input').fill('와전류');
    await page.locator('#context-sentence-input').fill('변하는 자기장이 전류를 유도한다.');
    await page.locator('#submit-action-btn').click();
    await page.locator('#analysis-review').waitFor({state:'visible'});
    assert.equal(await page.locator('[name=en]').inputValue(),'eddy current');
    assert.equal(await page.locator('[name=discipline]').inputValue(),'전기공학');
    assert.ok((await page.locator('#recommendation-reason').textContent()).includes('Skin Effect'));
    await page.locator('#review-course').selectOption('electrical-machines');
    assert.equal(await page.locator('[name=en]').inputValue(),'eddy current');
    await page.locator('[name=ko]').fill('검수한 와전류');
    await page.locator('#analysis-review button[type=submit]').click();
    await page.waitForURL('**/words.html?**');
    let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('lexicon-word-collector-v1')));
    const [savedId,word]=Object.entries(state.terms).find(([,word])=>word.en==='eddy current');
    assert.equal(word.course,'electrical-machines');assert.equal(word.ko,'검수한 와전류');assert.equal(word.analysisModel,'gemini-3.5-flash-lite');
    await page.reload();assert.ok((await page.locator('body').textContent()).includes('eddy current'));
    await page.goto(base+'/quick_capture/code.html');
    await page.locator('#btn-mode-existing').click();await page.locator('#tab-ref-sentence').click();
    await page.locator('#subject-select').selectOption('electrical-machines');
    await page.locator('#term-unified-input').fill('Transformer');
    await page.locator('#context-sentence-input').fill('Self-attention is used in natural language processing.');
    await page.locator('#submit-action-btn').click();await page.locator('#analysis-review').waitFor({state:'visible'});
    assert.equal(await page.locator('[name=ko]').inputValue(),'트랜스포머');
    assert.equal(await page.locator('[name=discipline]').inputValue(),'인공지능');
    await page.locator('#analysis-review button[type=submit]').click();await page.waitForURL('**/words.html?**');
    state=await page.evaluate(()=>JSON.parse(localStorage.getItem('lexicon-word-collector-v1')));
    assert.equal(Object.values(state.terms).find(word=>word.en==='Transformer').course,'electrical-machines');
    assert.equal(calls.length,2);assert.ok(calls[0].notebooks.some(book=>book.terms.some(word=>word.englishDefinition||word.koreanDefinition)));
    assert.equal(calls[1].referenceText,'Self-attention is used in natural language processing.');
    await page.goto(base+'/_6/code.html');await page.locator('#selectAllMaster').locator('..').click();
    assert.equal(await page.locator('#selectAllMaster').isChecked(),false);
    await page.locator(`[data-term-id="${savedId}"]`).check();
    for(const key of ['discipline','course','enDef','koDef'])await page.locator(`[data-column="${key}"]`).uncheck();
    await page.locator('#exportFormat').selectOption('csv');
    let download=page.waitForEvent('download');await page.locator('#exportActionBtn').click();
    const csv=await fs.readFile(await(await download).path(),'utf8');
    assert.ok(csv.includes('검수한 와전류'));assert.ok(!csv.includes('Transformer'));assert.ok(csv.includes('"표제어","한글 뜻","예문"'));
    await page.locator('#exportFormat').selectOption('xlsx');
    download=page.waitForEvent('download');await page.locator('#exportActionBtn').click();
    const bytes=await fs.readFile(await(await download).path());assert.equal(bytes.readUInt32LE(0),0x04034b50);assert.ok(bytes.toString().includes('A1:C2'));
    assert.deepEqual(errors,[]);
    console.log('PASS: GitHub main UI unchanged, four menus, Korean auto analysis→change destination→edit→save/reload, English reference priority request→direct save, actual CSV/XLSX downloads. Gemini is mocked.');
  } finally {await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
