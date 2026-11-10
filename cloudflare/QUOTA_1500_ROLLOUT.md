# Word Collector: raise global daily AI quota to 1,500

**Target**: Cloudflare Worker `word-collector-api`, D1 database `word-collector-db` (binding `DB`).
**Intended behavior**: 100 uses per tester per Korean calendar day; 1,500 uses globally per Korean calendar day.
**Source-only status**: This branch contains a verified migration and Worker changes, **not a production deployment**.

## Important safeguards

- Existing Word Collector notebooks, words, bookmarks, tester credentials, and D1 usage histories must be preserved.
- Never apply `schema.sql` alone to upgrade an existing 1,000-limit database. Its `CREATE TABLE IF NOT EXISTS` clauses do not change existing CHECK constraints.
- Do not run `DROP TABLE`, manual `DELETE`, `wrangler d1 delete`, or replace `word-collector-db` with a newly created database. The migration internally rebuilds **only** the global daily usage table inside Wrangler's transactional migration process and copies every row including `updated_at`.
- The Gemini API key is a Cloudflare secret; never store it in Git or expose it in terminal output.
- Do not enable automatic deployment from GitHub. Previously deployed Cloudflare Worker routes and environment bindings must remain intact.
- Pause or minimize live analysis traffic while migrating; take or verify a recoverable D1 backup and note the last known-good Worker deployment first.

## Prerequisites

Use a local checkout containing this branch (or its verified merged commit), on a Windows terminal.
Use the **actual previously verified** `cloudflare/wrangler.jsonc` or equivalent Wrangler config from the working deployment, not `wrangler.example.jsonc` with placeholder IDs.
Confirm it targets the same `word-collector-api` Worker and `word-collector-db` D1 database, retains the `DB` binding, `GEMINI_API_KEY` secret, and existing deployed routes. Configure `migrations_dir: "migrations"` on the D1 binding in that config if needed.

Run from the `cloudflare` directory. The file `migrations/0001_global_daily_quota_1500.sql` must be present.

## Verify before changing production

```powershell
cd cloudflare
npx wrangler whoami
npx wrangler d1 execute word-collector-db --remote --config wrangler.jsonc --command "SELECT usage_date, request_count, updated_at FROM global_daily_usage ORDER BY usage_date DESC LIMIT 5;"
npx wrangler d1 migrations list word-collector-db --remote --config wrangler.jsonc
```

Check the database identity and migration list carefully. Use the existing Cloudflare D1 backup/snapshot feature before applying. The migration must not be applied to the wrong account or D1 instance.

## Upgrade D1 FIRST, then deploy Worker

```powershell
npx wrangler d1 migrations apply word-collector-db --remote --config wrangler.jsonc
npx wrangler d1 execute word-collector-db --remote --config wrangler.jsonc --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='global_daily_usage';"
npx wrangler d1 execute word-collector-db --remote --config wrangler.jsonc --command "SELECT name, sql FROM sqlite_master WHERE type='trigger' AND name LIKE 'wc_global_%';"
npx wrangler deploy --config wrangler.jsonc
```

Ensure the schema query shows `BETWEEN 0 AND 1500`, both `wc_global_insert` and `wc_global_update` refer to `1500`, and the existing past and current usage counts remain unchanged.

**Do not deploy the Worker if the D1 migration fails.** Correct the migration issue first. Do not re-run a successful migration as an arbitrary SQL script; Wrangler migrations tracks each one and automatically takes a backup before application.

## Post-deployment verification (safe GET; does not spend Gemini calls)

```powershell
Invoke-RestMethod "https://word-collector-api.yechan-lim-elec.workers.dev/health" | ConvertTo-Json
```

Expected response includes `ok: true`, `dailyLimitPerTester: 100`, `dailyGlobalLimit: 1500` and model `gemini-3.5-flash-lite`. Verify that the live `status` remains whatever was intended before deployment; quota rollout must not change billing enablement.

Check `/api/usage` with an existing tester bearer token from the user device if authorized; do not put that token into chat logs. It should continue to report a 100-use personal quota.

Do not send 1,500 real Gemini requests to test the cap; the CI regression tests verify the 1,500/1,501 boundary in a local SQLite fixture.

## Tests run for this change

```powershell
node --check cloudflare/worker.mjs
node --test cloudflare/worker.test.mjs
python3 cloudflare/test_quota_migration.py
```

Tests cover both SQL schema creation and a migration fixture preserving testers, per-tester usage, global usage and historical `updated_at` values. The original global table's constraints and triggers enforce the old 1,000 cap until migration is applied.
