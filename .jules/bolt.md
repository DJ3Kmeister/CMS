## 2026-08-18 - Batching Dashboard Financial Statistics Queries in SQLite

**Learning:** In SQLite/Flask polling architectures (such as `/api/dashboard/stats`), multiple sequential scalar `SELECT` queries across tables incur repeated SQLite lock acquisitions and cursor overheads. Combining multiple scalar subqueries into a single unified `SELECT` query reduces database roundtrips and lock contention. Adding indexes on `created_at` and status fields further ensures fast constant-time execution during frequent client polling.

**Action:** Whenever an endpoint frequently polled by frontend clients needs multiple aggregate metrics across tables, combine them into a single `SELECT (SELECT ...), (SELECT ...)` query and ensure the filter columns are properly indexed.
