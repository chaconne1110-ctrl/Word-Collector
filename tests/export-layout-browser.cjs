const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');

(async () => {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox']});
    const page = await browser.newPage({acceptDownloads: true});
    let safeBottom = 0;
    // Chromium desktop reports zero safe-area insets. Substitute the CSS env()
    // value in served styles to exercise the same declarations with a phone inset.
    await page.route(/\.(?:html|css)$/, async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace(/env\(safe-area-inset-bottom\s*,\s*0px\)/g, `${safeBottom}px`);
      await route.fulfill({response, body});
    });
    for (const [width, height] of [[320, 568], [390, 844], [390, 420]]) {
      for (safeBottom of [0, 34]) {
        await page.setViewportSize({width, height});
        await page.goto(`http://127.0.0.1:${server.address().port}/_6/code.html`);
        await page.waitForSelector('.word-checkbox');
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        const geometry = await page.evaluate(() => {
          const nav = document.querySelector('nav').getBoundingClientRect();
          const bar = document.querySelector('#exportActionBar').getBoundingClientRect();
          const button = document.querySelector('#exportActionBtn').getBoundingClientRect();
          const format = document.querySelector('#exportFormat').getBoundingClientRect();
          const hit = document.elementFromPoint(button.x + button.width / 2, button.y + button.height / 2);
          return {
            navHeight: nav.height, navTop: nav.top, barTop: bar.top,
            barBottom: bar.bottom, buttonTop: button.top, buttonBottom: button.bottom,
            formatBottom: format.bottom, clickable: hit?.closest('button')?.id === 'exportActionBtn'
          };
        });
        assert.equal(geometry.navHeight, 64 + safeBottom);
        assert.ok(geometry.barBottom <= geometry.navTop + 1, JSON.stringify(geometry));
        assert.ok(geometry.buttonTop > 64 && geometry.buttonBottom <= geometry.navTop, JSON.stringify(geometry));
        assert.ok(geometry.formatBottom <= geometry.barTop, JSON.stringify(geometry));
        assert.ok(geometry.clickable, JSON.stringify(geometry));
        await page.locator('#exportFormat').selectOption('csv');
        const download = page.waitForEvent('download');
        await page.locator('#exportActionBtn').click();
        assert.equal(await (await download).failure(), null);
      }
    }
    console.log('PASS: export button and final form controls clear the tab bar at 3 viewport sizes and 0/34px bottom insets; CSV downloads remain clickable.');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
