const {chromium} = require('playwright');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(__dirname, '../www');
  const server = http.createServer(async(req,res)=>{
    const file = path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    try {const content=await fs.readFile(file);res.setHeader('Content-Type', file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(content);}catch{res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
    const page=await browser.newPage({acceptDownloads:true,viewport:{width:390,height:844}});
    const state={courses:{em:['전자기학'],cir:['회로이론']},terms:{a:{course:'em',en:'Eddy Current',ko:'와전류',exampleEn:'Old'},b:{course:'cir',en:'Voltage',ko:'전압'}}};
    await page.addInitScript(value=>localStorage.setItem('lexicon-word-collector-v1',JSON.stringify(value)),state);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/_6/code.html');
    await page.waitForSelector('.word-checkbox');
    assert.equal(await page.locator('.word-checkbox').count(),2);
    await page.locator('[data-term-id="b"]').uncheck();
    assert.equal(await page.locator('#selectAllMaster').evaluate(e=>e.indeterminate),true);
    for(const key of ['discipline','course','enDef','koDef'])await page.locator('[data-column="'+key+'"]').uncheck();
    await page.evaluate(()=>{const key='lexicon-word-collector-v1';const s=JSON.parse(localStorage.getItem(key));s.terms.a.exampleEn='Latest, "quoted"\nexample';localStorage.setItem(key,JSON.stringify(s));});
    await page.locator('#exportFormat').selectOption('csv');
    let promise=page.waitForEvent('download');await page.locator('#exportActionBtn').click();
    const csv=await fs.readFile(await(await promise).path(),'utf8');
    assert.ok(csv.includes('"표제어","한글 뜻","예문"'));assert.ok(csv.includes('Latest, ""quoted""'));assert.ok(!csv.includes('Voltage'));
    await page.locator('#exportFormat').selectOption('xlsx');
    promise=page.waitForEvent('download');await page.locator('#exportActionBtn').click();
    const xlsx=await fs.readFile(await(await promise).path());assert.equal(xlsx.readUInt32LE(0),0x04034b50);
    assert.ok(xlsx.toString().includes('A1:C2'));
    await page.locator('[data-column="en"]').uncheck();await page.locator('[data-column="ko"]').uncheck();await page.locator('[data-column="exampleEn"]').uncheck();
    assert.ok(await page.locator('#exportActionBtn').isDisabled());
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexicon-word-collector-v1')).terms.a.en),'Eddy Current');
    assert.deepEqual(errors,[]);
    console.log('PASS: existing Output tab, actual word selection, partial masters, selected columns, latest edits, CSV/XLSX downloads, empty selection and storage preservation.');
  } finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
