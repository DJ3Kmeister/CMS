# Bolt's Journal - Critical Learnings

## 2026-08-10 - SQLite WAL Mode & Indexing for Mobile/Termux Environments
**Learning:** SQLite database queries on mobile/embedded storage (e.g. Android internal storage / Termux) suffer significant write and query latency during frequent API polling (`/api/dashboard/stats`). Enabling WAL mode with `PRAGMA synchronous = NORMAL` dramatically improves write concurrency and transaction speed. Adding indexes on `transactions(created_at)`, `sessions(terminal_id, start_time)`, and `connection_logs(terminal_name, logout_time)` eliminates full table scans on financial stats and connection tracking queries.
**Action:** Always enable SQLite WAL mode and index filtered timestamp columns when building Flask apps with SQLite backend for mobile environments.
