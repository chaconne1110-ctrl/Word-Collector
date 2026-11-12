(function (root) {
  'use strict';
  const MODEL = 'gemini-3.5-flash-lite';
  const CLOUD_URL = 'https://word-collector-api.yechan-lim-elec.workers.dev';
  // Earlier deployed Workers reject user-created manual notebooks and all-empty auto notebooks
  // on the legacy request shape, even though their modern request shape accepts both.
  // The validation error happens before quota reservation. Retry ONLY these two HTTP 400
  // validation errors; never retry a model call, timeout, authentication, or quota failure.
  const LEGACY_NOTEBOOK_VALIDATION = /^(저장할 기존 단어장을 선택해 주세요\.|분류 기준이 될 저장 단어가 없습니다\..*)$/;
  function toModernNotebookRequest(payload) {
    if (typeof payload?.term !== 'string' || typeof payload.autoCourse !== 'boolean' ||
        !Array.isArray(payload.notebooks) || !payload.notebooks.length) return null;
    const notebooks = payload.notebooks.map(book => ({
      name: book.course,
      terms: Array.isArray(book.words) ? book.words.map(word => ({
        englishTerm: word.en || '', koreanMeaning: word.ko || '',
        englishDefinition: word.enDef || '', koreanDefinition: word.koDef || ''
      })) : []
    }));
    return {
      word: payload.term, referenceText: payload.context || '',
      autoSubject: payload.autoCourse, selectedSubject: payload.course || '', notebooks,
      ...(payload.translateReference === true ? {translateReference:true} : {})
    };
  }
  function normalizeModernNotebookResponse(response, payload) {
    const analysis = response?.analysis;
    if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) {
      throw new Error('서버의 분석 응답을 확인할 수 없습니다.');
    }
    const converted = {
      model: response.model,
      en: analysis.englishTerm, ko: analysis.koreanMeaning,
      discipline: analysis.specialization, enDef: analysis.englishDefinition,
      koDef: analysis.koreanDefinition, exampleEn: analysis.exampleSentence,
      course: analysis.notebookName, pos: '', exampleKo: '',
      ...(typeof analysis.referenceTranslation === 'string' ? {referenceTranslation:analysis.referenceTranslation} : {}),
      needsManualCompletion: true
    };
    // The modern analysis API intentionally omits POS and Korean example translation.
    // Never invent them: keep both empty and require explicit review before saving.
    if (payload.autoCourse) {
      const books = payload.notebooks;
      const chosen = books.find(book => book.course === analysis.notebookName);
      const terms = chosen?.words || [];
      converted.classification = {
        reason: analysis.recommendationReason || '',
        relatedTerms: Array.isArray(analysis.relatedTerms) ?
          analysis.relatedTerms.map(label => terms.find(word =>
            (word.en || word.ko || '').toLocaleLowerCase('en') === label.toLocaleLowerCase('en')))
            .filter(Boolean).map(word => ({en: word.en || '', ko: word.ko || ''})) : [],
        reviewedCourses: books.length,
        reviewedWords: books.reduce((n, book) => n + (book.words?.length || 0), 0)
      };
    }
    return converted;
  }
  function createClient({native = false, nativeHttp, fetchImpl = root.fetch?.bind(root),
    baseUrl = CLOUD_URL, token = '', deviceId = ''} = {}) {
    if (![CLOUD_URL, '', 'http://127.0.0.1:8787'].includes(baseUrl)) throw new Error('허용되지 않은 분석 서버입니다.');
    const cloud = baseUrl === CLOUD_URL;
    const headers = {'Content-Type':'application/json'};
    // AI works without a tester code: each app install has its own daily quota
    // (analysis 200 + image 200), keyed by a random per-install device ID.
    if (cloud && /^wd_[a-f0-9]{64}$/.test(deviceId)) headers['X-WC-Device'] = deviceId;
    if (cloud && token) {
      if (!/^wc_[a-f0-9]{64}$/.test(token)) throw new Error('테스터 인증 코드 형식을 확인해 주세요.');
      headers.Authorization = 'Bearer ' + token;
    }
    async function requestAttempt(payload, signal) {
      let status, result;
      if (native) {
        if (typeof nativeHttp?.request !== 'function') throw new Error('AI 연결 기능이 포함된 최신 APK로 업데이트해 주세요.');
        let response;
        try { response = await nativeHttp.request({
          url:(baseUrl || 'http://127.0.0.1:8787') + '/api/analyze',method:'POST',
          headers,data:payload,
          connectTimeout:10000,readTimeout:35000,disableRedirects:true,
        }); } catch {
          throw new Error('분석 서버에 연결하지 못했습니다. 인터넷 연결 또는 선택한 PC 서버를 확인해 주세요.');
        }
        status = response.status;
        result = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } else {
        const response = await fetchImpl(baseUrl + '/api/analyze',{
          method:'POST',headers,
          body:JSON.stringify(payload),
          signal: signal && typeof AbortSignal.any === 'function'
            ? AbortSignal.any([signal, AbortSignal.timeout(35000)])
            : signal || AbortSignal.timeout(35000),
          redirect:'error',
        });
        status = response.status;
        result = await response.json();
      }
      return {status, result};
    }
    return {async request(payload, {signal} = {}) {
      let {status, result} = await requestAttempt(payload, signal);
      // Only pre-quota request validation failures are safe to retry.
      if (status === 400 && LEGACY_NOTEBOOK_VALIDATION.test(result?.error || '')) {
        const modern = toModernNotebookRequest(payload);
        if (modern) {
          ({status, result} = await requestAttempt(modern, signal));
          if (status >= 200 && status < 300) {
            result = normalizeModernNotebookResponse(result, payload);
          }
        }
      }
      if (!(status >= 200 && status < 300)) throw new Error(result?.error || '분석 요청에 실패했습니다.');
      if (!result || result.model !== MODEL) throw new Error('분석 서버의 모델 설정을 확인해 주세요.');
      const required = ['en','ko','discipline','enDef','koDef','exampleEn','course'];
      if (!result.needsManualCompletion) required.push('pos','exampleKo');
      for (const key of required) {
        if (typeof result[key] !== 'string' || !result[key].trim()) throw new Error('필수 분석 항목을 받지 못했습니다. 다시 분석해 주세요.');
      }
      if (result.needsManualCompletion && (result.pos !== '' || result.exampleKo !== '')) {
        throw new Error('검수할 항목을 확인할 수 없습니다.');
      }
      if (result.referenceTranslation !== undefined &&
          (typeof result.referenceTranslation !== 'string' || result.referenceTranslation.length > 1200)) {
        throw new Error('참고 문장 해석을 확인하지 못했습니다. 다시 분석해 주세요.');
      }
      return result;
    }, async requestImage(payload, {signal} = {}) {
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
          signal: signal && typeof AbortSignal.any === 'function'
            ? AbortSignal.any([signal, AbortSignal.timeout(65000)])
            : signal || AbortSignal.timeout(65000),
          redirect:'error'
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
    // Random per-install ID for the public daily quota. Not a credential.
    const DEVICE_KEY = 'word-collector-device-id-v1';
    let deviceId = '';
    function getDeviceId() {
      if (deviceId) return deviceId;
      try { deviceId = root.localStorage?.getItem(DEVICE_KEY) || ''; } catch {}
      if (!/^wd_[a-f0-9]{64}$/.test(deviceId)) {
        const bytes = new Uint8Array(32);
        try { root.crypto.getRandomValues(bytes); } catch { return ''; }
        deviceId = 'wd_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
        try { root.localStorage?.setItem(DEVICE_KEY, deviceId); } catch {}
      }
      return deviceId;
    }
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
      async createImage(payload, options = {}) {
        if (!token) await root.WordCollectorAI.restoreTesterToken();
        return createClient({
          baseUrl:CLOUD_URL, token, deviceId:getDeviceId(), native:isNative(),
          nativeHttp:root.Capacitor?.Plugins?.CapacitorHttp,
        }).requestImage(payload, options);
      },
      async request(payload, options = {}) {
        if (!local && !token) await root.WordCollectorAI.restoreTesterToken();
        return createClient({
          baseUrl: local ? (isAndroid() ? 'http://127.0.0.1:8787' : '') : CLOUD_URL,
          token,
          deviceId: local ? '' : getDeviceId(),
          native: isNative(),
          nativeHttp: root.Capacitor?.Plugins?.CapacitorHttp,
        }).request(payload, options);
      }
    };
  }
})(globalThis);
