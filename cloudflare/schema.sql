-- Additive and repeatable. Never drop tester or usage records.
CREATE TABLE IF NOT EXISTS testers (
  tester_id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  expires_at TEXT
);
CREATE TABLE IF NOT EXISTS tester_daily_usage (
  tester_id TEXT NOT NULL REFERENCES testers(tester_id),
  usage_date TEXT NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count BETWEEN 0 AND 100),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tester_id, usage_date)
);
CREATE TABLE IF NOT EXISTS global_daily_usage (
  usage_date TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL CHECK (request_count BETWEEN 0 AND 1500),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS wc_personal_insert BEFORE INSERT ON tester_daily_usage
WHEN NEW.request_count > 100 BEGIN SELECT RAISE(ABORT, 'daily_limit_100'); END;
CREATE TRIGGER IF NOT EXISTS wc_personal_update BEFORE UPDATE OF request_count ON tester_daily_usage
WHEN NEW.request_count > 100 BEGIN SELECT RAISE(ABORT, 'daily_limit_100'); END;
CREATE TRIGGER IF NOT EXISTS wc_global_insert BEFORE INSERT ON global_daily_usage
WHEN NEW.request_count > 1500 BEGIN SELECT RAISE(ABORT, 'global_limit_1500'); END;
CREATE TRIGGER IF NOT EXISTS wc_global_update BEFORE UPDATE OF request_count ON global_daily_usage
WHEN NEW.request_count > 1500 BEGIN SELECT RAISE(ABORT, 'global_limit_1500'); END;
