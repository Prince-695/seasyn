# SEASYN Platform — QA Testing Manual & Quality Assurance Suite

Welcome to the **SEASYN Quality Assurance & Testing Suite**. This folder contains the complete end-to-end manual testing specifications, API contracts, verification checkpoints, and remarks sections for all platform capabilities implemented across **Phases 1 to 6**.

---

## 📑 Testing Documentation Index

| Document | Scope & Modules Covered |
| :--- | :--- |
| **[Master QA Manual](file:///home/princerathod695/Projects/seasyn/Docs/testing/Master_QA_Manual.md)** | **All-in-One Comprehensive Master Manual (Phases 1 to 6)** with complete end-to-end user journeys, payload templates, and unified checkpoints ledger. |
| **[Phase 1: Auth, Security & OTP](file:///home/princerathod695/Projects/seasyn/Docs/testing/Phase_1_Auth_and_Security.md)** | Signup, Login, Password Reset, OTP verification with email templates, OAuth (Google/GitHub), Cookie deletion on Logout, and Rate Limiting. |
| **[Phase 2: Organizations & RBAC](file:///home/princerathod695/Projects/seasyn/Docs/testing/Phase_2_Organizations_and_RBAC.md)** | Organization CRUD, slug uniqueness, member invitations, RBAC permission hierarchy (`owner` > `admin` > `member` > `viewer`), and member management. |
| **[Phase 3: Projects & Connections](file:///home/princerathod695/Projects/seasyn/Docs/testing/Phase_3_Projects_and_Connections.md)** | Project lifecycle, database connection management, AES-256-GCM credential encryption, live diagnostic connection testing, and latency checks. |
| **[Phase 4: Schema & Live Editor](file:///home/princerathod695/Projects/seasyn/Docs/testing/Phase_4_Schema_and_Live_Editor.md)** | Live database schema inspection, table metadata, universal `SeasonType` mapping, schema diff engine, and live table row CRUD (Data Explorer). |
| **[Phase 5: Migration Engine](file:///home/princerathod695/Projects/seasyn/Docs/testing/Phase_5_Migration_Engine.md)** | Batched row streaming pipeline, real-time Server-Sent Events (SSE) progress broadcasting, migration cancellation, and execution lock protection. |
| **[Phase 6: Webhooks & Audit Logs](file:///home/princerathod695/Projects/seasyn/Docs/testing/Phase_6_Webhooks_Audit_and_Notifications.md)** | Immutable audit activity logging, outbound webhooks with HMAC-SHA256 signature verification, delivery inspection, and automated event triggers. |

---

## 🛠️ Testing Environment & Swagger Access

### 1. Swagger OpenAPI Interactive Documentation
- **URL**: `http://localhost:8080/swagger/index.html` (or your configured production/staging URL)
- **Authentication**: HTTP Basic Auth
  - **Username**: Value of `SWAGGER_USER` in `.env` (default: `admin`)
  - **Password**: Value of `SWAGGER_PASS` in `.env` (default: `secret`)
- **API Authorization**:
  - Click the green **Authorize** button in Swagger UI.
  - Enter `Bearer <access_token>` received from login or cookie.

### 2. Local Backend Service Startup
```bash
cd backend/

# 1. Start internal database schema sync
DB_RUN=true go run cmd/server/main.go

# 2. Run automated test suite
go test -v ./...
```

---

## 📝 How to Use the Checkpoints & Remarks Ledger

Each test case contains a standardized verification table:

```markdown
| Checkpoint ID | Test Case | Status [PASS/FAIL/BLOCKED] | Tester Remarks / Observed Failures / Edge Cases | Fixed? [YES/NO] |
| :--- | :--- | :--- | :--- | :--- |
| CP-1.01 | User Registration with Valid Data | [ ] PASS | | |
```

- Mark `[x] PASS` or `[x] FAIL`.
- Fill in the **Tester Remarks** column with any unexpected behaviors, edge cases, error codes, or payloads for fast developer triage.
