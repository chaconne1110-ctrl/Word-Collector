// Per-device AI photo storage. JPEG blobs stay in IndexedDB, not localStorage or tester backups.
// Backup/export of photos will require a dedicated future version of the backup format.
const WordCollectorPhoto = (() => {
  const DB_NAME = 'wordcollector-photo-store-v1';
  const STORE = 'photos';
  let opening;
  function database() {
    if (!opening) opening = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') return reject(new Error('이 기기에서 사진 저장 기능을 사용할 수 없습니다.'));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, {keyPath:'termId'});
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error('사진 저장소를 열지 못했습니다.'));
    }).catch(error => { opening = null; throw error; });
    return opening;
  }
  async function compressedJpeg(image) {
    if (!['image/png','image/jpeg','image/webp'].includes(image?.mimeType) ||
        typeof image.data !== 'string' || image.data.length > 5 * 1024 * 1024) {
      throw new Error('유효한 AI 사진 데이터가 아닙니다.');
    }
    const bytes = Uint8Array.from(atob(image.data), char => char.charCodeAt(0));
    const original = new Blob([bytes], {type:image.mimeType});
    const tempUrl = URL.createObjectURL(original);
    let bitmap;
    try {
      bitmap = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('생성된 사진을 읽지 못했습니다.'));
        img.src = tempUrl;
      });
      const ratio = Math.min(1, 720 / Math.max(bitmap.naturalWidth, bitmap.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.naturalHeight * ratio));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('사진 변환 기능을 사용할 수 없습니다.');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const jpeg = await new Promise((resolve, reject) =>
        canvas.toBlob(value => value ? resolve(value) : reject(new Error('사진을 JPEG로 변환하지 못했습니다.')),
          'image/jpeg', 0.78));
      if (jpeg.size > 2 * 1024 * 1024) throw new Error('사진 크기가 저장 제한을 초과했습니다.');
      return jpeg;
    } finally {
      URL.revokeObjectURL(tempUrl);
    }
  }
  async function save(termId, image) {
    if (typeof termId !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(termId)) {
      throw new Error('사진 저장 대상 단어가 올바르지 않습니다.');
    }
    const blob = await compressedJpeg(image);
    const db = await database();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({termId, blob, savedAt:new Date().toISOString()});
      tx.oncomplete = resolve;
      tx.onerror = () => reject(new Error('기기에 사진을 저장하지 못했습니다.'));
      tx.onabort = () => reject(new Error('기기 사진 저장이 취소됐습니다.'));
    });
  }
  async function get(termId) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(termId);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(new Error('저장된 사진을 읽지 못했습니다.'));
    });
  }
  return {save, get};
})();
