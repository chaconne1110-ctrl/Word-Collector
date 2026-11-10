(function (root) {
  'use strict';
  const MODEL = 'gemini-3.5-flash-lite';
  const CLOUD_URL = 'https://word-collector-api.yechan-lim-elec.workers.dev';
  function createClient({native = false, nativeHttp, fetchImpl = root.fetch?.bind(root),
    baseUrl = CLOUD_URL, token = ''} = {}) {
    if (![CLOUD_URL, '', 'http://127.0.0.1:8787'].includes(baseUrl)) throw new Error('허용되지 않은 분석 서버입니다.');
    const cloud = baseUrl === CLOUD_URL;
    const headers = {'Content-Type':'application/json'};
    if (cloud) {
      if (!/^wc_[a-f0-9]{64}$/.test(token)) throw new Error('테스터 인증 코드를 먼저 등록해 주세요.');
      headers.Authorization = 'Bearer ' + token;
    }
    return {async request(payload) {
      let status, result;
      if (native) {
        if (typeof nativeHttp?.request !== 'function') throw new Error('AI 연결 기능이 포함된 최신 APK로 업데이트해 주세요.');
        let response;
        try { response = await nativeHttp.request({
          url:(baseUrl || 'http://127.0.0.1:8787') + '/api/analyze',method:'POST',
          headers,data:payload,
          connectTimeout:10000,readTimeout:35000,disableRedirects:true,
        }); } catch { throw new Error('분석 서버에 연결하지 못했습니다. 인터넷 연결 또는 선택한 PC 서버를 확인해 주세요.'); }
        status = response.status;
        result = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } else {
        const response = await fetchImpl(baseUrl + '/api/analyze',{
          method:'POST',headers,
          body:JSON.stringify(payload),signal:AbortSignal.timeout(35000),redirect:'error',
        });
        status = response.status;
        result = await response.json();
      }
      if (!(status >= 200 && status < 300)) throw new Error(result?.error || '분석 요청에 실패했습니다.');
      if (!result || result.model !== MODEL) throw new Error('분석 서버의 모델 설정을 확인해 주세요.');
      for (const key of ['en','ko','discipline','pos','enDef','koDef','exampleEn','exampleKo','course']) {
        if (typeof result[key] !== 'string' || !result[key].trim()) throw new Error('필수 분석 항목을 받지 못했습니다. 다시 분석해 주세요.');
      }
      return result;
    }, async requestImage(payload) {
      if (!cloud) throw new Error('사진 생성은 Cloudflare HTTPS 서버에서만 사용할 수 있습니다.');
      let status, result;
      if (native) {
        if (typeof nativeHttp?.request !== 'function') throw new Error('이미지 생성 기능이 포함된 APK가 필요합니다.');
        let response;
        try {
          response = await nativeHttp.request({
            url:baseUrl + '/api/image', method:'POST', headers, data:payload,
            connectTimeout:10000, readTimeout:65000, disableRedirects:true
          });
        } catch {
          throw new Error('사진 생성 서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.');
        }
        status = response.status;
        result = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } else {
        const response = await fetchImpl(baseUrl + '/api/image', {
          method:'POST', headers, body:JSON.stringify(payload),
          signal:AbortSignal.timeout(65000), redirect:'error'
        });
        status = response.status;
        result = await response.json();
      }
      if (!(status >= 200 && status < 300)) throw new Error(result?.error || '사진 생성 요청이 실패했습니다.');
      if (!['image/png','image/jpeg','image/webp'].includes(result?.image?.mimeType) ||
          typeof result?.image?.data !== 'string' || result.image.data.length < 100) {
        throw new Error('사진 생성 결과가 올바르지 않습니다.');
      }
      return result;
    }};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {createClient};
  else {
    // A tester token never enters localStorage, cookies, word records or backups.
    // Native AndroidKeyStore / iOS Keychain plugins persist it. Browsers use tab-scoped sessionStorage only, never localStorage.
    let token = '';
    let local = false;
    const WEB_SESSION_KEY = 'word-collector-web-tester-session-v1';
    const session = () => {
      try { return root.sessionStorage; } catch { return undefined; }
    };
    const isAndroid = () => root.Capacitor?.getPlatform?.() === 'android';
    const isIOS = () => root.Capacitor?.getPlatform?.() === 'ios';
    const isNative = () => isAndroid() || isIOS();
    const secureStore = () => root.Capacitor?.Plugins?.TesterTokenStore;
    function requireSecureStore(method) {
      const store = secureStore();
      if (typeof store?.[method] !== 'function') {
        throw new Error('인증 코드 안전 저장 기능이 포함된 최신 APK가 필요합니다.');
      }
      return store;
    }
    // Remove any plaintext credential left by an earlier preview build.
    try { root.localStorage?.removeItem('word-collector-tester-auth-v1'); } catch { /* private storage disabled */ }
    root.WordCollectorAI = {
      // Retained for callers that only want temporary credentials.
      configure({testerToken = '', useLocal = false}) {
        token = testerToken.trim();
        local = useLocal;
      },
      async rememberTesterToken(value) {
        const validated = String(value || '').trim();
        if (!/^wc_[a-f0-9]{64}$/.test(validated)) {
          throw new Error('테스터 인증 코드 형식을 확인해 주세요.');
        }
        if (isNative()) await requireSecureStore('save').save({token: validated});
        else {
          try { session()?.setItem(WEB_SESSION_KEY, validated); }
          catch { /* Private browsing can disable session storage; token remains in memory. */ }
        }
        token = validated;
        local = false;
        return {persistent: isNative()};
      },
      async restoreTesterToken() {
        if (token) return true;
        if (!isNative()) {
          const candidate = session()?.getItem(WEB_SESSION_KEY) || '';
          if (!candidate) return false;
          if (!/^wc_[a-f0-9]{64}$/.test(candidate)) {
            try { session()?.removeItem(WEB_SESSION_KEY); } catch {}
            return false;
          }
          token = candidate;
          return true;
        }
        const saved = await requireSecureStore('read').read();
        if (saved?.token && !/^wc_[a-f0-9]{64}$/.test(saved.token)) {
          throw new Error('저장된 인증 코드 형식을 확인해 주세요. 코드를 지우고 다시 등록하세요.');
        }
        token = saved?.token || '';
        return Boolean(token);
      },
      async clearTesterToken() {
        if (isNative()) await requireSecureStore('clear').clear();
        else {
          try { session()?.removeItem(WEB_SESSION_KEY); } catch {}
        }
        token = '';
        local = false;
      },
      setLocalServer(value) {
        const hostedWeb = !isNative() && root.location?.protocol === 'https:';
        local = isIOS() || hostedWeb ? false : Boolean(value);
      },
      async createImage(payload) {
        if (!token) await root.WordCollectorAI.restoreTesterToken();
        return createClient({
          baseUrl:CLOUD_URL, token, native:isNative(),
          nativeHttp:root.Capacitor?.Plugins?.CapacitorHttp,
        }).requestImage(payload);
      },
      async request(payload) {
        if (!local && !token) await root.WordCollectorAI.restoreTesterToken();
        return createClient({
          baseUrl: local ? (isAndroid() ? 'http://127.0.0.1:8787' : '') : CLOUD_URL,
          token,
          native: isNative(),
          nativeHttp: root.Capacitor?.Plugins?.CapacitorHttp,
        }).request(payload);
      }
    };
  }
})(globalThis);
