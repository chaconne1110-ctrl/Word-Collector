(function (root) {
  'use strict';
  const MODEL = 'gemini-3.5-flash-lite';
  function createClient({native = false, nativeHttp, fetchImpl = root.fetch?.bind(root)} = {}) {
    return {async request(payload) {
      let status, result;
      if (native) {
        if (typeof nativeHttp?.request !== 'function') throw new Error('AI 연결 기능이 포함된 최신 APK로 업데이트해 주세요.');
        let response;
        try { response = await nativeHttp.request({
          url:'http://127.0.0.1:8787/api/analyze',method:'POST',
          headers:{'Content-Type':'application/json'},data:payload,
          connectTimeout:10000,readTimeout:35000,disableRedirects:true,
        }); } catch { throw new Error('PC 분석 서버에 연결하지 못했습니다. 서버 실행 상태와 USB 8787 포트 연결을 확인해 주세요.'); }
        status = response.status;
        result = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } else {
        const response = await fetchImpl('/api/analyze',{
          method:'POST',headers:{'Content-Type':'application/json'},
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
  else root.WordCollectorAI = {request: payload => createClient({
    native: root.Capacitor?.getPlatform?.() === 'android',
    nativeHttp: root.Capacitor?.Plugins?.CapacitorHttp,
  }).request(payload)};
})(globalThis);
