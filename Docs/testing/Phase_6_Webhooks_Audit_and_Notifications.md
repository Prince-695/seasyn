# Phase 6 QA Manual: Webhooks, Team Notifications & Audit Logs

This manual covers testing for **Organizational Audit Logs, Outbound Webhooks with HMAC-SHA256 Signatures, Delivery Inspection, and Automatic Event Dispatchers**.

---

## 📌 API Endpoints Under Test

| Endpoint | Method | Description | Min Role |
| :--- | :--- | :--- | :--- |
| `/v1/organizations/{orgID}/audit-logs` | `GET` | List and filter immutable organization activity logs | `admin` |
| `/v1/organizations/{orgID}/webhooks` | `POST` | Register an outbound webhook with secret | `admin` |
| `/v1/organizations/{orgID}/webhooks` | `GET` | List all webhooks in organization | `viewer` |
| `/v1/organizations/{orgID}/webhooks/{webhookID}` | `GET` | Get webhook configuration details | `viewer` |
| `/v1/organizations/{orgID}/webhooks/{webhookID}` | `PUT` | Update webhook URL, events, or active status | `admin` |
| `/v1/organizations/{orgID}/webhooks/{webhookID}` | `DELETE` | Delete webhook | `admin` |
| `/v1/organizations/{orgID}/webhooks/{webhookID}/test` | `POST` | Trigger test ping event to webhook endpoint | `admin` |
| `/v1/organizations/{orgID}/webhooks/{webhookID}/deliveries` | `GET` | List recent HTTP delivery attempts and status | `viewer` |

---

## 🧪 Detailed Test Scenarios

### 1. Audit Logs Retrieval & Filters (`GET /v1/organizations/{orgID}/audit-logs`)
- **Query Parameters**:
  - `page`: `1`
  - `limit`: `50`
  - `project_id`: (optional)
  - `action`: (optional, e.g. `migration.started`, `project.created`)
- **Expected Outcome**:
  - HTTP `200 OK`
  - Returns array of `logs` with fields: `id`, `org_id`, `user_id`, `action`, `resource_type`, `resource_id`, `metadata`, `ip_address`, `user_agent`, `created_at`.
  - Non-admins attempting to read audit logs receive `403 Forbidden`.

---

### 2. Register Webhook (`POST /v1/organizations/{orgID}/webhooks`)
- **Request Body**:
```json
{
  "name": "Datadog Alert Integration",
  "url": "https://webhook.site/your-unique-uuid",
  "events": [
    "migration.started",
    "migration.completed",
    "migration.failed"
  ],
  "is_active": true
}
```
- **Expected Outcome**:
  - HTTP `201 Created`
  - Returns `secret` (e.g. `48-character hex string`).
  - Subsequent `GET /webhooks/{webhookID}` requests will omit the `secret`.

---

### 3. Test Webhook Ping (`POST /v1/organizations/{orgID}/webhooks/{webhookID}/test`)
- **Action**: Dispatches a synthetic ping event to the target URL.
- **Expected Outcome**:
  - HTTP `200 OK` with payload:
```json
{
  "success": true,
  "data": {
    "success": true,
    "status_code": 200,
    "execution_duration_ms": 78,
    "response_body": "OK"
  }
}
```
  - The destination server receives:
    - `Header X-Seasyn-Event: ping`
    - `Header X-Seasyn-Signature-256: sha256=<hmac_sha256_hex>`
    - `Header X-Seasyn-Delivery-ID: <uuid>`

---

### 4. Automatic Webhook Trigger on Migration Events
- **Action**: Start and complete a migration.
- **Verification**:
  - `GET /webhooks/{webhookID}/deliveries` displays logged deliveries for `migration.started` and `migration.completed`.
  - Delivery records include `status_code`, `success: true`, and payload body.

---

## 📋 Checkpoints & Remarks Ledger

| Checkpoint ID | Verification Item | Status | Tester Remarks / Failures / Edge Cases | Fixed? |
| :--- | :--- | :--- | :--- | :--- |
| **CP-6.01** | Audit log automatically records user actions across org, project, and migration operations | [ ] PASS | | |
| **CP-6.02** | Audit log query filters by action, user ID, and pagination work accurately | [ ] PASS | | |
| **CP-6.03** | Viewer role is blocked from reading audit logs (403 Forbidden) | [ ] PASS | | |
| **CP-6.04** | Webhook registration generates secure signing secret and returns it once | [ ] PASS | | |
| **CP-6.05** | Webhook dispatcher signs payloads using HMAC-SHA256 with `sha256=` header prefix | [ ] PASS | | |
| **CP-6.06** | Test webhook ping delivers test payload and records execution latency | [ ] PASS | | |
| **CP-6.07** | Migration events automatically trigger outbound webhooks to subscribed endpoints | [ ] PASS | | |
| **CP-6.08** | Webhook delivery failures (timeouts, 500s) are recorded in delivery logs | [ ] PASS | | |
| **CP-6.09** | Deleting a webhook prevents future event dispatches | [ ] PASS | | |
