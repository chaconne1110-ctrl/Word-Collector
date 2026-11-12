-- Additive anonymous browser authentication. Apply to existing D1 before enabling AUTO_AUTH_ENABLED.
-- Never delete or rewrite testers, their tokens, or existing analysis/image usage.
CREATE TABLE IF NOT EXISTS anonymous_clients (
  tester_id TEXT PRIMARY KEY REFERENCES testers(tester_id),
  registration_ip_hash TEXT NOT NULL,
  issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS anonymous_auth_registrations (
  registration_ip_hash TEXT NOT NULL,
  usage_date TEXT NOT NULL,
  issue_count INTEGER NOT NULL DEFAULT 0 CHECK (issue_count BETWEEN 0 AND 2),
  PRIMARY KEY (registration_ip_hash, usage_date)
);
CREATE TABLE IF NOT EXISTS anonymous_ip_daily_usage (
  registration_ip_hash TEXT NOT NULL,
  usage_date TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count BETWEEN 0 AND 400),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (registration_ip_hash, usage_date)
);
-- A shared IP is a safety ceiling, not a claim of unique human identity.
-- The 400/day ceiling is transactional with the old per-tester and global quota reservations.

CREATE TRIGGER IF NOT EXISTS wc_anonymous_register_insert
BEFORE INSERT ON anonymous_auth_registrations WHEN NEW.issue_count > 2
BEGIN SELECT RAISE(ABORT,'anonymous_registration_limit_2'); END;
CREATE TRIGGER IF NOT EXISTS wc_anonymous_register_update
BEFORE UPDATE OF issue_count ON anonymous_auth_registrations WHEN NEW.issue_count > 2
BEGIN SELECT RAISE(ABORT,'anonymous_registration_limit_2'); END;
CREATE TRIGGER IF NOT EXISTS wc_anonymous_ip_insert
BEFORE INSERT ON anonymous_ip_daily_usage WHEN NEW.request_count > 400
BEGIN SELECT RAISE(ABORT,'anonymous_ip_limit_400'); END;
CREATE TRIGGER IF NOT EXISTS wc_anonymous_ip_update
BEFORE UPDATE OF request_count ON anonymous_ip_daily_usage WHEN NEW.request_count > 400
BEGIN SELECT RAISE(ABORT,'anonymous_ip_limit_400'); END;
