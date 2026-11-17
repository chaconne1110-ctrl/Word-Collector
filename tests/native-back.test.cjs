const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('www/native-back.js', 'utf8');

// Runs www/native-back.js against a fake page and returns a function that
// presses the Android back button.
function page({platform = 'android', path = '/words.html', dialogs = [], headerButtons = []} = {}) {
  const calls = [];
  let handler = null;
  const location = {pathname: path, href: 'https://localhost' + path};
  const window = {Capacitor: {getPlatform: () => platform, Plugins: {App: {
    addListener(name, callback) { assert.equal(name, 'backButton'); handler = callback; },
    exitApp() { calls.push('exit'); }
  }}}};
  const document = {
    currentScript: {src: 'https://localhost/native-back.js'},
    querySelectorAll(selector) {
      if (selector === 'dialog[open]') return dialogs;
      if (selector === 'header a, header button') return headerButtons;
      throw new Error('unexpected selector ' + selector);
    }
  };
  const history = {back() { calls.push('history.back'); }};
  new Function('window', 'document', 'location', 'history', 'URL', source)(window, document, location, history, URL);
  return {calls, location, installed: Boolean(handler),
    press: (canGoBack = true) => handler({canGoBack})};
}
function arrow(label, onclick = '') {
  return {clicked: 0, querySelector: () => ({textContent: ' arrow_back '}),
    getAttribute: name => name === 'onclick' ? onclick : null, click() { this.clicked++; }, label};
}
function dialog({preventsCancel = false} = {}) {
  return {closed: 0, cancelled: 0, close() { this.closed++; },
    dispatchEvent(event) { this.cancelled++; assert.equal(event.type, 'cancel'); return !preventsCancel; }};
}

test('only the Android app listens to the back button', () => {
  assert.equal(page({platform: 'web'}).installed, false);
  assert.equal(page({platform: 'ios'}).installed, false);
  assert.equal(page().installed, true);
});

test('an open dialog is cancelled first, like Escape', () => {
  const confirm = dialog();
  const p = page({dialogs: [confirm], headerButtons: [arrow('back')]});
  p.press();
  assert.equal(confirm.cancelled, 1);
  assert.equal(confirm.closed, 1);
  assert.deepEqual(p.calls, []);
  // The analysis waiting screen handles cancel itself (stops the analysis).
  const waiting = dialog({preventsCancel: true});
  page({path: '/quick_capture/review.html', dialogs: [waiting]}).press();
  assert.equal(waiting.cancelled, 1);
  assert.equal(waiting.closed, 0);
});

test('home closes the app; other pages go back in history first (never the on-screen arrow)', () => {
  for (const path of ['/index.html', '/']) {
    const home = page({path});
    home.press();
    assert.deepEqual(home.calls, ['exit']);
  }
  const back = arrow('flashcard back');
  const card = page({path: '/flashcard.html', headerButtons: [back]});
  card.press(true);
  assert.equal(back.clicked, 0, 'the arrow opens its parent as a new page, so it is not used when history exists');
  assert.deepEqual(card.calls, ['history.back']);
  // Opened directly on the card (no history): the on-screen arrow is the way back.
  const fresh = page({path: '/flashcard.html', headerButtons: [back]});
  fresh.press(false);
  assert.equal(back.clicked, 1);
});

test('home -> bookmarks -> card, then back repeatedly: card, bookmarks, home, exit (no bouncing)', () => {
  const stack = ['/index.html', '/bookmarks.html', '/flashcard.html'];
  const visited = [];
  for (let press = 0; press < 6 && stack.length; press++) {
    const path = stack[stack.length - 1];
    visited.push(path);
    const arrowHere = arrow('arrow on ' + path);
    const p = page({path, headerButtons: path === '/flashcard.html' ? [arrowHere] : []});
    p.press(stack.length > 1);
    if (p.calls.includes('exit')) { stack.length = 0; visited.push('exit'); break; }
    if (p.calls.includes('history.back')) stack.pop();
    else if (arrowHere.clicked) stack.push('/bookmarks.html');
    else stack.push('/index.html');
  }
  assert.deepEqual(visited, ['/flashcard.html', '/bookmarks.html', '/index.html', 'exit']);
});

test('pages without an arrow (or with a history.back arrow) go back, or home without history', () => {
  const historyArrow = arrow('input back', 'history.back()');
  const capture = page({path: '/quick_capture/code.html', headerButtons: [historyArrow]});
  capture.press(true);
  assert.equal(historyArrow.clicked, 0);
  assert.deepEqual(capture.calls, ['history.back']);
  const fresh = page({path: '/quick_capture/code.html', headerButtons: [historyArrow]});
  fresh.press(false);
  assert.deepEqual(fresh.calls, []);
  assert.equal(fresh.location.href, 'https://localhost/index.html');
});

test('every page loads the script and the APK includes the App plugin', () => {
  for (const file of ['index.html', 'words.html', 'bookmarks.html', 'flashcard.html', 'edit.html',
    'backup.html', 'export.html', '_6/code.html', 'quick_capture/code.html', 'quick_capture/review.html']) {
    const html = fs.readFileSync('www/' + file, 'utf8');
    assert.match(html, /screen-scale\.js"><\/script><script src="(\.\/|\.\.\/)native-back\.js"><\/script>/, file);
  }
  assert.match(fs.readFileSync('package.json', 'utf8'), /"@capacitor\/app": "\^8\./);
  assert.match(fs.readFileSync('android/capacitor.settings.gradle', 'utf8'), /include ':capacitor-app'/);
  assert.match(fs.readFileSync('android/app/capacitor.build.gradle', 'utf8'), /implementation project\(':capacitor-app'\)/);
  assert.match(fs.readFileSync('www/sw.js', 'utf8'), /"native-back\.js",/);
});

test('after saving, the analysis page is replaced so back does not return to it', () => {
  const analysis = fs.readFileSync('www/quick_capture/analysis.js', 'utf8');
  assert.match(analysis, /location\.replace\('\.\.\/' \+ route\('words\.html'/);
});

test('app version number rises with every build and shows the branch name', () => {
  const gradle = fs.readFileSync('android/app/build.gradle', 'utf8');
  assert.match(gradle, /versionCode wcVersionCode/);
  assert.match(gradle, /versionName wcVersionName/);
  assert.match(gradle, /System\.currentTimeMillis\(\) - 1767225600000L\) \/ 60000L/);
  assert.equal(Date.UTC(2026, 0, 1), 1767225600000);
  assert.doesNotMatch(gradle, /versionCode 1\b/);
});
