# Word Collector branding integration (v7)

The user-supplied original image (with Korean and English wordmark) is the initial loading-screen logo.
The image generated from it (symbol only) is the app launcher icon. Both assets are stored as WebP.

- Android launcher icon: `android/app/src/main/res/drawable-nodpi/wordcollector_app_icon.webp`, referenced by AndroidManifest.xml
- Android launch window: `android/app/src/main/res/drawable/wordcollector_launch_screen.xml`, referenced by the launch theme in values/styles.xml
- Web app / PWA icon: `www/icons/wordcollector-app-icon.webp`, referenced from index.html and manifest.webmanifest
- Initial WebView loading overlay: original text logo at `www/assets/images/wordcollector-startup-logo.webp`, shown from index.html once per page session, closed on page load (minimum ~700 ms, maximum 4s)
- Service worker cache version bumped to refresh the branding assets

These changes do not modify the user's wordbooks, bookmarks, auth tokens, API server, or Cloudflare deployment. The OS-controlled Android 12+ startup screen may show the small app icon briefly before the WebView displays the original wordmark.
