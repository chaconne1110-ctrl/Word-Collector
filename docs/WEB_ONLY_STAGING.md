# Word Collector — web-only development staging

The branch \`feature/webapp-only-20261112\` contains unshipped website changes.
**Do not publish Pages, update Cloudflare Worker, build APK/IPA, or merge to production** unless the user explicitly requests deployment. The isolated \`check-web-request-gate.yml\` workflow runs tests only.

## Three-second duplicate request guard
- Text analysis, review-screen photo creation, and flashcard photo creation have independent 3,000 ms dispatch limits.
- A tap within 3 seconds does not dispatch any new API request.
- If the first request completes sooner than 3 seconds, the result appears immediately (text analysis opens its review screen; images appear immediately).
- If a request remains pending **at or after 3 seconds**, a further tap explicitly retries. The prior fetch is aborted in the browser and old responses cannot override the current result.
- Repeating image generation requires confirmation, especially while the previous request is still running.
- **Browser abort cannot guarantee the upstream Cloudflare/Gemini request stopped or wasn't charged**. Do not claim exactly-once processing. Full deduplication requires server-side idempotency keys and usage reconciliation.
- **One successful analysis call automatically starts one photo-generation call**, counted separately. Text review is displayed immediately, without waiting for the image. If image generation fails, the term remains reviewable and saveable.
- The new limit is **200 text + 200 photo** per tester/day: **400 combined requests/day**, or up to **200 complete analysis-button pairs**. Photo retries consume the same image allowance. The day resets at midnight Asia/Seoul. This requires migration `0003_personal_daily_400_overflow.sql` and a Worker deployment; editing the source alone does not raise the live limit. Upstream attempts reserved before Google rejects them may still count against quotas.
- The `/api/usage` source now reports 400 combined and each category. This reporting change is not active until a separate explicitly authorized Worker deployment. Global category limits remain 1,500 each.

## Release control
Site publishing is handled by existing workflow \`deploy-iphone-pwa.yml\`, currently limited to \`feature/ai-photo-generation-20261111\`, not the staging branch.
The user must explicitly request publication before modifying that deployment target.

## Applying the 400-call limit

After deployment is requested, inspect the current D1 schema and migration ledger, back up the database, then apply only the pending `0003_personal_daily_400_overflow.sql` migration transactionally. Do not replay migrations 0001/0002 that were already applied to production. Migration 0003 adds separate analysis/image overflow tables for calls 101–200. Existing tables, triggers, tester records, usage counts and timestamps stay intact. The Worker sums the original and overflow counts for each category. Deploy the matching Worker afterward and verify `/health` reports 200 text, 200 image, 400 combined, and `/api/usage` retains today’s counts. Global limits remain 1,500 per category across all testers; exhausting a shared limit can stop requests before a tester reaches 200 pairs. A Worker rollback stops using the overflow tables; preserve those records for any subsequent upgrade.

## Reference sentence translations

The capture screen requests `translateReference: true` when the user provides a reference sentence. The same text-analysis call returns `referenceTranslation` separately from the generated example's `exampleKo`; no extra translation API call is made. The review screen shows the original and an editable translation, and the flashcard preserves both after saving/reloading. Long text wraps and scrolls within the card. Without a reference sentence, the generated example and its translation remain visible.

Both the Worker and local server support this opt-in field in legacy and modern request formats. Older Workers can still return analysis without the new translation; the review leaves that field empty rather than displaying an unrelated example translation. Existing cards without a stored reference translation need reanalysis to generate one. Deploy the updated Worker and web assets for automatic translations to become available in the live site. A GitHub push alone does not update the Worker, D1 or this staging branch's live site.

Validation: `node --test tests/*.test.cjs server/test/*.test.cjs cloudflare/*.test.mjs`; `node tests/reference-translation-browser.cjs`; `node tests/flashcard-scroll-browser.cjs`. Browser coverage includes analysis → review/edit → save/reload, 600-character originals and 1,200-character translations at 320×568, 390×844 and 844×390, top/bottom safe-area insets, native touch scrolling and edge navigation. Gemini responses are mocked; no billable calls are made.
