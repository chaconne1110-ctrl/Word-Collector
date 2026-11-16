// Android hardware back button in the APK. Without a listener the app would
// simply close. Does nothing on the web or iOS.
//   1. an open dialog (confirmations, the analysis waiting screen) is cancelled,
//      exactly like pressing Escape;
//   2. on the home screen the app closes;
//   3. otherwise the page's own on-screen back arrow is used, so both buttons
//      lead to the same place;
//   4. pages whose arrow is only history.back(), or that have no arrow, go back
//      in history, or to the home screen when there is no history.
(() => {
  const capacitor = window.Capacitor;
  const App = capacitor?.Plugins?.App;
  if (capacitor?.getPlatform?.() !== 'android' || typeof App?.addListener !== 'function') return;
  const homeUrl = new URL('index.html', document.currentScript?.src || location.href);
  const isHome = () => location.pathname === homeUrl.pathname || location.pathname === '/';

  function onScreenBackArrow() {
    return [...document.querySelectorAll('header a, header button')].find(element =>
      element.querySelector('.material-symbols-outlined')?.textContent.trim() === 'arrow_back' &&
      !/history\.back/.test(element.getAttribute('onclick') || ''));
  }

  App.addListener('backButton', ({canGoBack}) => {
    const dialogs = document.querySelectorAll('dialog[open]');
    const dialog = dialogs[dialogs.length - 1];
    if (dialog) {
      if (dialog.dispatchEvent(new Event('cancel', {cancelable: true}))) dialog.close();
      return;
    }
    if (isHome()) {
      App.exitApp();
      return;
    }
    const arrow = onScreenBackArrow();
    if (arrow) arrow.click();
    else if (canGoBack) history.back();
    else location.href = homeUrl.href;
  });
})();
