# Web + Android anonymous automatic authentication (opt-in, not deployed)

Scope: `integrate/consolidated-review-20261113`. This implementation **does not deploy** the GitHub Pages site or Cloudflare Worker, remove existing tester users, or migrate client word records.

## User flow

- On the hosted GitHub Pages web app, no tester approval code is entered. The browser restores a 90-day, random server-issued capability from same-origin IndexedDB, or requests a new one using Cloudflare Turnstile (an invisible challenge may occasionally require user interaction).
- Only the issued bearer credential (not an AI key) is sent to the existing Worker over HTTPS. No credentials are copied into words, export files, or backups. On Android, the app performs its Turnstile challenge inside a fixed HTTPS GitHub Pages iframe, verifies its message origin, and saves its random server-issued token through the existing Android KeyStore plugin. Existing manually registered tester tokens remain valid. This is an unverified Android integration pending real-device tests.
- Reinstalling or clearing credentials creates a new anonymous identity, subject to registration and network caps. A cleared browser profile or a different browser gets a separate anonymous identity. **Anonymous identity is not verified human identity.** For strict per-human quotas across devices or reinstallations, use account login with a verified external identity provider instead.

## Enforcement and abuse mitigations

- Server validates Turnstile's `success`, `hostname`, and `action`; client-side claims and Origin headers alone do not authorize enrollment. No valid Turnstile solution, no token.
- Worker requires `CF-Connecting-IP` at enrollment; creates a keyed HMAC-SHA256 hash using a server-only, stable secret. Original IP is **never stored** in D1. Max two new credentials per registration IP **per Korea day**, in a transactional D1 operation.
- Every accepted model attempt is counted, **including upstream failures**, so automatic retries/refunds are intentionally NOT copied from `feature/public-ai-400-per-device`: the user asked for **actual API calls**, not only successful responses.
- D1 retains existing per-token quota tables: **200 text analysis + 200 image generation = maximum 400 API requests/day per issued identity**. Analysis and image-generation reservations each include a third, transactional SQL debit for the **shared registration-IP cap of 400 total requests/day**. Exceeding the cap prevents the Gemini call. The older global model quotas still apply.
- Trade-off: the shared-IP ceiling can block unrelated users behind the same NAT (school Wi-Fi, mobile network). IP rotation, VPNs, stolen sessions, and browser changes mean this is **mitigation, not a guarantee that one human cannot evade limits**. For production, consider verified login, Cloudflare WAF limits, abuse alerts, and a restrictive spending cap.
- Auth tokens are cryptographically random 256-bit values. D1 stores only SHA-256 token hashes, never raw tokens. Browser stores the raw token in IndexedDB; XSS can still steal browser credentials. Use a dedicated site origin and deploy a carefully audited CSP before broad public access.
- Server fails closed when anonymous mode or secrets are absent. Older tester tokens are still accepted and keep their existing quota history. The old app word/notebook/bookmark storage is not modified.

## Activation steps (administrator only; do not activate automatically)

1. In Cloudflare Turnstile, register a **managed widget** for the exact hostname `chaconne1110-ctrl.github.io`, obtain its public site key and secret. Use HTTPS. Android's iframe relies on the published `/Word-Collector/auth/native-challenge.html` at this hostname; the widget does not execute on `capacitor://localhost` itself.
2. Back up the existing D1 database. Apply additive migration `cloudflare/migrations/0004_anonymous_auth.sql` to the **existing** D1; do not drop or recreate the existing tables. Migration 0003 (quota overflows) must already be applied.
3. Set Worker secrets via Wrangler, NOT via GitHub commits:
   - `TURNSTILE_SECRET` = Turnstile server-side secret
   - `AUTO_AUTH_IP_SECRET` = stable, random, minimum 32-character secret; **do not rotate without a migration plan** because the HMAC IP buckets would change.
4. Set Worker public environment variable `TURNSTILE_SITE_KEY` (this is not a secret), and only when steps 1-3 are complete set `AUTO_AUTH_ENABLED=true`. Keep `ENABLE_LIVE_ANALYSIS` and `ENABLE_IMAGE_GENERATION` under existing manual operator control.
5. Run `node --test tests/*.test.cjs server/test/*.test.cjs cloudflare/*.test.mjs`. Verify health, CORS, session issuance, per-token 200+200, same-IP 400 combined limit, and global caps in a **staging** Worker with a non-production D1 and safe mock Gemini calls. Confirm Android debug APK contains `www/anonymous-auth.js`, `auth/native-challenge.html`, and the secure Keystore plugin, then test enrollment, restart persistence, bad origins, denied challenges, shared Wi-Fi and reinstall on physical Android.
6. Deploy Worker and web app **only after an explicit request**. This consolidated branch is not a Pages deployment trigger. Publish the hosted HTTPS native challenge page before distributing a new automatic-auth APK; enable Worker enrollment only after the D1 migration and secrets have been set.
7. On the live web app, verify first launch automatically checks Turnstile, subsequent launches reuse the same IndexedDB token, and successful text analysis starts exactly one separate image-generation call. On Android verify HTTPS iframe enrollment and persistent encrypted credential reuse. Check existing word/notebook/bookmark records and backup/restore; they must remain unchanged. Verify that 401/429 errors never trigger automatic paid retries.

## Rollback

Set `AUTO_AUTH_ENABLED=false` on the Worker first. Old tester tokens keep working. Roll back the new browser script or show a manual legacy-auth UI for existing testers. Leave additive D1 tables in place to preserve history. Never delete `testers`, quota counters, or local browser data as part of rollback.

## Preserved behavior and limitations

- The current **main** server flow supports AI-created first notebook names. This consolidation deliberately preserves that newer behavior rather than replacing the Worker with the old web-only branch wholesale.
- `www/quick_capture/analysis.js` retains its newer review/save flow and photo Task waiting logic; the authentication startup is additive. Existing local notebooks, saved terms, bookmarks and photos are not migrated or deleted.
- If automatic enrollment is disabled or errors, existing tester-code UI stays accessible as a **legacy fallback**. A new APK and real-device verification are required to use code-free Android enrollment; the currently deployed APK does not receive these changes automatically.
- Turnstile + registration-IP HMAC + daily limits mitigate unauthenticated abuse but **cannot guarantee one real person = one identity** across devices, VPNs or IP changes. Strict per-person limit requires verified sign-in/account identity.
- D1 tables are additive; never alter or drop existing tester/usage tables. This PR does not rotate secrets or publish a Worker.
