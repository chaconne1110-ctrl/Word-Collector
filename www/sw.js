const PREFIX = 'wordcollector-public-static-';
const CACHE_NAME = PREFIX + '20261125-seed-photos-2';
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
  "evidence.js",
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
  "screen-scale.js",
  "native-back.js",
  "assets/styles/mobile-layout.css",
  "assets/styles/edit_html.css",
  "assets/styles/flashcard_html.css",
  "assets/styles/index_html.css",
  "assets/styles/pdf_code_html.css",
  "assets/styles/quick_capture_code_html.css",
  "assets/styles/words_html.css",
  "backup.html",
  "references.html",
  "licenses.html",
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
  "icons/icon-maskable.png",
  "icons/wordcollector-app-icon.webp",
  "assets/images/wordcollector-startup-logo.webp",
  "icons/icon.svg",
  "index.html",
  "manifest.webmanifest",
  "pdf/code.html",
  "photo-store.js",
  "partial-term.js",
  "pwa-register.js",
  "quick_capture/analysis.js",
  "quick_capture/code.html",
  "quick_capture/review.html",
  "quick_capture/capture.js",
  "quick_capture/scan.html",
  "quick_capture/scan.js",
  "quick_capture/term-extract.js",
  "quick_capture/common-words.js",
  "quick_capture/word-tiers.js",
  "quick_capture/scan-context.js",
  "request-gate.js",
  "word-export.js",
  "words.html"
];
// Bundled public study photos must be available even before a card is first opened.
// Keep this list in sync with data.js; the offline browser test checks every seed word.
const SEED_PHOTOS = [
  "assets/seed-photos/term_02899b3d-ae5c-4548-8cdd-6b30feb75ba2.jpg",
  "assets/seed-photos/term_06fcfdb0-7462-4956-8b9b-26167fa5ea1b.jpg",
  "assets/seed-photos/term_080440ab-4b83-4191-8709-50ad3760e53b.jpg",
  "assets/seed-photos/term_0b192fe3-878e-40f2-b5e3-18dfc5d74961.jpg",
  "assets/seed-photos/term_102fad9c-71d5-4701-9c1e-2b346d716ae6.jpg",
  "assets/seed-photos/term_12551293-1d10-4316-88dc-a2f7263a4e47.jpg",
  "assets/seed-photos/term_1462262d-10dc-48d6-a2fd-52ef01824ab1.jpg",
  "assets/seed-photos/term_16491f57-35e4-48cb-9fce-51e37eb33798.jpg",
  "assets/seed-photos/term_191b1765-dcbf-4948-afbb-f8b15bb11a86.jpg",
  "assets/seed-photos/term_1cb5d7c0-6855-40a2-b396-b125b52b6bf7.jpg",
  "assets/seed-photos/term_1ec7d0ae-006d-40b1-9739-b61d0c369459.jpg",
  "assets/seed-photos/term_23afaf70-fc59-4764-8a3c-0c0076a3ace0.jpg",
  "assets/seed-photos/term_2a635501-6372-4a55-a849-04962f59742c.jpg",
  "assets/seed-photos/term_2b3f4736-a753-46ab-bbff-d57fb9c4a448.jpg",
  "assets/seed-photos/term_30ffb7e1-8124-495b-81df-7d1851fac254.jpg",
  "assets/seed-photos/term_3131b443-13b1-40e9-9196-2fab87a30b03.jpg",
  "assets/seed-photos/term_3508cba8-bf31-4d6b-9a4b-82d767f44d61.jpg",
  "assets/seed-photos/term_378c9195-dae4-4cc7-b2d7-4643d4ff0a83.jpg",
  "assets/seed-photos/term_39082dda-9e6a-4d79-8adc-9c3b2fe44c6f.jpg",
  "assets/seed-photos/term_3b0d58f0-2f5c-435f-a7bd-4278da8bad25.jpg",
  "assets/seed-photos/term_48fe8bf7-47db-4d52-8e4f-33dd36724c8c.jpg",
  "assets/seed-photos/term_49ee5395-6902-44eb-866a-5e67cd6b8d03.jpg",
  "assets/seed-photos/term_4a89c7ba-f34d-4c95-91cc-c1d7dc359a3e.jpg",
  "assets/seed-photos/term_54b6cf04-dbfa-4560-bd14-bf3cf2b45375.jpg",
  "assets/seed-photos/term_5b510db5-cf00-4049-9a38-f00e632f656d.jpg",
  "assets/seed-photos/term_5d0f4e27-235a-45c1-a747-3c4119bd9e43.jpg",
  "assets/seed-photos/term_62d5eacd-4b1c-45a8-ab2a-ad33bf6a1905.jpg",
  "assets/seed-photos/term_64c49480-8bdf-4559-b14b-b13ac5b5a301.jpg",
  "assets/seed-photos/term_650eef4e-aac0-4b84-b74a-34cac45d7cf7.jpg",
  "assets/seed-photos/term_68ec2b53-109b-400a-b31f-197187c38079.jpg",
  "assets/seed-photos/term_6b685275-b595-4e15-948f-1e10cf2c4271.jpg",
  "assets/seed-photos/term_73bfded6-18da-41dc-afef-72b403342ac8.jpg",
  "assets/seed-photos/term_74d8122c-0660-4a81-95ca-fca25bcdf4d7.jpg",
  "assets/seed-photos/term_787560ca-355e-4578-b3e7-9b8b6990d527.jpg",
  "assets/seed-photos/term_7fd526f4-a38e-48ab-9946-c2c1a8366212.jpg",
  "assets/seed-photos/term_80976352-2766-439b-b6e6-b6e0815fde2c.jpg",
  "assets/seed-photos/term_86d0b865-0c7e-44ec-b7ff-87dc20c03048.jpg",
  "assets/seed-photos/term_86eec14f-6376-4245-bf6f-ef0744864c26.jpg",
  "assets/seed-photos/term_87741198-72eb-40b9-a0dc-2456e0a92a52.jpg",
  "assets/seed-photos/term_8b869286-5e44-4c37-84ff-d860650141c3.jpg",
  "assets/seed-photos/term_8cbcfdd4-d5fd-40be-bb25-e44a71b8ac58.jpg",
  "assets/seed-photos/term_91e9b544-7061-4b40-84e9-a758b113bba3.jpg",
  "assets/seed-photos/term_9becdc5c-2793-4adc-a8e9-1ba691a0865a.jpg",
  "assets/seed-photos/term_9dcf9af4-23ac-412f-86d2-3f2f2d7df81e.jpg",
  "assets/seed-photos/term_ac370632-0f9b-4f26-a631-e33990886646.jpg",
  "assets/seed-photos/term_ace1690b-c9c3-437a-89dd-5ca1bd31f1fb.jpg",
  "assets/seed-photos/term_af6bfd8f-458c-4ad8-b71f-ce4d8cbfa5cc.jpg",
  "assets/seed-photos/term_b719c83e-4821-4c7c-85fc-a3cd479638f7.jpg",
  "assets/seed-photos/term_bc0c4127-ecc8-404b-974f-ec1867cc1bcd.jpg",
  "assets/seed-photos/term_c214ad9c-de62-4f67-9b69-5ab210349d73.jpg",
  "assets/seed-photos/term_c70ab9e1-2735-483a-89a5-6bd6061ed4fb.jpg",
  "assets/seed-photos/term_d0ced9fe-66a9-4649-8a13-f96e9bc1e83c.jpg",
  "assets/seed-photos/term_d323ee87-e594-456c-9b4e-4ee2b9914087.jpg",
  "assets/seed-photos/term_d36a4bc8-0933-4ba0-a34b-35cce04e3661.jpg",
  "assets/seed-photos/term_d3d3bae1-7e1a-4b17-afab-d59c990882b8.jpg",
  "assets/seed-photos/term_d7602237-9dba-453b-8e4f-c0bd8b429613.jpg",
  "assets/seed-photos/term_d8bff669-c158-4e8c-8f6f-0b1c5f4d097b.jpg",
  "assets/seed-photos/term_da8c5383-77ab-405b-bd06-c334b06e670a.jpg",
  "assets/seed-photos/term_da9b1809-972b-427e-8171-fa90ce9f7c1c.jpg",
  "assets/seed-photos/term_dacea3d2-0800-43a3-9924-9d86b2dcd55f.jpg",
  "assets/seed-photos/term_db516c98-b91c-4f76-8c1b-21009304e58c.jpg",
  "assets/seed-photos/term_df6d5950-1c7e-42b1-83dd-934c016d19b4.jpg",
  "assets/seed-photos/term_e2f2dc09-2065-4ece-bb1f-526839e62ffb.jpg",
  "assets/seed-photos/term_e410b049-dd72-40e5-84ba-a411752a150f.jpg",
  "assets/seed-photos/term_e8dcbfec-1fb9-443a-abba-859b4c349916.jpg",
  "assets/seed-photos/term_f04b5dae-4519-4249-a909-8cd04b7184ec.jpg",
  "assets/seed-photos/term_f2882400-f2b9-46b3-8d97-aea7ae127d55.jpg",
  "assets/seed-photos/term_f294f15d-2dfc-4541-a087-86b09b51f493.jpg",
  "assets/seed-photos/term_f82716f9-88bd-4085-b3ab-45aa84884e48.jpg",
  "assets/seed-photos/term_f9fc3b3d-e604-4e59-b811-f816088c6d2e.jpg",
  "assets/seed-photos/term_fb6e5701-38ba-43a5-99cb-1674c7c8a01b.jpg",
  "assets/seed-photos/term_fe221976-cdb6-4332-bc9c-2d02cc9079bc.jpg"
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Reject installation if any bundled photo is unavailable, retaining the previous
      // active worker instead of replacing it with an incomplete offline photo cache.
      await cache.addAll(SEED_PHOTOS.map(path => new Request(path, {cache:'reload'})));
      // Optional public UI assets. API responses and user-generated photos are not precached.
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
