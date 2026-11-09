// UI owners can load this file on a page to add an export entry without changing app.js.
if (!document.querySelector('[data-word-export-link]')) {
  const link = document.createElement('a');
  link.href = 'export.html';
  link.textContent = 'CSV·XLSX 내보내기';
  link.dataset.wordExportLink = '';
  link.style.cssText = 'position:fixed;right:16px;bottom:84px;z-index:60;background:#00236f;color:#fff;padding:10px 14px;border-radius:20px;font:14px system-ui;text-decoration:none';
  document.body.append(link);
}
