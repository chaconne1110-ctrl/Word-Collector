# Archive: Cloudflare Worker recovery files + current production deploy config

Saved 2026-11-14 from the owner's Desktop folder `WordCollector_Worker_Recovery` (11-11). No secrets are stored here; secrets live only in Cloudflare (`GEMINI_API_KEY`, `GEMINI_RELAY_SECRET`) and Cloud Run (`RELAY_SECRET`).

- `current-production/wrangler.production.jsonc` — **the config used to deploy the live Worker** (placement gcp:us-central1, US relay URL, D1 `word-collector-db`). Copy it next to `cloudflare/` of the app branch (`V11.13` or later) and run `npx wrangler deploy -c current-production/wrangler.production.jsonc --keep-vars`.
- `quota1500/` — older Worker versions and configs from the 1500-call quota and first photo-generation rollout (superseded by the app branch's `cloudflare/worker.mjs`).
- `word-collector-api/` — the original `wrangler init` project scaffold (package files only).
