# Word Collector — 7-field MVP (2026-11-04)

This is a separate, experimental MVP entry point. Existing `lib/main.dart` and team branches remain intact.

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

## Local development

With Flutter 3.47.9 and the project's checked-in lockfile:

```bash
flutter pub get --enforce-lockfile
flutter run -t lib/mvp/main.dart --dart-define=WC_API_URL=https://YOUR-PROJECT.supabase.co/functions/v1 --dart-define=WC_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

## Android APK from GitHub

Open **Actions → Word Collector MVP Android APK → latest successful run → Artifacts → word-collector-mvp-android-apk**. Download the zip and extract `app-release.apk`. Install only builds from a trusted repository and verify Android installation warnings.

This workflow compiles a Flutter release APK using the current Android signing configuration; it does not publish a signed, versioned production Release. Existing source and any team branches remain untouched.

## AI prompt adaptation

Based on the uploaded "Recall 반도체 13열 통합 자동화" (v6.2): preserves technical/academic-context meaning, concise English definition, Korean explanation, ambiguity caution and protection against instructions embedded in vocabulary data. The 13-column format, subject enumeration, priority and provider fallbacks are **not carried over**; the seven-field app adds one original example sentence. This is an adapted prompt, not an exact copy of `Recall_Master_Guidelines_v3.0`, which was referenced but not provided.
