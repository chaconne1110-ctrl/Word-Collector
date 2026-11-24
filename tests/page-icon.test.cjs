// Every page the app shows declares the app icon. Without it the browser (and the Android
// WebView on its first load) asks for /favicon.ico, which does not exist (404), and web tabs
// show a blank icon. Redirect-only stubs (location.replace, no <head>) are exempt.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry =>
  entry.isDirectory() ? (entry.name === 'vendor' ? [] : walk(path.join(dir, entry.name))) : [path.join(dir, entry.name)]);

test('every displayed page declares the app icon, and the icon file exists', () => {
  const pages = walk('www').filter(file => file.endsWith('.html'));
  let checked = 0;
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes('</head>') && /location\.replace\(/.test(html)) continue;   // redirect stub
    const link = html.match(/<link[^>]*rel="icon"[^>]*href="([^"]+)"/) || html.match(/<link[^>]*href="([^"]+)"[^>]*rel="icon"/);
    assert.ok(link, file + ': no <link rel="icon">');
    assert.ok(fs.existsSync(path.join(path.dirname(file), link[1])), file + ': icon not found: ' + link[1]);
    checked++;
  }
  assert.ok(checked >= 15, 'expected the app pages to be checked, got ' + checked);
});
