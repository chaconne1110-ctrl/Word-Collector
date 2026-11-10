# Word Collector — 7-field MVP (2026-11-04)

> **보관된 실험 문서입니다.** 현재 main은 HTML/CSS/JavaScript와 Capacitor 8을 사용하며 `pubspec.yaml`과 Flutter 앱 진입점은 제거되었습니다. 아래 Flutter/Supabase 설명은 과거 실험의 기록이며 현재 앱의 설치·배포 방법이 아닙니다. 이 checkout에서 아래 Flutter 명령을 실행하지 마세요. 현재 사용법은 `www/README.md`, `CLOUDFLARE_GEMINI_VALIDATION.md`, `WEB_DEPLOYMENT.md`를 참고하세요.

PR #3의 Android Manifest 충돌은 현재 main의 Capacitor 설정을 보존하여 해결했습니다. 기존 파일명 `mvp-android.yml`의 자동 빌드도 현재 Capacitor debug APK를 검사하도록 바꿨습니다. 과거 `lib/mvp` 및 Supabase 실험 소스는 현재 앱이나 배포 workflow에 연결하지 않았으며, 동작·보안·실제 통신을 검증하지 않았습니다.

## Seven fields

1. 영어 용어 (`englishTerm`)
2. 한국어 뜻 (`koreanMeaning`)
3. 전공 (`specialization`)
4. 과목명 (`notebookName`)
5. 영어 정의 (`englishDefinition`)
6. 한국어 정의 (`koreanDefinition`)
7. 예문 (`exampleSentence`)

## Included

- Android Flutter screen for entry, editing, searching, bookmarking, selection and deletion
- Device-local SQLite persistence in a separate `wc_mvp.db`
- AI analysis request and editable results (Gemini via Supabase Edge Function)
- Selected-word Google spreadsheet creation endpoint (Google OAuth via Supabase Edge Function)
- GitHub Actions APK compilation and downloadable workflow artifact (after a successful build)

## Important limitations and rollout conditions

**Not yet end-to-end tested or deployed.** The source branch and APK build workflow are not themselves a working live AI/Sheets service. Do not call this production-ready.

- The MVP deliberately uses a separate database and does **not** migrate or merge the existing demo data from `lib/main.dart`.
- An API URL and anon key are needed to call the server. No LLM or Google OAuth secret is stored in the APK.
- Google Sheets are created under the **Google account granting OAuth**; share/access control should be managed there.
- The backend functions currently depend on the Supabase platform's auth configuration. **Do not deploy them publicly without checking authentication, abuse controls, and request quotas.** Publishable keys alone are not user authentication.
- No automated test suite, emulator verification, package signature distribution review or live API integration test has been completed.
- Android APK is available only if the GitHub Actions workflow succeeds, and appears in that workflow run's Artifacts section. It is **not** a GitHub Release.

## Backend configuration (administrator)

1. Configure a Supabase project and install the Supabase CLI.
2. Set Supabase secrets: `GEMINI_API_KEY`; optional `GEMINI_MODEL`. The model needs to be available to the supplied key.
3. Enable Google Sheets API in your Google Cloud project; obtain a dedicated Google OAuth refresh token authorized with the **Sheets spreadsheet scope**, and set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` as server secrets. The refresh token must remain on the server. Consider dedicated account and least-privilege OAuth.
4. Deploy the two functions:
   `supabase functions deploy analyze-term`
   `supabase functions deploy export-sheets`
5. Review and enforce user authentication, per-user authorization, rate limits and Google account access before public use.
6. In GitHub repository Variables, set:
   - `WC_API_URL`: `https://YOUR-PROJECT.supabase.co/functions/v1`
   - `WC_ANON_KEY`: the project's publishable/anon key, **never a service_role key**.
   These variables are baked into the APK by `--dart-define` and are not secret. Never put private API credentials here.

## Archived Flutter local development (현재 checkout에서 실행 금지)

With Flutter 3.47.9 and the project's checked-in lockfile:

```bash
flutter pub get --enforce-lockfile
flutter run -t lib/mvp/main.dart --dart-define=WC_API_URL=https://YOUR-PROJECT.supabase.co/functions/v1 --dart-define=WC_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

## Android APK from GitHub

현재 빌드: **Actions → Word Collector Capacitor Android APK → 성공한 실행 → Artifacts → word-collector-capacitor-debug-apk**. 이 artifact는 Capacitor debug APK이며 기존 설치 앱과 같은 서명이라고 가정하면 안 됩니다. 설치를 위해 기존 앱을 삭제하거나 데이터를 초기화하지 마세요. 이 workflow는 release 배포나 과거 Flutter MVP 빌드를 수행하지 않습니다.

## AI prompt adaptation

Based on the uploaded "Recall 반도체 13열 통합 자동화" (v6.2): preserves technical/academic-context meaning, concise English definition, Korean explanation, ambiguity caution and protection against instructions embedded in vocabulary data. The 13-column format, subject enumeration, priority and provider fallbacks are **not carried over**; the seven-field app adds one original example sentence. This is an adapted prompt, not an exact copy of `Recall_Master_Guidelines_v3.0`, which was referenced but not provided.
