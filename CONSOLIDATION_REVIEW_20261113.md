# Word Collector consolidated branch — integration record (2026-11-13 KST)

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
1. `feature/webapp-only-20261112` server-issued Turnstile token design supersedes client-replaceable `feature/public-ai-400-per-device` ID design. Neither client device IDs nor Origin headers are considered sufficient authentication.
2. The current `main` analysis model's **automatic first-notebook creation**, current review/save implementation, flashcard flow and newest navigation are preserved. Old branch copies of these files were **not** used wholesale.
3. Failed upstream Gemini requests and region-retry calls remain counted where they represent actual model API attempts. `feature/public-ai-400-per-device`'s request-count refunds and unmetered retry logic were **not** transplanted, because the requested limit is on actual API requests, not successes.
4. Existing `main` Android KeyStore native authentication supersedes the older `feature/secure-tester-token` branch; no plaintext key storage or backup export.
5. `feature/xlsx-export` only adds a Flutter package; current Capacitor/web app already has XLSX export and tests. Do not copy the Flutter dependency.
6. Newest `fix/main-layout-review` corrections supersede older mobile overlap fixes in `feature/ui-ux-notebook-settings` and `feature/public-ai-400-per-device`.

## Release blockers — do NOT deploy, merge, or delete needed source branches yet
- Configure production Turnstile widget for `chaconne1110-ctrl.github.io`; Worker secrets `TURNSTILE_SECRET`, `AUTO_AUTH_IP_SECRET`, site key `TURNSTILE_SITE_KEY` and explicit `AUTO_AUTH_ENABLED=true`. Back up D1; apply additive migration `0004` before enabling enrollment.
- Test the HTTPS native iframe page on a physical Android device (including 401/429, bad challenges, restart/reinstall and offline behavior). Test narrow-screen and flashcard UI on real devices.
- Run staging Worker test with a disposable D1 database, mocked Gemini API calls and controlled quota limits. No production Gemini charges during validation.
- Verify deploy process and environment protections. Changes to this branch must not trigger GitHub Pages release or Worker deployment.
- Rate limit remains a **per-issued identity + network abuse guard**, not an enforceable per-human quota across VPNs/devices.

## Branch disposition (not yet deleted)
| Branch | Recommendation | Reason |
|---|---|---|
| `main` | KEEP | deployed production history and releases |
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
