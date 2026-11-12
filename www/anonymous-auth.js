// Web and Capacitor anonymous enrollment. No tester code or Gemini key is shipped to clients.
// Web: IndexedDB, native: Android Keystore via WordCollectorAI. Never word records/backups.
// This is a per-browser credential, not strong human identity; server applies additional IP ceilings.
(function (root) {
  'use strict';
  const API = 'https://word-collector-api.yechan-lim-elec.workers.dev';
  const DB_NAME = 'word-collector-private-auth-v1';
  const STORE_NAME = 'credentials';
  const RECORD = 'auto-anonymous-v1';
  let inFlight = null;

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!root.indexedDB) { reject(new Error('브라우저 보안 저장소를 사용할 수 없습니다.')); return; }
      const request = root.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('브라우저 보안 저장소를 열지 못했습니다.'));
      request.onblocked = () => reject(new Error('인증 저장소가 잠겨 있습니다. 다른 앱 탭을 닫아 주세요.'));
    });
  }
  async function dbOperation(mode, action) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      let result;
      const tx = db.transaction(STORE_NAME, mode);
      const request = action(tx.objectStore(STORE_NAME));
      request.onsuccess = () => { result = request.result; };
      request.onerror = () => reject(new Error('인증 저장소 작업에 실패했습니다.'));
      tx.oncomplete = () => { db.close(); resolve(result); };
      tx.onabort = () => { db.close(); reject(new Error('인증정보를 안전하게 저장하지 못했습니다.')); };
    });
  }
  function valid(token) { return typeof token === 'string' && /^wc_[a-f0-9]{64}$/.test(token); }
  async function restore() {
    const value = await dbOperation('readonly', store => store.get(RECORD));
    return valid(value?.token) && Date.parse(value.expiresAt || '') > Date.now()
      ? value.token : '';
  }
  async function storeToken(token, expiresAt) {
    if (!valid(token) || !Number.isFinite(Date.parse(expiresAt))) throw new Error('서버 인증 응답이 올바르지 않습니다.');
    await dbOperation('readwrite', store => store.put({token, expiresAt}, RECORD));
  }
  async function clear() {
    await dbOperation('readwrite', store => store.delete(RECORD));
  }
  async function getConfig() {
    const response = await root.fetch(API + '/api/auth/config', {
      method: 'GET', cache: 'no-store', redirect: 'error'
    });
    if (!response.ok) throw new Error('자동 인증 서버의 설정을 확인하지 못했습니다.');
    const config = await response.json();
    if (config?.enabled !== true || typeof config.siteKey !== 'string') {
      throw new Error('서버에서 자동 인증을 아직 활성화하지 않았습니다.');
    }
    return config;
  }
  async function loadTurnstile() {
    if (root.turnstile?.render) return root.turnstile;
    await new Promise((resolve, reject) => {
      const script = root.document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('자동 인증 보안 검증을 불러오지 못했습니다.'));
      root.document.head.append(script);
    });
    if (!root.turnstile?.render) throw new Error('자동 인증 보안 검증을 시작하지 못했습니다.');
    return root.turnstile;
  }
  async function challenge(siteKey) {
    const turnstile = await loadTurnstile();
    return new Promise((resolve, reject) => {
      const mount = root.document.createElement('div');
      mount.id = 'wc-anonymous-verification';
      root.document.body.append(mount);
      let widget, finished = false;
      const timer = setTimeout(() => done(new Error('자동 인증 보안 검증 시간이 초과되었습니다.')), 90000);
      function done(error, value) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (widget !== undefined) { try { turnstile.remove(widget); } catch {} }
        mount.remove();
        if (error) reject(error); else resolve(value);
      }
      try {
        widget = turnstile.render(mount, {
          sitekey: siteKey,
          size: 'invisible',
          action: 'wordcollector-auth',
          execution: 'execute',
          callback: value => done(null, value),
          'error-callback': () => { done(new Error('자동 인증 보안 검증에 실패했습니다.')); return true; },
          'expired-callback': () => done(new Error('자동 인증 보안 검증이 만료되었습니다.'))
        });
        turnstile.execute(widget);
      } catch {
        done(new Error('자동 인증 보안 검증을 시작할 수 없습니다.'));
      }
    });
  }
  function nativeOrigin() {
    const protocol = root.location?.protocol;
    const origin = root.location?.origin;
    if (origin === 'https://localhost' || origin === 'capacitor://localhost') return origin;
    if (protocol === 'capacitor:') return 'capacitor://localhost';
    throw new Error('지원하지 않는 모바일 인증 출처입니다.');
  }
  // Turnstile must execute on an HTTPS hostname. Capacitor's local WebView
  // cannot host the widget directly; a fixed, same-site HTTPS iframe does.
  async function nativeChallenge() {
    const expectedOrigin = 'https://chaconne1110-ctrl.github.io';
    const hostOrigin = nativeOrigin();
    const page = expectedOrigin + '/Word-Collector/auth/native-challenge.html?parentOrigin=' +
      encodeURIComponent(hostOrigin);
    return new Promise((resolve, reject) => {
      const frame = root.document.createElement('iframe');
      const overlay = root.document.createElement('div');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-label', 'AI 자동 인증');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.66);display:flex;align-items:center;justify-content:center;padding:16px';
      const panel = root.document.createElement('div');
      panel.style.cssText = 'width:min(100%,420px);background:white;color:#1b1b1b;border-radius:12px;padding:12px';
      frame.title = 'AI 자동 인증 보안 확인';
      frame.style.cssText = 'border:0;width:100%;height:255px;display:block';
      frame.setAttribute('referrerpolicy','no-referrer');
      frame.src = page;
      panel.append(frame);
      overlay.append(panel);
      let finished = false;
      const timeout = setTimeout(() => complete(new Error('모바일 자동 인증 시간이 초과되었습니다.')), 120000);
      function complete(error, value) {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        root.removeEventListener('message', onMessage);
        overlay.remove();
        if (error) reject(error); else resolve(value);
      }
      function onMessage(event) {
        if (event.source !== frame.contentWindow || event.origin !== expectedOrigin ||
            event.data?.type !== 'wordcollector-turnstile-v1') return;
        if (typeof event.data?.token === 'string' && event.data.token.length <= 2048 &&
            event.data.token.length >= 10) complete(null,event.data.token);
        else complete(new Error('모바일 보안 검증에 실패했습니다.'));
      }
      root.addEventListener('message',onMessage);
      root.document.body.append(overlay);
    });
  }
  async function acquire() {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      // Restoring an already-issued token never invokes Turnstile or allocates a new identity.
      const prior = await restore();
      if (prior) return prior;
      const config = await getConfig();
      const native = ['android','ios'].includes(root.Capacitor?.getPlatform?.());
      const turnstileToken = native ? await nativeChallenge() : await challenge(config.siteKey);
      const response = await root.fetch(API + '/api/auth/anonymous', {
        method: 'POST', redirect: 'error', cache: 'no-store',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({turnstileToken})
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || '서버 자동 인증에 실패했습니다.');
      if (!valid(result.token) || !Number.isFinite(Date.parse(result.expiresAt))) {
        throw new Error('서버 인증 응답이 올바르지 않습니다.');
      }
      if (!native) await storeToken(result.token, result.expiresAt);
      return result.token;
    })();
    try { return await inFlight; } finally { inFlight = null; }
  }
  root.WordCollectorAnonymousAuth = {acquire, restore, clear, getConfig};
})(globalThis);
