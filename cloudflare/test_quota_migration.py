"""Regression checks for a data-preserving 1000 -> 1500 D1 global quota migration."""
import pathlib
import sqlite3
import unittest

BASE = pathlib.Path(__file__).resolve().parent
SCHEMA = (BASE / "schema.sql").read_text(encoding="utf-8")
MIGRATION = (BASE / "migrations/0001_global_daily_quota_1500.sql").read_text(encoding="utf-8")

OLD_SCHEMA = """
CREATE TABLE testers (
 tester_id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
 is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)), expires_at TEXT
);
CREATE TABLE tester_daily_usage (
 tester_id TEXT NOT NULL REFERENCES testers(tester_id),
 usage_date TEXT NOT NULL, request_count INTEGER NOT NULL CHECK (request_count BETWEEN 0 AND 100),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(tester_id, usage_date)
);
CREATE TABLE global_daily_usage (
 usage_date TEXT PRIMARY KEY,
 request_count INTEGER NOT NULL CHECK (request_count BETWEEN 0 AND 1000),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER wc_personal_insert BEFORE INSERT ON tester_daily_usage
WHEN NEW.request_count > 100 BEGIN SELECT RAISE(ABORT,'daily_limit_100'); END;
CREATE TRIGGER wc_personal_update BEFORE UPDATE OF request_count ON tester_daily_usage
WHEN NEW.request_count > 100 BEGIN SELECT RAISE(ABORT,'daily_limit_100'); END;
CREATE TRIGGER wc_global_insert BEFORE INSERT ON global_daily_usage
WHEN NEW.request_count > 1000 BEGIN SELECT RAISE(ABORT,'global_limit_1000'); END;
CREATE TRIGGER wc_global_update BEFORE UPDATE OF request_count ON global_daily_usage
WHEN NEW.request_count > 1000 BEGIN SELECT RAISE(ABORT,'global_limit_1000'); END;
"""


class D1QuotaMigrationTest(unittest.TestCase):
    def connect(self, schema):
        db = sqlite3.connect(":memory:")
        db.execute("PRAGMA foreign_keys=ON")
        db.executescript(schema)
        self.addCleanup(db.close)
        return db

    def check_global_boundaries(self, db):
        self.assertEqual(
            db.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name LIKE 'wc_global_%'").fetchone()[0],
            2,
        )
        db.execute("INSERT INTO global_daily_usage (usage_date, request_count) VALUES ('2026-11-11', 1499)")
        db.execute("UPDATE global_daily_usage SET request_count=1500 WHERE usage_date='2026-11-11'")
        self.assertEqual(
            db.execute("SELECT request_count FROM global_daily_usage WHERE usage_date='2026-11-11'").fetchone(),
            (1500,),
        )
        with self.assertRaises(sqlite3.IntegrityError):
            db.execute("UPDATE global_daily_usage SET request_count=1501 WHERE usage_date='2026-11-11'")
        with self.assertRaises(sqlite3.IntegrityError):
            db.execute("INSERT INTO global_daily_usage (usage_date, request_count) VALUES ('2026-11-12', 1501)")
        self.assertEqual(
            db.execute("SELECT request_count FROM global_daily_usage WHERE usage_date='2026-11-11'").fetchone(),
            (1500,),
        )

    def test_fresh_schema(self):
        db = self.connect(SCHEMA)
        self.check_global_boundaries(db)
        db.execute("INSERT INTO testers(tester_id,token_hash) VALUES ('one','fake-hash')")
        db.execute("INSERT INTO tester_daily_usage(tester_id,usage_date,request_count) VALUES ('one','2026-11-11',100)")
        with self.assertRaises(sqlite3.IntegrityError):
            db.execute("UPDATE tester_daily_usage SET request_count=101 WHERE tester_id='one'")

    def test_migration_preserves_existing_records(self):
        db = self.connect(OLD_SCHEMA)
        db.execute("INSERT INTO testers(tester_id,token_hash,is_active) VALUES ('tester-01','safe-hash',1)")
        db.execute("INSERT INTO tester_daily_usage(tester_id,usage_date,request_count) VALUES ('tester-01','2026-11-10',99)")
        db.execute("INSERT INTO global_daily_usage (usage_date, request_count, updated_at) VALUES ('2026-11-10',1000,'2026-11-10 23:58:02')")
        db.execute("INSERT INTO global_daily_usage (usage_date, request_count, updated_at) VALUES ('2026-11-09',735,'2026-11-09 01:24:00')")
        before = {
            "testers": db.execute("SELECT * FROM testers").fetchall(),
            "personal": db.execute("SELECT tester_id,usage_date,request_count FROM tester_daily_usage").fetchall(),
            "global": db.execute("SELECT * FROM global_daily_usage ORDER BY usage_date").fetchall(),
        }
        with self.assertRaises(sqlite3.IntegrityError):
            db.execute("UPDATE global_daily_usage SET request_count=1001 WHERE usage_date='2026-11-10'")
        db.executescript("BEGIN;\n" + MIGRATION + "\nCOMMIT;")
        after = {
            "testers": db.execute("SELECT * FROM testers").fetchall(),
            "personal": db.execute("SELECT tester_id,usage_date,request_count FROM tester_daily_usage").fetchall(),
            "global": db.execute("SELECT * FROM global_daily_usage ORDER BY usage_date").fetchall(),
        }
        self.assertEqual(before, after)
        db.execute("UPDATE global_daily_usage SET request_count=1500 WHERE usage_date='2026-11-10'")
        with self.assertRaises(sqlite3.IntegrityError):
            db.execute("UPDATE global_daily_usage SET request_count=1501 WHERE usage_date='2026-11-10'")
        with self.assertRaises(sqlite3.IntegrityError):
            db.execute("UPDATE tester_daily_usage SET request_count=101 WHERE tester_id='tester-01'")
        self.assertEqual(db.execute("SELECT COUNT(*) FROM testers").fetchone(), (1,))
        self.assertEqual(db.execute("SELECT COUNT(*) FROM tester_daily_usage").fetchone(), (1,))
        self.assertEqual(db.execute("SELECT COUNT(*) FROM global_daily_usage").fetchone(), (2,))


if __name__ == "__main__":
    unittest.main()
