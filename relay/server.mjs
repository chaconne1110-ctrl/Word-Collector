// Word Collector Gemini relay (Google Cloud Run, US region).
//
// Gemini rejects some Cloudflare egress locations with "User location is not
// supported". The Cloudflare Worker therefore sends its Gemini calls here, and
// this server forwards them unchanged to generativelanguage.googleapis.com from
// a supported US region.
//
// - Only the Worker may call it: every request must carry X-Relay-Secret,
//   compared in constant time with RELAY_SECRET (min 32 chars).
// - Only the exact Gemini endpoints the Worker uses are forwarded (allowlist).
// - The Gemini API key is sent by the Worker per request (x-goog-api-key) and is
//   never stored, logged or returned here. Request and response bodies are not logged.
// - No app user ever talks to this server or needs any password.
import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';

const UPSTREAM = 'https://generativelanguage.googleapis.com';
const MAX_BODY = 1024 * 1024; // Worker requests are far smaller (input limit 256 KB).
const UPSTREAM_TIMEOUT_MS = 60000; // image generation can take ~50 s

export function allowedModels(env = process.env) {
  return new Set(String(env.ALLOWED_MODELS || 'gemini-3.5-flash-lite,gemini-3.1-flash-lite-image')
    .split(',').map(model => model.trim()).filter(model => /^[a-z0-9.-]{1,80}$/.test(model)));
}

// Returns the upstream path for an allowed call, or null.
export function upstreamPath(method, url, models) {
  const match = /^\/v1beta\/models\/([a-z0-9.-]{1,80})(:generateContent)?$/.exec(url);
  if (!match || !models.has(match[1])) return null;
  if (method === 'POST' && match[2]) return url;   // generateContent
  if (method === 'GET' && !match[2]) return url;   // model metadata (owner diagnostic)
  return null;
}

export function secretMatches(given, expected) {
  if (typeof expected !== 'string' || expected.length < 32 || typeof given !== 'string') return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('too large'), {status: 413})); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function createRelay({env = process.env, fetchImpl = fetch} = {}) {
  const secret = env.RELAY_SECRET;
  const models = allowedModels(env);
  return async function handle(req, res) {
    try {
      if (req.method === 'GET' && req.url === '/healthz') return send(res, 200, '{"ok":true}');
      if (!secretMatches(req.headers['x-relay-secret'], secret)) return send(res, 401, '{"error":"relay-unauthorized"}');
      const path = upstreamPath(req.method, req.url, models);
      if (!path) return send(res, 404, '{"error":"relay-path-not-allowed"}');
      const apiKey = req.headers['x-goog-api-key'];
      if (typeof apiKey !== 'string' || !apiKey || apiKey.length > 200) return send(res, 400, '{"error":"relay-missing-key"}');
      const body = req.method === 'POST' ? await readBody(req) : undefined;
      let upstream;
      try {
        upstream = await fetchImpl(UPSTREAM + path, {
          method: req.method,
          redirect: 'manual',
          headers: {
            'x-goog-api-key': apiKey,
            ...(body ? {'Content-Type': 'application/json'} : {})
          },
          body,
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
        });
      } catch {
        return send(res, 502, '{"error":"relay-upstream-unreachable"}');
      }
      // Pass Gemini's status and body through unchanged so the Worker's existing
      // error handling (429, location retry, sanitised 4xx/5xx) keeps working.
      const text = Buffer.from(await upstream.arrayBuffer());
      return send(res, upstream.status, text, upstream.headers.get('content-type') || 'application/json');
    } catch (error) {
      return send(res, error?.status === 413 ? 413 : 500, '{"error":"relay-failed"}');
    }
  };
}

if (import.meta.url === `file://${process.argv[1]}` || process.env.RELAY_START === '1' || process.env.K_SERVICE) {
  if (!secretMatches(process.env.RELAY_SECRET || '', process.env.RELAY_SECRET || '')) {
    console.error('RELAY_SECRET must be set (at least 32 characters).');
    process.exit(1);
  }
  const port = Number(process.env.PORT || 8080);
  http.createServer(createRelay()).listen(port, () => console.log('gemini relay listening on ' + port));
}
