-- Evidence search (RAG) over registered textbooks. Additive only.
-- Apply: npx wrangler d1 execute word-collector-db --remote --file cloudflare/migrations/0005_rag_evidence.sql

-- Our own text extraction of each registered PDF page (written by rag/register.mjs).
-- Used to check that a quoted passage really is in the original and on which page.
-- norm_text: lower-case letters and digits only (see normalizeForMatch in cloudflare/rag.mjs).
CREATE TABLE IF NOT EXISTS rag_pages (
  source_id TEXT NOT NULL,
  pdf_page INTEGER NOT NULL CHECK (pdf_page > 0),
  printed_page TEXT,
  norm_text TEXT NOT NULL,
  PRIMARY KEY (source_id, pdf_page)
);

-- Evidence results per (word, field, meaning basis, reference sentence, store, catalog).
CREATE TABLE IF NOT EXISTS rag_cache (
  cache_key TEXT PRIMARY KEY,
  evidence_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Daily usage and latency per status (found, not_found, search_failed, ...).
CREATE TABLE IF NOT EXISTS rag_usage (
  usage_date TEXT NOT NULL,
  status TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  cached_count INTEGER NOT NULL DEFAULT 0,
  total_ms INTEGER NOT NULL DEFAULT 0,
  max_ms INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (usage_date, status)
);
