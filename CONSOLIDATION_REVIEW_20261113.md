# Word Collector consolidation review (2026-11-13 KST)

## Scope and safety
This branch is based on current main (`54400fcb`) plus the **latest** mobile layout fix (`fix/main-layout-review`, `0fe2e962`). It does not change production deployment, D1 schema, user word records, notebook data, bookmarks, Android signing, or Cloudflare billing.

**Do not merge this review branch to main or delete source branches until CI and real-device QA pass.**

## Resolution of overlapping work
1. **Mobile layout:** Prefer `fix/main-layout-review`'s newest `www/assets/styles/mobile-layout.css` and its related HTML/service-worker references. Avoid transplanting the older `feature/ui-ux-notebook-settings` flashcard layout wholesale; main already has newer shared layout and navigation.
2. **Encrypted tester token:** Main already contains `android/.../TesterTokenStorePlugin.java` and uses `TesterTokenStore` in `www/analysis-api.js`. Older `feature/secure-tester-token` is historical and should not overwrite newer auth code.
3. **Notebook settings:** Main already has shared bottom navigation and notebook management. Compare any remaining flashcard-specific changes individually, preserving current layout; do not overwrite the entire older `www/flashcard.html`.
4. **XLSX export:** `feature/xlsx-export` adds only Flutter's `excel: 4.0.6` dependency, not a complete exporter. Do not introduce a Flutter dependency into the current Capacitor web app. Preserve its branch until any needed Flutter work is explicitly retired.
5. **Code-free AI access:** `feature/public-ai-400-per-device` has six commits, including no-code per-device usage, failed-call quota refunds, Gemini region fallback and UI changes. Its client-provided device ID can be regenerated; this is **not** reliable per-human enforcement. Do not replace the production token authorization and quotas with this implementation without a separate server-side security review, tests and user acceptance.
6. **Alternative web-only auto-auth:** `feature/webapp-only-20261112` contains newer opt-in Turnstile-based anonymous token issuance and shared-network quota tables. It is not deployed and is web-only; it also has operational prerequisites. Do not combine both anonymous-auth implementations by concatenating code. Choose one reviewed design for both web and Android, with verified migration, secure native credential storage and spending caps.
7. **Global quota PR #9:** `feature/cloudflare-daily-global-1500` has an open PR. Leave it intact until its quota semantics are reconciled with the selected authorization implementation.

## Status
- [x] Consolidated branch created from main + newest layout correction.
- [x] Main's newer encrypted token, notebook and navigation implementations preserved.
- [ ] Merge or reimplement unreviewed anonymous-auth work after security/abuse testing.
- [ ] Validate the old flashcard-specific changes against the latest main UX.
- [ ] Decide whether legacy Flutter XLSX dependency remains relevant.
- [ ] Run full CI, Android smoke test, backups, and Cloudflare staging quota tests.
- [ ] Merge reviewed result to main; then consider deleting redundant branches.

## Branch deletion candidates (not yet deleted)
- `feature/secure-tester-token`: candidate after verifying encrypted native credentials and backup exclusions on this consolidated branch.
- `feature/ui-ux-notebook-settings`: candidate after checking flashcard and notebook behavior on real devices.
- `feature/xlsx-export`: candidate only if the old Flutter XLSX experiment is no longer needed.
- `fix/main-layout-review`: candidate after this consolidated branch is merged into main.
- `feature/public-ai-400-per-device`: **retain** until no-code access is safely redesigned or its remaining fixes are ported and tested.
- `feature/cloudflare-daily-global-1500`: **retain**, PR #9 remains open.
- `main`: **never delete**.

GitHub's compare view shows commit differences, not necessarily unique functional behavior: a change can be reimplemented in main with different commit IDs.
