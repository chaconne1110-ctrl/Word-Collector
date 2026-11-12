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
- The existing DB already enforces **100 text + 100 photo** per tester/day, resulting in at most **200 combined requests/day** (up to 100 complete pairs) without risky D1 migrations. It does not allow any arbitrary mix of 200 text calls. Upstream attempts reserved before Google rejects them may still count against quotas.
- The `/api/usage` source now reports 200 combined and each category. This reporting change is not active until a separate explicitly authorized Worker deployment. Global category limits remain 1,500 each.

## Release control
Site publishing is handled by existing workflow \`deploy-iphone-pwa.yml\`, currently limited to \`feature/ai-photo-generation-20261111\`, not the staging branch.
The user must explicitly request publication before modifying that deployment target.
