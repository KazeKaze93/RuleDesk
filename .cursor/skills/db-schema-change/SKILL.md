---
name: db-schema-change
description: Procedure for any SQLite schema or migration change in RuleDesk (tables, columns, indexes, triggers, FTS, migration runner). Use before touching src/main/db/schema.ts, drizzle/, or migration code.
---
# DB schema change (RuleDesk)

Read the DB and FTS sections of .ai/LESSONS.txt first; they are binding.

1. Change src/main/db/schema.ts, write a hand-written SQL file in drizzle/, and add an entry to drizzle/meta/_journal.json with a UNIQUE tag (next free number; verify against the journal).
2. Never edit, rename, or renumber existing migration files or journal entries — tags are identity in user databases.
3. Do not use drizzle-kit push. Snapshots in drizzle/meta/ are incomplete; do not trust db:generate diffs — write SQL by hand.
4. Index-only changes: CREATE INDEX IF NOT EXISTS; never rebuild the posts table for an index.
5. FTS: triggers only ON posts; deletes only via VALUES('delete', …); during bulk inserts drop and restore all three triggers (see LESSONS).
6. Prefer keeping an unused column over dual-writing; dropping a column requires an explicit decision.
7. Comment time units on time columns (seconds vs milliseconds).
8. MANUAL-CHECK on a copy of a populated production data.bin:
   - apply the migration;
   - compare SELECT name, type, sql FROM sqlite_master for the touched objects;
   - verify row counts of existing tables are unchanged;
   - run PRAGMA integrity_check.
