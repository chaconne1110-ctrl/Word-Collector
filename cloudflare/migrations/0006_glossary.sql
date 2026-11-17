-- Textbook glossary (교재 단어집), built by glossary/build_glossary.py. Additive only.
-- Apply: npx wrangler d1 execute word-collector-db --remote --file cloudflare/migrations/0006_glossary.sql
-- Fill:  npx wrangler d1 execute word-collector-db --remote --file glossary/out/glossary.sql
-- lookup_key: see glossaryKey() in cloudflare/glossary.mjs (English term, original
-- textbook spelling, or a Korean meaning shared by no other term).
CREATE TABLE IF NOT EXISTS glossary_terms (
  lookup_key TEXT PRIMARY KEY,
  entry_json TEXT NOT NULL
);
