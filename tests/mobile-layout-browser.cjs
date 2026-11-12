const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');

(async () => {
  const server = createServer();
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
    const page = await browser.newPage(); page.setDefaultTimeout(8000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      const word = {course:'book', en:'ElectromagneticInduction'.repeat(5), ko:'전자기 유도 현상',
        formula:'FormulaWithoutSpaces'.repeat(6), pron:'Pronunciation'.repeat(8), pos:'noun',
        enDef:'A long definition. '.repeat(30), koDef:'자기장이 변화하면 전류가 발생합니다. '.repeat(30),
        referenceSentence:'A changing magnetic field induces a current. '.repeat(30), referenceTranslation:'변화하는 자기장이 전류를 유도한다. '.repeat(30)};
      localStorage.setItem('lexicon-word-collector-v1', JSON.stringify({courses:{book:['아주 긴 전자기학 단어장 이름 '.repeat(3), 'Electromagnetics']}, terms:{a:word,b:{...word,en:'Current'}}, saved:['a']}));
    });
    let safe = 0;
    await page.route(/\.(?:html|css)(?:\?.*)?$/, async route => {
      const response = await route.fetch();
      await route.fulfill({response, body:(await response.text()).replace(/env\(safe-area-inset-top,\s*0px\)/g, `${safe ? 24 : 0}px`).replace(/env\(safe-area-inset-bottom,\s*0px\)/g, `${safe}px`)});
    });
    async function reachable(selector, {dialog = false, scroll = true} = {}) {
      const locator = page.locator(selector);
      if (scroll) await locator.scrollIntoViewIfNeeded();
      const result = await locator.evaluate((e, dialog) => {
        const r = e.getBoundingClientRect();
        const top = dialog ? 0 : document.querySelector('header').getBoundingClientRect().bottom;
        const bottom = dialog ? innerHeight : document.querySelector('nav')?.getBoundingClientRect().top ?? innerHeight;
        const hit = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
        return {top:r.top, bottom:r.bottom, ceiling:top, floor:bottom, hit:!!hit && (e === hit || e.contains(hit))};
      }, dialog);
      assert.ok(result.top >= result.ceiling - 1 && result.bottom <= result.floor + 1 && result.hit, `${selector}: ${JSON.stringify(result)}`);
    }
    async function dialogFits(selector, button) {
      const r = await page.locator(selector).evaluate(e => ({open:e.open, top:e.getBoundingClientRect().top, bottom:e.getBoundingClientRect().bottom, overflow:e.scrollWidth>e.clientWidth+1}));
      assert.ok(r.open && !r.overflow && r.top >= (safe ? 24 : 0) && r.bottom <= (await page.viewportSize()).height - safe, JSON.stringify(r));
      await reachable(button, {dialog:true});
    }
    for (const [width,height] of [[320,568], [390,844], [844,390]]) for (safe of [0,34]) {
      await page.setViewportSize({width,height});
      for (const file of ['index.html', 'words.html?course=book', 'bookmarks.html', 'flashcard.html?term=a', 'edit.html?term=a', 'quick_capture/code.html', '_6/code.html', 'backup.html']) {
        await page.goto(base+'/'+file); await page.evaluate(() => document.fonts.ready);
        const geometry = await page.evaluate(() => ({width:document.documentElement.scrollWidth, innerWidth:document.querySelector('main').clientWidth, scrollWidth:document.querySelector('main').scrollWidth, header:document.querySelector('header').getBoundingClientRect().bottom, main:document.querySelector('main').getBoundingClientRect().top}));
        assert.ok(geometry.width <= width && geometry.scrollWidth <= geometry.innerWidth+1 && geometry.main >= geometry.header-1, `${file} ${width}/${safe}: ${JSON.stringify(geometry)}`);
        if (file === 'index.html') {
          await page.locator('#create-notebook').click();
          await dialogFits('#create-notebook-dialog', '#create-notebook-form button[type=submit]');
          await page.locator('#cancel-create-notebook').click();
        } else if (file.startsWith('words')) {
          await reachable('.filter-chip[data-filter=all]', {scroll:false});
          await page.locator('#notebook-settings').click();
          await dialogFits('#rename-notebook-dialog', '#delete-notebook');
          await page.locator('#delete-notebook').click();
          await dialogFits('#delete-notebook-dialog', '#confirm-notebook-delete');
          await page.locator('#cancel-notebook-delete').click();
        } else if (file.startsWith('flashcard')) {
          for (const face of ['.card-front', '.card-back']) {
            const size = await page.locator(face).evaluate(e => ({scroll:e.scrollWidth, width:e.clientWidth, height:e.clientHeight}));
            assert.ok(size.scroll<=size.width+1 && size.height>80, JSON.stringify(size));
            await reachable(face+' [data-action=bookmark]');
            const overlap = await page.evaluate(() => {
              const card = document.querySelector('#cardsScrollContainer').getBoundingClientRect();
              const nav = document.querySelector('#card-navigation').getBoundingClientRect();
              return card.right > nav.left || nav.bottom > document.querySelector('nav').getBoundingClientRect().top;
            });
            assert.equal(overlap, false);
            if (face === '.card-front') await page.locator(face+' [data-action=flip]').last().click();
            else {
              await page.locator(face).evaluate(e => {e.scrollTop=e.scrollHeight;});
              assert.ok(await page.locator(face).evaluate(e => e.scrollTop>0));
            }
          }
          await reachable('#card-navigation button:last-child');
          await page.locator('#card-navigation button:last-child').click();
          assert.equal(await page.locator('article[data-term-id]').getAttribute('data-term-id'), 'b');
        } else if (file.startsWith('edit')) {
          await reachable('button[aria-label="단어 삭제"]');
          await page.locator('button[aria-label="단어 삭제"]').click();
          await dialogFits('#deleteModal', '#deleteModal button:last-child');
        } else if (file.startsWith('quick_capture')) {
          await reachable('#ai-auth-settings summary', {scroll:false});
          await page.locator('#ai-auth-settings summary').click();
          await reachable('#tester-token');
          await reachable('#submit-action-btn');
        } else if (file.startsWith('_6')) {
          await reachable('#exportActionBtn', {scroll:false});
          await page.locator('#exportFormat').scrollIntoViewIfNeeded();
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          assert.ok(await page.evaluate(() => document.querySelector('#exportFormat').getBoundingClientRect().bottom <= document.querySelector('#exportActionBar').getBoundingClientRect().top));
        }
      }
    }
    assert.deepEqual(errors, []);
    console.log('PASS: 8 pages at 320/390/844px with 0/34px insets; header clearance, long text/formulas, front/back controls, navigation, auth, export and scrollable create/rename/delete dialogs.');
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
