// Public web only: do not register service workers inside the Capacitor Android/iOS WebView.
(() => {
  const platform = window.Capacitor?.getPlatform?.();
  if (['android', 'ios'].includes(platform) || location.protocol !== 'https:' ||
      !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', {scope:'./'}).catch(() => {
      // Lack of offline support must not prevent normal online browsing.
    });
  });
})();
