const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative));
test('branding source assets are WebP images', () => {
  for(const relative of ['www/icons/wordcollector-app-icon.webp','www/assets/images/wordcollector-startup-logo.webp','android/app/src/main/res/drawable-nodpi/wordcollector_app_icon.webp','android/app/src/main/res/drawable-nodpi/wordcollector_startup_logo.webp']){
    const asset=read(relative);
    assert.ok(asset.length > 1000, relative);
    assert.equal(asset.toString('ascii', 0, 4),'RIFF',relative);
    assert.equal(asset.toString('ascii', 8, 12),'WEBP',relative);
  }
});
test('Android displays branded launcher icon and launch background', () => {
 const manifest=read('android/app/src/main/AndroidManifest.xml').toString();
 const styles=read('android/app/src/main/res/values/styles.xml').toString();
 const launch=read('android/app/src/main/res/drawable/wordcollector_launch_screen.xml').toString();
 assert.match(manifest,/android:icon="@drawable\/wordcollector_app_icon"/);
 assert.match(styles,/wordcollector_launch_screen/);
 assert.match(launch,/wordcollector_startup_logo/);
});
test('Web app uses new app icon and original-text start image', () => {
 const home=read('www/index.html').toString();
 const manifest=JSON.parse(read('www/manifest.webmanifest'));
 const sw=read('www/sw.js').toString();
 assert.match(home,/icons\/wordcollector-app-icon\.webp/);
 assert.match(home,/wordcollector-startup-logo\.webp/);
 assert.ok(manifest.icons.some(item=>item.src==='icons/wordcollector-app-icon.webp'));
 assert.match(sw,/wordcollector-startup-logo\.webp/);
});
