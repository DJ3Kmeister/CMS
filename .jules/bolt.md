## 2026-08-16 - SQLite Write-Ahead Logging & Composite Indexing for Embedded Flask Server
**Learning:** High-frequency status pings and session ticks in SQLite-backed Flask apps can cause database lock contention and linear scan overhead on reporting queries if default rollback journal mode and unindexed timestamp/FK lookups are used.
**Action:** Always configure `PRAGMA journal_mode = WAL;` and `PRAGMA synchronous = NORMAL;` alongside targeted indexes on `(created_at)`, `(terminal_id, start_time)`, and `(terminal_name, logout_time)` when managing frequent local SQLite reads and writes.
