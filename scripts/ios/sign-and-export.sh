#!/usr/bin/env bash
set -euo pipefail
CERT="$RUNNER_TEMP/wordcollector-cert.p12"
MOBILEPROVISION="$RUNNER_TEMP/wordcollector-profile.mobileprovision"
KEYCHAIN="$RUNNER_TEMP/wordcollector.keychain-db"
KEYCHAIN_PASS="$(openssl rand -hex 24)"
UUID=""
cleanup() {
  if [[ -n "$UUID" ]]; then
    rm -f "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles/$UUID.mobileprovision"
  fi
  rm -f "$CERT" "$MOBILEPROVISION" "$RUNNER_TEMP/wordcollector-profile.plist"
  security delete-keychain "$KEYCHAIN" 2>/dev/null || true
}
trap cleanup EXIT
printf '%s' "$P12" | base64 -D > "$CERT"
printf '%s' "$PROFILE" | base64 -D > "$MOBILEPROVISION"
security create-keychain -p "$KEYCHAIN_PASS" "$KEYCHAIN"
security set-keychain-settings -lut 21600 "$KEYCHAIN"
security unlock-keychain -p "$KEYCHAIN_PASS" "$KEYCHAIN"
security list-keychains -d user -s "$KEYCHAIN"
security default-keychain -s "$KEYCHAIN"
security import "$CERT" -P "$P12_PASS" -A -t cert -f pkcs12 -k "$KEYCHAIN"
security set-key-partition-list -S apple-tool:,apple: -k "$KEYCHAIN_PASS" "$KEYCHAIN"
security find-identity -v -p codesigning "$KEYCHAIN" | grep -q 'Apple Distribution'
security cms -D -i "$MOBILEPROVISION" > "$RUNNER_TEMP/wordcollector-profile.plist"
UUID=$(/usr/libexec/PlistBuddy -c 'Print :UUID' "$RUNNER_TEMP/wordcollector-profile.plist")
PROFILE_TEAM=$(/usr/libexec/PlistBuddy -c 'Print :TeamIdentifier:0' "$RUNNER_TEMP/wordcollector-profile.plist")
PROFILE_APP=$(/usr/libexec/PlistBuddy -c 'Print :Entitlements:application-identifier' "$RUNNER_TEMP/wordcollector-profile.plist")
if [[ "$PROFILE_TEAM" != "$TEAM" || "$PROFILE_APP" != "$TEAM.com.yechan.wordcollector" ]]; then
  echo "::error::Apple provisioning profile does not match Word Collector's Team ID and Bundle ID."
  exit 1
fi
mkdir -p "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles"
cp "$MOBILEPROVISION" "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles/$UUID.mobileprovision"
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath "$RUNNER_TEMP/WordCollector.xcarchive" \
  CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM="$TEAM" \
  PROVISIONING_PROFILE_SPECIFIER="$UUID" \
  CODE_SIGN_IDENTITY="Apple Distribution" \
  CURRENT_PROJECT_VERSION="$GITHUB_RUN_NUMBER" archive
cat > "$RUNNER_TEMP/ExportOptions.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
 <key>method</key><string>app-store-connect</string>
 <key>destination</key><string>export</string>
 <key>teamID</key><string>$TEAM</string>
 <key>signingStyle</key><string>manual</string>
 <key>signingCertificate</key><string>Apple Distribution</string>
 <key>provisioningProfiles</key><dict>
  <key>com.yechan.wordcollector</key><string>$UUID</string>
 </dict>
</dict></plist>
EOF
xcodebuild -exportArchive -archivePath "$RUNNER_TEMP/WordCollector.xcarchive" \
  -exportPath "$RUNNER_TEMP/ipa-export" \
  -exportOptionsPlist "$RUNNER_TEMP/ExportOptions.plist"
IPA_PATH=$(find "$RUNNER_TEMP/ipa-export" -type f -name '*.ipa' -print -quit)
test -n "$IPA_PATH" && test -s "$IPA_PATH"
echo "ipa_path=$IPA_PATH" >> "$GITHUB_OUTPUT"
echo "Signed iPhone IPA generated; sending to Apple's TestFlight uploader."
