// Android hardware back button in the APK. Without a listener the app would
// simply close. Does nothing on the web or iOS.
//   1. an open dialog (confirmations, the analysis waiting screen) is cancelled,
//      exactly like pressing Escape;
//   2. on the home screen the app closes;
//   3. otherwise go back in history (the screen the user came from);
//   4. without history (e.g. the app was opened on this screen), use the page's
//      on-screen back arrow, or go to the home screen.
// History comes first: on-screen arrows open their parent as a new page, so
// using them here made back bounce between two screens (list <-> card).
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
    if (canGoBack) {
      history.back();
      return;
    }
    const arrow = onScreenBackArrow();
    if (arrow) arrow.click();
    else location.href = homeUrl.href;
  });
})();
