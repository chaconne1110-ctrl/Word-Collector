// One-off: generates the AI study photo for every first-run word (www/data.js) with the
// same prompt and model as the app's "AI 사진 생성" button (cloudflare/worker.mjs
// generatePhoto), through the same US relay. Raw images go to the given folder;
// words that already have one are skipped, so the script can be re-run safely.
// Needs GEMINI_API_KEY and GEMINI_RELAY_SECRET in the environment (never printed).
// Usage: node tools/generate-seed-photos.mjs <outDir> [limit]
import fs from 'node:fs';
import path from 'node:path';
import {generatePhoto, geminiFetch} from '../cloudflare/worker.mjs';

const [outDir, limitArg] = process.argv.slice(2);
if (!outDir) throw new Error('usage: node tools/generate-seed-photos.mjs <outDir> [limit]');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const seed = new Function(fs.readFileSync(path.join(root, 'www/data.js'), 'utf8') + ';return seed;')();
const config = fs.readFileSync(path.join(root, 'cloudflare/deploy/wrangler.v3.jsonc'), 'utf8');
const relay = config.match(/"GEMINI_RELAY_URL":\s*"([^"]+)"/)[1];
const fetchImpl = geminiFetch({GEMINI_RELAY_URL: relay, GEMINI_RELAY_SECRET: process.env.GEMINI_RELAY_SECRET});
fs.mkdirSync(outDir, {recursive: true});
const limit = Number(limitArg) || Infinity;
let made = 0, skipped = 0, failed = 0;
for (const [id, term] of Object.entries(seed.terms)) {
  if (made >= limit) break;
  if (fs.readdirSync(outDir).some(name => name.startsWith(id + '.'))) { skipped++; continue; }
  // Same input as the flashcard button (www/app.js).
  const input = {
    word: (term.en || term.ko).slice(0, 120), koreanMeaning: (term.ko || term.en).slice(0, 200),
    subject: (term.discipline || seed.courses[term.course][0]).slice(0, 100),
    definition: ([term.enDef, term.koDef].filter(Boolean).join(' / ') || term.ko || term.en).slice(0, 700)
  };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const {image} = await generatePhoto(input, process.env.GEMINI_API_KEY, fetchImpl);
      const ext = image.mimeType.split('/')[1].replace('jpeg', 'jpg');
      fs.writeFileSync(path.join(outDir, `${id}.${ext}`), Buffer.from(image.data, 'base64'));
      made++; console.log(`ok   ${term.en}`);
      break;
    } catch (error) {
      console.log(`fail ${term.en} (try ${attempt}): ${String(error.message).slice(0, 120)}`);
      if (attempt === 3) failed++;
      else await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
    }
  }
}
console.log(`made ${made}, already there ${skipped}, failed ${failed}`);
