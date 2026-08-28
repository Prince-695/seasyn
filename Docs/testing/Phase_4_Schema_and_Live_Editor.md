# Phase 4 QA Manual: Live Schema Inspection, Diff Engine & Data Explorer

This manual covers testing for **Live Database Introspection, Table & Column Metadata, Universal Type Mapping (`SeasonType`), Cross-Database Schema Diff Engine, and Live Data Explorer (Row CRUD)**.

---

## 📌 API Endpoints Under Test

| Endpoint | Method | Description | Min Role |
| :--- | :--- | :--- | :--- |
| `/v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/schema` | `GET` | Inspect entire live database schema | `viewer` |
| `/v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/tables` | `GET` | List all user tables in database | `viewer` |
| `/v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/tables/{tableName}` | `GET` | Inspect table columns, PKs, FKs, indexes | `viewer` |
| `/v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/tables/{tableName}/rows` | `GET` | Query paginated table rows with order/filter | `viewer` |
| `/v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/tables/{tableName}/rows` | `POST` | Insert new row into table | `member` |
| `/v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/tables/{tableName}/rows` | `PUT` | Update row identified by primary key | `member` |
| `/v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/tables/{tableName}/rows` | `DELETE` | Delete row identified by primary key | `member` |
| `/v1/organizations/{orgID}/projects/{projectID}/schema/diff` | `POST` | Compare source vs target schemas | `viewer` |

---

## 🧪 Detailed Test Scenarios

### 1. Full Database Schema Inspection (`GET /connections/{connID}/schema`)
- **Action**: Inspect a PostgreSQL database containing multiple tables.
- **Verification**:
  - `tables` array returned with all base public tables.
  - Columns include: `data_type` (native type) and `season_type` (e.g., `int`, `string`, `bool`, `timestamp`, `json`, `uuid`).
  - `primary_keys` accurately extracted from constraints.
  - `indexes` list uniqueness and index type (`btree`, `gin`).

---

### 2. Schema Diff Engine (`POST /schema/diff`)
- **Request Body**:
```json
{
  "source_connection_id": "<dev_postgres_conn_id>",
  "target_connection_id": "<prod_postgres_conn_id>"
}
```
- **Expected Outcome**:
  - `tables_added`: Tables existing in dev but missing in prod.
  - `tables_removed`: Tables existing in prod but missing in dev.
  - `tables_altered`: Tables with column additions, deletions, type alterations, or nullable modifications.
  - `tables_same`: Structurally identical tables.

---

### 3. Live Data Explorer (Row CRUD)

#### A. Query Rows (`GET /tables/{tableName}/rows?page=1&limit=25&order_by=created_at&order_dir=desc`)
- **Expected Outcome**: Returns paginated dataset with `rows`, `columns`, `total_rows`, `page`, `limit`, `total_pages`.

#### B. Insert Row (`POST /tables/{tableName}/rows`)
- **Request Body**:
```json
{
  "data": {
    "name": "Acme Widgets",
    "price": 199.99,
    "in_stock": true
  }
}
```
- **Expected Outcome**: HTTP `201 Created`. Row inserted into the database.

#### C. Update Row (`PUT /tables/{tableName}/rows`)
- **Request Body**:
```json
{
  "primary_key": {
    "id": 1
  },
  "data": {
    "price": 179.99
  }
}
```
- **Expected Outcome**: HTTP `200 OK`. Row updated.

#### D. Delete Row (`DELETE /tables/{tableName}/rows`)
- **Request Body**:
```json
{
  "primary_key": {
    "id": 1
  }
}
```
- **Expected Outcome**: HTTP `200 OK`. Row deleted.

---

## 📋 Checkpoints & Remarks Ledger

| Checkpoint ID | Verification Item | Status | Tester Remarks / Failures / Edge Cases | Fixed? |
| :--- | :--- | :--- | :--- | :--- |
| **CP-4.01** | Inspect schema returns complete tables, columns, primary keys, foreign keys, and indexes | [ ] PASS | | |
| **CP-4.02** | Universal type mapper (`SeasonType`) converts native types accurately | [ ] PASS | | |
| **CP-4.03** | Schema diff correctly identifies added, removed, and altered tables/columns | [ ] PASS | | |
| **CP-4.04** | Table rows pagination correctly handles `page` and `limit` boundaries | [ ] PASS | | |
| **CP-4.05** | SQL injection prevention: table and column identifiers are double-quote sanitized | [ ] PASS | | |
| **CP-4.06** | Insert row correctly inserts data and returns inserted record | [ ] PASS | | |
| **CP-4.07** | Update row matches on primary key and updates target columns | [ ] PASS | | |
| **CP-4.08** | Delete row removes specific row matching primary key | [ ] PASS | | |
| **CP-4.09** | Role enforcement: `viewer` cannot insert, update, or delete rows (403 Forbidden) | [ ] PASS | | |
