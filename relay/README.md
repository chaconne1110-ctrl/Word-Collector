# Gemini relay (Google Cloud Run, US)

Gemini sometimes rejects the Cloudflare Worker with **400 "User location is not supported"**,
depending on which Cloudflare location handles the request. This small relay runs in a US
Cloud Run region; the Worker sends its Gemini calls here and the relay forwards them unchanged.

```
App ──► Cloudflare Worker ──► this relay (us-central1) ──► Gemini
        (device ID, quota)    (checks X-Relay-Secret)
```

- **Nothing changes for app users**: no code, password or login; no new APK needed.
- `RELAY_SECRET` is a server-to-server secret stored only in Cloud Run and in the Worker.
- The Gemini API key stays in the Worker; it is passed per request and never stored or logged here.
- Only the two models the Worker uses are forwarded (`ALLOWED_MODELS`); everything else is 404.
- No dependencies. Tests: `node --test relay/server.test.mjs`.

## One-time deployment (Google Cloud Shell — nothing to install locally)

1. Open <https://console.cloud.google.com>, pick or create a project, make sure billing is linked
   (Cloud Run free tier covers this traffic), then click **Activate Cloud Shell** (top right).
2. In Cloud Shell:

   ```bash
   git clone --branch v2 --depth 1 https://github.com/chaconne1110-ctrl/Word-Collector.git
   cd Word-Collector/relay
   RELAY_SECRET=$(openssl rand -hex 32)
   echo "Keep this for the Worker: $RELAY_SECRET"
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
   gcloud run deploy word-collector-gemini-relay \
     --source . --region us-central1 --allow-unauthenticated \
     --set-env-vars RELAY_SECRET=$RELAY_SECRET \
     --memory 256Mi --max-instances 3 --timeout 70
   ```

   `--allow-unauthenticated` only lets HTTPS requests reach the relay; every Gemini call still
   needs the exact `X-Relay-Secret`. The command prints the **Service URL**
   (`https://word-collector-gemini-relay-….run.app`).
3. Check it: `curl <Service URL>/healthz` → `{"ok":true}`.

## Connect the Worker (operator)

From the `cloudflare/` folder with the production wrangler config:

```bash
npx wrangler secret put GEMINI_RELAY_SECRET      # paste the RELAY_SECRET value
npx wrangler deploy -c <config> --keep-vars --var GEMINI_RELAY_URL:<Service URL>
```

Or set `GEMINI_RELAY_URL` under `vars` in the wrangler config. Then verify:
`/health` is ok and a few analyses succeed (no more `GEMINI_UPSTREAM_HTTP_400`).

- **Rollback:** remove `GEMINI_RELAY_URL` and redeploy the Worker → calls go direct again.
- **Misconfiguration** (non-HTTPS URL, or a secret shorter than 32 chars) fails closed with
  "AI 중계 서버 설정을 확인해 주세요." and the call is refunded; the Worker never silently
  falls back to calling Gemini directly.
- **Rotating the secret:** deploy the relay with the new `RELAY_SECRET`, then
  `wrangler secret put GEMINI_RELAY_SECRET` with the same value.

## Cost and latency notes

- Adds roughly 0.2–0.5 s per call. After idle periods the first call may take 1–2 s longer
  (cold start); `--min-instances 1` removes that at a small fixed monthly cost.
- `--max-instances 3` caps runaway usage; the Worker's daily quotas still apply first.
