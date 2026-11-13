# Word Collector consolidated branch — integration record (2026-11-13 KST)

## Priority override (branches `integrate/consolidated-chat-priority-20261113` → `v1`, `v2`, …)
Work continues on version branches: `v1` was created from this branch, and every later round of
changes goes to a new branch `v<N+1>` based on the newest `v<N>`.

This branch is `integrate/consolidated-review-20261113` with the owner's decisions from the
`feature/public-ai-400-per-device` work applied as the **highest-priority** source. Where this
section disagrees with anything below, this section wins.

- **Public access = per-install device ID.** The app sends a random `X-WC-Device` ID; requests
  without a code get 200 analysis + 200 image calls/day per device. No tester code is needed.
- **No tester-code UI.** The Quick Capture tester/server panel is removed and any code saved by an
  older build is cleared on load, so an expired code can never block analysis.
- **Failed requests are not charged to the personal quota.** A Gemini error, timeout or unusable
  output refunds the reserved call. The global (and, for Turnstile identities, registration-IP)
  counters keep the attempt so failures stay bounded per day.
- **"User location is not supported" is re-sent up to twice** (3 attempts total); other errors are
  returned after one call. Charged once per request. The rejected response body is released before
  re-sending. Measured effect is small (rejections follow the Cloudflare entry location, so re-sending
  inside one request usually hits the same block); the US placement below matters more.
- **Worker placement `gcp:us-central1`** (see `cloudflare/wrangler.example.jsonc`) must be kept on deploy.
- **v2: Gemini relay.** Placement and retries did not stop "User location is not supported" (400).
  From `v2`, the Worker sends Gemini calls through a US Cloud Run relay when `GEMINI_RELAY_URL` and
  the secret `GEMINI_RELAY_SECRET` are set (`relay/README.md`). Users enter nothing; no new APK.
  Without the variable, calls go direct as before; a bad relay config fails closed and is refunded.
- Turnstile enrollment code stays in the Worker/`www/anonymous-auth.js` but is **dormant and not used by
  the app**; per-device identities are exempt from the registration-IP cap.
- **Production state (2026-11-12):** the live Worker already runs this device-ID/refund/retry
  behaviour (version `224c0223`), migration 0003 is applied, placement is set. Deploying a Worker
  without `X-WC-Device` support would break the APKs distributed from that branch.

## Integration status
Working branch: `integrate/consolidated-review-20261113`. Draft PR #12 targets `main`; **not deployed or merged**. The branch starts with `main` + the latest `fix/main-layout-review` changes.

### Implemented
- Newest mobile layout correction retained (`www/assets/styles/mobile-layout.css`, `www/index.html`, `www/sw.js`).
- Secure Turnstile challenge on the hosted GitHub Pages origin plus server-issued, 256-bit random bearer token; only SHA-256 token hashes are stored in D1. No Gemini API key or tester code in public client.
- Shared, HMAC-hashed registration-IP caps: at most two new credentials per day per network, at most **400 accepted AI attempts/day** across issued credentials associated with the same registration-IP bucket. Existing per-identity limits: **200 text + 200 image = 400/day**. Existing global analysis and image ceilings remain.
- Browser: restore credentials in private IndexedDB on the web origin. Android: request a Turnstile challenge within the trusted HTTPS GitHub Pages iframe, accept messages only from its fixed trusted origin and iframe window, then persist the issued credential through the existing Android Keystore plugin.
- Retains old valid tester credentials and their quotas as a fallback. **No forced data migration or deletion** of words, notebooks, bookmarks, photos, backups or server usage data.
- `cloudflare/migrations/0004_anonymous_auth.sql` is additive and must be applied by the administrator only before enrollment is switched on.
- New regression tests: anonymous enrollment, fake/foreign origin rejection, token hashing, same-IP quota, browser reuse and native iframe origin check. CI validation is configured on this review branch; Android real-device validation remains outstanding.

