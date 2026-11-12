-- Additive per-tester daily overflow quotas. Apply ONCE before deploying
-- the 200+200 Worker. DO NOT drop, reset, or overwrite the existing usage data.
-- Original tables remain capped at 100 by their existing checks/triggers;
-- these tables count attempts 101..200 in each request category.
CREATE TABLE IF NOT EXISTS tester_daily_usage_extra (
  tester_id TEXT NOT NULL REFERENCES testers(tester_id),
  usage_date TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count BETWEEN 0 AND 100),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(tester_id,usage_date)
);
CREATE TABLE IF NOT EXISTS tester_daily_image_usage_extra (
  tester_id TEXT NOT NULL REFERENCES testers(tester_id),
  usage_date TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count BETWEEN 0 AND 100),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(tester_id,usage_date)
);
CREATE TRIGGER IF NOT EXISTS wc_analysis_extra_insert
BEFORE INSERT ON tester_daily_usage_extra WHEN NEW.request_count > 100
BEGIN SELECT RAISE(ABORT,'daily_extra_limit_100'); END;
CREATE TRIGGER IF NOT EXISTS wc_analysis_extra_update
BEFORE UPDATE OF request_count ON tester_daily_usage_extra WHEN NEW.request_count > 100
BEGIN SELECT RAISE(ABORT,'daily_extra_limit_100'); END;
CREATE TRIGGER IF NOT EXISTS wc_image_extra_insert
BEFORE INSERT ON tester_daily_image_usage_extra WHEN NEW.request_count > 100
BEGIN SELECT RAISE(ABORT,'image_extra_limit_100'); END;
CREATE TRIGGER IF NOT EXISTS wc_image_extra_update
BEFORE UPDATE OF request_count ON tester_daily_image_usage_extra WHEN NEW.request_count > 100
BEGIN SELECT RAISE(ABORT,'image_extra_limit_100'); END;
