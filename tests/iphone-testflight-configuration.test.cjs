const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('TestFlight job is gated on Apple credentials and never changes Android build settings', () => {
  const wf = fs.readFileSync('.github/workflows/build-iphone-testflight.yml', 'utf8');
  const sh = fs.readFileSync('scripts/ios/sign-and-export.sh', 'utf8');
  const android = fs.readFileSync('.github/workflows/build-wordcollector-photo-preview.yml', 'utf8');
  assert.match(wf, /needs\.check_signing\.outputs\.ready == 'true'/);
  assert.match(wf, /upload-testflight-build@v5/);
  assert.match(wf, /IOS_APPSTORE_PROFILE_BASE64/);
  assert.match(wf, /IOS_DISTRIBUTION_P12_BASE64/);
  assert.match(sh, /app-store-connect/);
  assert.match(sh, /CODE_SIGN_STYLE=Manual/);
  assert.match(sh, /com\.yechan\.wordcollector/);
  assert.match(android, /assembleDebug/);
});
