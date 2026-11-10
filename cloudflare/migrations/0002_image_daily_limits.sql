-- Additive production migration. Never modify existing text-analysis quotas or tester records.
-- Run once on word-collector-db BEFORE enabling ENABLE_IMAGE_GENERATION=true.
CREATE TABLE IF NOT EXISTS tester_daily_image_usage (
  tester_id TEXT NOT NULL REFERENCES testers(tester_id),
  usage_date TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tester_id, usage_date)
);
CREATE TABLE IF NOT EXISTS global_daily_image_usage (
  usage_date TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS wc_image_personal_insert
BEFORE INSERT ON tester_daily_image_usage WHEN NEW.request_count > 5
BEGIN SELECT RAISE(ABORT, 'image_limit_5'); END;
CREATE TRIGGER IF NOT EXISTS wc_image_personal_update
BEFORE UPDATE OF request_count ON tester_daily_image_usage WHEN NEW.request_count > 5
BEGIN SELECT RAISE(ABORT, 'image_limit_5'); END;
CREATE TRIGGER IF NOT EXISTS wc_image_global_insert
BEFORE INSERT ON global_daily_image_usage WHEN NEW.request_count > 50
BEGIN SELECT RAISE(ABORT, 'image_global_limit_50'); END;
CREATE TRIGGER IF NOT EXISTS wc_image_global_update
BEFORE UPDATE OF request_count ON global_daily_image_usage WHEN NEW.request_count > 50
BEGIN SELECT RAISE(ABORT, 'image_global_limit_50'); END;
