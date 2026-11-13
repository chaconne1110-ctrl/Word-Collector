const PREFIX = 'wordcollector-public-static-';
const CACHE_NAME = PREFIX + '20261113-v5-1-reference-example';
const APP_SHELL = [
  "_1/code.html",
  "_2/code.html",
  "_3/code.html",
  "_4/code.html",
  "_5/code.html",
  "_6/code.html",
  "ai/code.html",
  "analysis-api.js",
  "anonymous-auth.js",
  "auth/native-challenge.html",
  "app.js",
  "assets/fonts/Inter/inter-local.css",
  "assets/fonts/JetBrainsMono/local.css",
  "assets/fonts/MaterialSymbols/local.css",
  "assets/fonts/NotoSansKR/local.css",
  "assets/fonts/SpaceGrotesk/local.css",
  "assets/images/ai-reference.jpg",
  "assets/styles/_6_code_html.css",
  "assets/styles/ai_code_html.css",
  "assets/styles/bookmarks_html.css",
  "assets/styles/bottom-navigation.css",
  "assets/styles/mobile-layout.css",
  "assets/styles/edit_html.css",
  "assets/styles/flashcard_html.css",
  "assets/styles/index_html.css",
  "assets/styles/pdf_code_html.css",
  "assets/styles/quick_capture_code_html.css",
  "assets/styles/words_html.css",
  "backup.html",
  "backup.js",
  "bookmarks.html",
  "csv-export.js",
  "data.js",
  "diagrams.js",
  "diagrams/eddy-flux.svg",
  "diagrams/eddy-loops.svg",
  "edit.html",
  "export-menu.js",
  "export-save.js",
  "export-screen.js",
  "export.html",
  "flashcard.html",
  "icons/apple-touch-icon.png",
  "icons/icon.svg",
  "index.html",
  "manifest.webmanifest",
  "pdf/code.html",
  "photo-store.js",
  "partial-term.js",
  "pwa-register.js",
  "quick_capture/analysis.js",
  "quick_capture/code.html",
  "request-gate.js",
  "word-export.js",
  "words.html"
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Cache static UI files only. API responses, authentication, user data and images are never cached here.
      await Promise.all(APP_SHELL.map(async path => {
        try { await cache.add(new Request(path, {cache:'reload'})); } catch { /* optional asset */ }
      }));
    }).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE_NAME)
      .map(k => caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin ||
      !url.pathname.startsWith(self.registration.scope.replace(self.location.origin, '')) ||
      url.pathname.includes('/api/')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(req);
      if (response.ok && response.type === 'basic') {
        await cache.put(req, response.clone());
      }
      return response;
    } catch {
      const cached = await cache.match(req, {ignoreSearch:true});
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const home = await cache.match('index.html');
        if (home) return home;
      }
      return Response.error();
    }
  })());
});
