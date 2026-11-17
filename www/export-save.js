(function () {
'use strict';
  function base64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return btoa(binary);
  }
  function isMobile() {
    if (typeof navigator.userAgentData?.mobile === 'boolean' && navigator.userAgentData.mobile) return true;
    const agent = navigator.userAgent || '';
    // iPadOS reports itself as a Mac; it is told apart by its touch screen.
    return /Android|iPhone|iPad|iPod/i.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1);
  }
  async function save(bytes, name, mimeType) {
    const cap = window.Capacitor;
    if (['android', 'ios'].includes(cap?.getPlatform?.())) {
      const plugin = cap.Plugins?.WordExport;
      if (typeof plugin?.save !== 'function') throw new Error('파일 저장 기능이 포함된 최신 앱으로 업데이트해 주세요.');
      if (bytes.length > 24 * 1024 * 1024) throw new Error('파일이 24 MiB를 넘었습니다. 단어장을 나눠 내보내 주세요.');
      const result = await plugin.save({filename: name, mimeType: mimeType.split(';')[0], base64: base64(bytes)});
      return result.cancelled ? '저장을 취소했습니다.' : '파일을 저장했습니다.';
    }
    const file = new File([bytes], name, {type: mimeType});
    // Computers download the file. The share sheet is used only on phones and tablets,
    // where a browser download is hard to find (an iPhone saves through 공유 > 파일에 저장).
    if (isMobile() && navigator.canShare?.({files: [file]})) {
      try {
        await navigator.share({files: [file], title: '단어장 내보내기'});
        return '공유를 완료했습니다. 선택한 앱에서 파일을 확인하세요.';
      } catch (error) {
        // The person closed the share sheet: nothing is saved.
        if (error?.name === 'AbortError') throw error;
        // Any other refusal (e.g. NotAllowedError "Permission denied"): download instead.
      }
    }
    const url = URL.createObjectURL(file), link = document.createElement('a');
    link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return '파일 다운로드를 요청했습니다. 브라우저의 다운로드 목록을 확인하세요.';
  }
window.WordCollectorSave = save;
})();
