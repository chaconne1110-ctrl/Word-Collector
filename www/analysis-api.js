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
    }};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {createClient};
  else {
    // Keep authentication separate from vocabulary data and exported backups.
    const authKey = 'word-collector-tester-auth-v1';
    let token = '';
    let local = false;
    try {
      const saved = JSON.parse(root.localStorage.getItem(authKey));
      if (/^wc_[a-f0-9]{64}$/.test(saved?.token)) token = saved.token;
      local = saved?.useLocal === true;
    } catch { /* Storage may be unavailable; registration reports write failures. */ }
    root.WordCollectorAI = {
      getStatus() { return {registered: !!token, useLocal: local}; },
      configure({testerToken = token, useLocal = local}) {
        const nextToken = testerToken.trim();
        if (nextToken && !/^wc_[a-f0-9]{64}$/.test(nextToken)) throw new Error('테스터 인증 코드 형식을 확인해 주세요.');
        try {
          if (!nextToken && !useLocal) root.localStorage.removeItem(authKey);
          else root.localStorage.setItem(authKey, JSON.stringify({token: nextToken, useLocal}));
        } catch { throw new Error('인증 정보를 기기에 저장하지 못했습니다. 사이트 저장 설정을 확인해 주세요.'); }
        token = nextToken;
        local = useLocal;
      },
      request: payload => createClient({
        baseUrl: local ? (root.Capacitor?.getPlatform?.() === 'android' ? 'http://127.0.0.1:8787' : '') : CLOUD_URL,
        token,
        native: root.Capacitor?.getPlatform?.() === 'android',
        nativeHttp: root.Capacitor?.Plugins?.CapacitorHttp,
      }).request(payload)
    };
  }
})(globalThis);
