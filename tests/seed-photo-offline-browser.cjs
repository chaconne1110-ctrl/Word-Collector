// A fresh PWA installation must include every bundled study photo before the
// first flashcard is opened, including when hosted under a GitHub Pages path.
const assert = require('node:assert/strict');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {createServer} = require('../server/server.cjs');

(async () => {
  let apiCalls = 0;
  let missingPhoto = false;
  const server = createServer({apiKey: 'test-only', fetchImpl: async () => {
    apiCalls++;
    throw new Error('No paid API calls in this test');
  }});
  // Serve the same application both at the origin and at a Pages-like prefix.
  // The browser and service worker keep the prefixed URLs and scope unchanged.
  const prefix = '/Word-Collector/v6.1/';
  server.prependListener('request', req => {
    if (req.url.startsWith(prefix)) req.url = '/' + req.url.slice(prefix.length);
    if (missingPhoto && req.url.startsWith('/assets/seed-photos/')) {
      req.url = '/missing-required-seed-photo.jpg';
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox']
    });
    for (const scope of ['/', prefix]) {
      const context = await browser.newContext({viewport: {width: 390, height: 844}});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const base = origin + scope;
      await page.goto(base + 'index.html');
      // Localhost is a secure context. Register the production worker directly,
      // since pwa-register.js automatically registers only on public HTTPS.
      await page.evaluate(async () => {
        await navigator.serviceWorker.register('./sw.js', {scope: './'});
        await navigator.serviceWorker.ready;
      });
      await page.waitForFunction(() => navigator.serviceWorker.controller);
      const words = await page.evaluate(() => {
        const data = JSON.parse(localStorage.getItem('lexicon-word-collector-v1'));
        return Object.entries(data.terms).map(([id, term]) => ({id, course: term.course}));
      });
      assert.equal(words.length, 72);
      const photos = words.map(({id}) => base + `assets/seed-photos/${id}.jpg`);
      const cached = await page.evaluate(async urls => Promise.all(urls.map(async url => {
        const response = await caches.match(url);
        return Boolean(response?.ok);
      })), photos);
      assert.ok(cached.every(Boolean), scope + ': every photo cached before visiting any flashcard');

      await context.setOffline(true);
      // Exercise the worker's fetch fallback, rather than just reading cache
      // entries: every photograph must also be a decodable image offline.
      const decoded = await page.evaluate(async urls => Promise.all(urls.map(async url => {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Photo unavailable offline: ' + url);
        const bitmap = await createImageBitmap(await response.blob());
        const dimensions = [bitmap.width, bitmap.height];
        bitmap.close();
        return dimensions;
      })), photos);
      assert.ok(decoded.every(([width, height]) => width === 720 && height === 720),
        scope + ': all 72 photographs decode offline');

      const word = words[0];
      await page.goto(base + 'flashcard.html?term=' + word.id + '&course=' + word.course);
      await page.waitForFunction(() => {
        const photo = document.querySelector('.card-back img[src*="seed-photos/"]');
        return photo && !photo.hidden && photo.naturalWidth > 0;
      });
      assert.ok((await page.locator('.card-back').textContent()).includes('기본 단어장에 함께 들어 있는 AI 사진'));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        scope + ': flashcard has no horizontal overflow');

      await page.goto(base + 'edit.html?term=' + word.id);
      await page.waitForFunction(() => {
        const photo = document.getElementById('edit-analysis-photo');
        return !photo.hidden && photo.naturalWidth > 0;
      });
      assert.ok((await page.locator('#edit-photo-status').textContent()).includes('기본 단어장'));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        scope + ': editor has no horizontal overflow');
      assert.deepEqual(errors, []);
      await context.close();
    }

    // Missing required photos must fail installation, so an incomplete new
    // worker cannot activate and discard a previously working offline cache.
    missingPhoto = true;
    const failedContext = await browser.newContext();
    const failedPage = await failedContext.newPage();
    await failedPage.goto(origin + '/index.html');
    const installState = await failedPage.evaluate(async () => {
      const registration = await navigator.serviceWorker.register('./sw.js', {scope: './'});
      const worker = registration.installing || registration.waiting || registration.active;
      if (!worker) return 'redundant';
      if (['activated', 'redundant'].includes(worker.state)) return worker.state;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Worker installation did not settle')), 15000);
        worker.addEventListener('statechange', () => {
          if (['activated', 'redundant'].includes(worker.state)) {
            clearTimeout(timeout);
            resolve(worker.state);
          }
        });
      });
    });
    assert.equal(installState, 'redundant', 'missing photos prevent worker activation');
    assert.equal(await failedPage.evaluate(() => navigator.serviceWorker.controller !== null), false);
    await failedContext.close();
    assert.equal(apiCalls, 0);
    console.log('PASS: fresh PWA caches and decodes all 72 seed photos offline at root and subpath; flashcard/editor display them; missing required photos prevent activation.');
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