### Deliberate conflict resolution (latest functional behavior wins)
1. ~~Turnstile token design supersedes the device-ID design~~ — **overridden**: the per-device ID design is primary (see Priority override). Turnstile remains dormant/opt-in.
2. The current `main` analysis model's **automatic first-notebook creation**, current review/save implementation, flashcard flow and newest navigation are preserved. Old branch copies of these files were **not** used wholesale.
3. ~~Failed requests stay counted~~ — **overridden**: the owner asked that failed requests not be charged to the personal quota; refunds and the location retry are transplanted.
4. Existing `main` Android KeyStore native authentication supersedes the older `feature/secure-tester-token` branch; no plaintext key storage or backup export.
5. `feature/xlsx-export` only adds a Flutter package; current Capacitor/web app already has XLSX export and tests. Do not copy the Flutter dependency.
6. Newest `fix/main-layout-review` corrections supersede older mobile overlap fixes in `feature/ui-ux-notebook-settings` and `feature/public-ai-400-per-device` (layout only; that branch's auth, refund and tester-UI removal are applied here).

## Release checklist (device-ID design)
Required for the current design:
- **Web (GitHub Pages):** `.github/workflows/deploy-chat-priority-web.yml` deploys the pushed `v<N>`
  branch's `www` to the existing Pages URL on every push (newest push wins). The `github-pages`
  environment must allow branches matching `v*` (Settings → Environments → github-pages →
  Deployment branches); until then the deploy job is rejected. `main`'s `deploy-web.yml` targets
  the same URL, so a later `main` deploy replaces the `v<N>` site and vice versa.
- **Worker:** deploy with `cloudflare/wrangler.example.jsonc` settings (placement `gcp:us-central1`,
  live analysis and image flags) and the existing D1. Migration 0003 is already applied in production.
  Keep `X-WC-Device` support — installed APKs depend on it.
- **Android:** install a new APK built from the `v<N>` branch (APK workflow runs only on request:
  manual dispatch or a change to its workflow file). Test analysis without a code, the leftover-code
  recovery (unreadable / 401 code), narrow-screen and flashcard UI on a real device.
- Run `node --test tests/*.test.cjs server/test/*.test.cjs cloudflare/*.test.mjs` (no paid Gemini calls).

Only if the optional Turnstile enrollment is ever switched on (not needed for the device-ID design):
- Configure the Turnstile widget for `chaconne1110-ctrl.github.io`, Worker secrets `TURNSTILE_SECRET`,
  `AUTO_AUTH_IP_SECRET`, site key `TURNSTILE_SITE_KEY`, back up D1 and apply additive migration
  `0004` **before** setting `AUTO_AUTH_ENABLED=true`; then test the HTTPS native iframe page on a
  physical Android device and run a staging Worker with a disposable D1 and mocked Gemini calls.

Limits are per device (or per issued identity) plus the global caps; they are an abuse guard, not an
enforceable per-human quota — clearing app data or reinstalling yields a new device ID.

## Branch disposition (not yet deleted)
| Branch | Recommendation | Reason |
|---|---|---|
| `main` | KEEP | deployed production history and releases |
| `v1`, `v2`, … (newest `v<N>`) | KEEP | current work; each round of changes is a new version branch |
| `integrate/consolidated-chat-priority-20261113` | Delete after `v1` is accepted | `v1` was created from it |
| `integrate/consolidated-review-20261113` | KEEP pending QA | all reviewed changes live here |
| `feature/ai-photo-generation-20261111` | Safe to delete now if desired | ancestor of main, zero unique commits in comparison |
| `fix/main-layout-review` | Delete after consolidated PR is merged | its newest fixes are included here |
| `feature/webapp-only-20261112` | Delete after consolidated PR is merged and rollout validated | anonymous Turnstile implementation is re-integrated without overwriting newer main functionality |
| `feature/secure-tester-token` | Candidate after native secure-store regression/QA | main already has newer encrypted native token storage |
| `feature/ui-ux-notebook-settings` | Candidate after flashcard and notebook QA | main and consolidated branch already contain later navigation and layout implementations |
| `feature/xlsx-export` | Candidate if historical Flutter experiment retired | Flutter package-only change not needed for web/Capacitor XLSX |
| `feature/flutter-gemini35` | Candidate only if Flutter experiment retired | legacy Flutter, historical PR merged but branch diverged |
| `feature/ui-ux` | Candidate after confirming no needed experimental Flutter UI | historical branch diverged |
| `feature/cloudflare-gemini35` | Candidate after checking 2 unique commits | historical PR merged but branch diverged |
| `feature/public-ai-400-per-device` | Retain until final production/security acceptance | alternate quota code not directly ported; some experimental changes intentionally rejected |
| `feature/cloudflare-daily-global-1500` | KEEP — PR #9 open | unsettled quota and existing open pull request |

Never delete any branch automatically on the basis of this table; a merge or equal functionality must be verified first. Delete only when expressly requested.
