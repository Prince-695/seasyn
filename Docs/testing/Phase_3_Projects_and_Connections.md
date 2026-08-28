# Phase 3 QA Manual: Project & Database Connection Management

This manual covers testing for **Project Creation, Database Connection CRUD across PostgreSQL, MySQL, MongoDB, SQLite, AES-256-GCM Credential Encryption, Diagnostic Connection Testing, and Latency Checks**.

---

## 📌 API Endpoints Under Test

| Endpoint | Method | Description | Min Role |
| :--- | :--- | :--- | :--- |
| `/v1/organizations/{orgID}/projects` | `POST` | Create a new project within organization | `member` |
| `/v1/organizations/{orgID}/projects` | `GET` | List all projects in organization | `viewer` |
| `/v1/organizations/{orgID}/projects/{projectID}` | `GET` | Get project details including connection list | `viewer` |
| `/v1/organizations/{orgID}/projects/{projectID}` | `PUT` | Update project name, description, environment | `admin` |
| `/v1/organizations/{orgID}/projects/{projectID}` | `DELETE` | Delete project and associated connections | `admin` |
| `/v1/organizations/{orgID}/projects/{projectID}/connections` | `POST` | Add database connection to project (credentials encrypted) | `member` |
| `/v1/organizations/{orgID}/projects/{projectID}/connections` | `GET` | List connections (passwords omitted) | `viewer` |
| `/v1/organizations/{orgID}/projects/{projectID}/connections/{connID}` | `GET` | Get connection details (passwords omitted) | `viewer` |
| `/v1/organizations/{orgID}/projects/{projectID}/connections/{connID}` | `PUT` | Update database connection configuration | `member` |
| `/v1/organizations/{orgID}/projects/{projectID}/connections/{connID}` | `DELETE` | Delete database connection | `member` |
| `/v1/organizations/{orgID}/projects/{projectID}/connections/test` | `POST` | Test raw connection parameters before saving | `viewer` |
| `/v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/test` | `POST` | Test saved connection using decrypted credentials | `viewer` |

---

## 🧪 Detailed Test Scenarios

### 1. Project Management
- **Test Case 1 (Create Project)**:
  - `POST /v1/organizations/{orgID}/projects` with:
```json
{
  "name": "E-Commerce Core Service",
  "slug": "ecommerce-core",
  "environment": "production",
  "description": "Primary transactional database and analytics warehouse"
}
```
  - **Expected Outcome**: HTTP `201 Created`.

---

### 2. Database Connection Registration & Encryption
- **Test Case 1 (Add PostgreSQL Connection)**:
```json
{
  "name": "Postgres Primary",
  "db_type": "postgres",
  "host": "localhost",
  "port": 5432,
  "database": "seasyn_test",
  "username": "postgres",
  "password": "super_secret_db_password",
  "ssl_mode": "disable",
  "is_source": true
}
```
  - **Expected Outcome**: HTTP `201 Created`.
  - **Security Check**: Response must **NOT** contain `password`, `encrypted_password`, or plain `uri`.

---

### 3. Diagnostic Connection Testing
- **Test Case 1 (Test Raw Parameters `POST /connections/test`)**:
  - Send valid Postgres connection parameters.
  - **Expected Outcome**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "latency_ms": 12,
    "server_info": "PostgreSQL 16.x"
  }
}
```
- **Test Case 2 (Test with Invalid Password)**:
  - Send bad password -> Expect `data.success: false` with descriptive error message (e.g. `password authentication failed`).
- **Test Case 3 (Test Saved Connection `POST /connections/{connID}/test`)**:
  - Tests decrypted stored credentials against the live database server. Expect HTTP `200 OK` with latency metrics.

---

## 📋 Checkpoints & Remarks Ledger

| Checkpoint ID | Verification Item | Status | Tester Remarks / Failures / Edge Cases | Fixed? |
| :--- | :--- | :--- | :--- | :--- |
| **CP-3.01** | Create project with environment ('development', 'staging', 'production') | [ ] PASS | | |
| **CP-3.02** | Duplicate project slug in same organization is rejected | [ ] PASS | | |
| **CP-3.03** | PostgreSQL connection creation saves and encrypts credentials with AES-256-GCM | [ ] PASS | | |
| **CP-3.04** | API responses NEVER expose plaintext or ciphertext passwords | [ ] PASS | | |
| **CP-3.05** | Direct connection test returns live server latency and connection status | [ ] PASS | | |
| **CP-3.06** | Saved connection test properly decrypts credentials and executes Ping | [ ] PASS | | |
| **CP-3.07** | Invalid hostname or port timeout handled gracefully without server crash | [ ] PASS | | |
| **CP-3.08** | Deleting a connection cleans up connection metadata | [ ] PASS | | |
