(function () {
'use strict';
  function base64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return btoa(binary);
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
    if (navigator.canShare?.({files: [file]})) {
      await navigator.share({files: [file], title: '단어장 내보내기'});
      return '공유를 완료했습니다. 선택한 앱에서 파일을 확인하세요.';
    }
    const url = URL.createObjectURL(file), link = document.createElement('a');
    link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return '파일 다운로드를 요청했습니다. 브라우저의 다운로드 목록을 확인하세요.';
  }
window.WordCollectorSave = save;
})();
