# Phase 5 QA Manual: Migration Engine & Streaming Pipeline

This manual covers testing for **Asynchronous Migrations, Channel-based Row Streaming, Real-time SSE Progress Streaming, Migration Cancellation, and Execution Lock Concurrency Protection**.

---

## 📌 API Endpoints Under Test

| Endpoint | Method | Description | Min Role |
| :--- | :--- | :--- | :--- |
| `/v1/organizations/{orgID}/projects/{projectID}/migrations` | `POST` | Start asynchronous table migration | `admin` |
| `/v1/organizations/{orgID}/projects/{projectID}/migrations` | `GET` | List all migration jobs for project | `viewer` |
| `/v1/organizations/{orgID}/projects/{projectID}/migrations/{migrationID}` | `GET` | Get migration status and progress | `viewer` |
| `/v1/organizations/{orgID}/projects/{projectID}/migrations/{migrationID}` | `DELETE` | Cancel a running migration | `admin` |
| `/v1/organizations/{orgID}/projects/{projectID}/migrations/{migrationID}/progress` | `GET` | Open SSE stream for live progress | `viewer` |

---

## 🧪 Detailed Test Scenarios

### 1. Start Migration (`POST /migrations`)
- **Request Body**:
```json
{
  "source_connection_id": "<source_postgres_conn_id>",
  "target_connection_id": "<target_postgres_conn_id>",
  "source_table": "customers",
  "target_table": "customers",
  "batch_size": 500
}
```
- **Expected Outcome**:
  - HTTP `201 Created`
  - Response returns immediately with `status: "pending" | "running"`, `total_rows: N`, and `id: "<uuid>"`.
  - Migration runs asynchronously in the background.

---

### 2. Live SSE Progress Streaming (`GET /migrations/{migrationID}/progress`)
- **Action**: Open EventSource / curl connection:
```bash
curl -N -H "Authorization: Bearer <token>" \
  http://localhost:8080/v1/organizations/<orgID>/projects/<projectID>/migrations/<migrationID>/progress
```
- **Expected Outcome**:
  - Connection response headers: `Content-Type: text/event-stream`, `Transfer-Encoding: chunked`.
  - Initial event: `: connected`.
  - Progress updates emitted per batch:
```
event: progress
data: {"job_id":"...","state":"running","migrated_rows":500,"total_rows":2000,"percentage":25.0,"message":"Batch 1 processed (500 rows)","timestamp":"..."}
```
  - Final event: `state: "completed"`, `percentage: 100.0`. Stream closes automatically.

---

### 3. Execution Lock Protection (Duplicate Prevention)
- **Test Case**:
  - Start a migration on `source_table: "customers"`.
  - While it is still running, send a second `POST /migrations` request with the exact same source connection, target connection, and table name.
- **Expected Outcome**:
  - HTTP `409 Conflict` (`MIGRATION_ALREADY_RUNNING`).
  - Error message: `"A migration is already running for this source, target, and table combination"`.

---

### 4. Migration Cancellation (`DELETE /migrations/{migrationID}`)
- **Test Case**:
  - Start a large table migration (e.g. 50,000 rows).
  - While running, send `DELETE /migrations/{migrationID}`.
- **Expected Outcome**:
  - HTTP `200 OK` (`"Migration cancelled"`).
  - Job status transitions to `cancelled`.
  - Streaming goroutine aborts via context cancellation without hanging database connections.

---

## 📋 Checkpoints & Remarks Ledger

| Checkpoint ID | Verification Item | Status | Tester Remarks / Failures / Edge Cases | Fixed? |
| :--- | :--- | :--- | :--- | :--- |
| **CP-5.01** | Start migration returns job ID immediately without blocking client | [ ] PASS | | |
| **CP-5.02** | Row count calculation matches total rows in source table | [ ] PASS | | |
| **CP-5.03** | SSE stream connects with `text/event-stream` headers and streams live batches | [ ] PASS | | |
| **CP-5.04** | Multiple clients can subscribe to the same migration SSE stream concurrently | [ ] PASS | | |
| **CP-5.05** | Completed migration writes 100% of rows to target table with matching count | [ ] PASS | | |
| **CP-5.06** | Duplicate concurrent migration is blocked with 409 Conflict | [ ] PASS | | |
| **CP-5.07** | Cancel migration immediately stops streaming and marks job `cancelled` | [ ] PASS | | |
| **CP-5.08** | Database connection errors during migration transition job to `failed` state | [ ] PASS | | |
| **CP-5.09** | Role check: `member` and `viewer` cannot start migrations (403 Forbidden) | [ ] PASS | | |
