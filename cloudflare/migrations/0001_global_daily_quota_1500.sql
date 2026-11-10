-- Existing production D1 database upgrade, apply ONCE with Wrangler migrations.
-- Wrangler rolls back this migration on failure. Do not drop testers or usage history.
-- The global table's original CHECK (request_count <= 1000) cannot be altered in place.

CREATE TABLE global_daily_usage_new_1500 (
  usage_date TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL CHECK (request_count BETWEEN 0 AND 1500),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO global_daily_usage_new_1500 (usage_date, request_count, updated_at)
SELECT usage_date, request_count, updated_at FROM global_daily_usage;

DROP TRIGGER IF EXISTS wc_global_insert;
DROP TRIGGER IF EXISTS wc_global_update;

DROP TABLE global_daily_usage;
ALTER TABLE global_daily_usage_new_1500 RENAME TO global_daily_usage;

CREATE TRIGGER wc_global_insert BEFORE INSERT ON global_daily_usage
WHEN NEW.request_count > 1500
BEGIN SELECT RAISE(ABORT, 'global_limit_1500'); END;

CREATE TRIGGER wc_global_update BEFORE UPDATE OF request_count ON global_daily_usage
WHEN NEW.request_count > 1500
BEGIN SELECT RAISE(ABORT, 'global_limit_1500'); END;
