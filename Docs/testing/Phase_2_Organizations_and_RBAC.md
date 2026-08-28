# Phase 2 QA Manual: Organizations, Team Collaboration & RBAC

This manual covers testing for **Organization Creation, Slug Uniqueness, Member Invitations, Role Updates, Removal, and RBAC Permission Hierarchy (`owner` > `admin` > `member` > `viewer`)**.

---

## 📌 API Endpoints Under Test

| Endpoint | Method | Description | Min Role Required |
| :--- | :--- | :--- | :--- |
| `/v1/organizations` | `POST` | Create a new organization | Authenticated User |
| `/v1/organizations` | `GET` | List all organizations the user belongs to | Authenticated User |
| `/v1/organizations/{orgID}` | `GET` | Get organization details & user role | `viewer` |
| `/v1/organizations/{orgID}` | `PUT` | Update organization name, description, avatar | `admin` |
| `/v1/organizations/{orgID}` | `DELETE` | Delete organization (soft delete) | `owner` |
| `/v1/organizations/{orgID}/members` | `GET` | List all members in the organization | `viewer` |
| `/v1/organizations/{orgID}/members` | `POST` | Invite/Add member to organization with role | `admin` |
| `/v1/organizations/{orgID}/members/{userID}/role` | `PUT` | Update a member's role (`admin`, `member`, `viewer`) | `owner` / `admin` |
| `/v1/organizations/{orgID}/members/{userID}` | `DELETE` | Remove member from organization | `admin` (or self) |

---

## 🧪 Detailed Test Scenarios

### 1. Create Organization (`POST /v1/organizations`)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "Acme Global Engineering",
  "slug": "acme-global",
  "description": "Primary enterprise data engineering workspace"
}
```
- **Expected Outcome**:
  - HTTP `201 Created`
  - Creator is automatically assigned role `owner`.
- **Negative Test (Duplicate Slug)**:
  - Create another org with `"slug": "acme-global"` -> Expect HTTP `400 Bad Request` ("Organization slug already in use").

---

### 2. Member Management & Invitations
- **Test Case 1 (Invite Member as Admin)**:
  - `POST /v1/organizations/{orgID}/members` with `{"email": "colleague@example.com", "role": "member"}`
  - **Expected Outcome**: HTTP `201 Created`. Member appears in `/v1/organizations/{orgID}/members`.
- **Test Case 2 (Viewer Attempts to Invite Member)**:
  - Send invite using a token with role `viewer`.
  - **Expected Outcome**: HTTP `403 Forbidden`.

---

### 3. Role Hierarchy & Permission Matrix Verification

| Role | Read Schema / List Projs | Edit Table Rows | Start Migration | Invite Members | Delete Org |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Member**| ✅ | ✅ | ❌ | ❌ | ❌ |
| **Viewer**| ✅ | ❌ | ❌ | ❌ | ❌ |

- **Test Case 1 (Member attempts to start migration)**: Expect HTTP `403 Forbidden`.
- **Test Case 2 (Viewer attempts to insert table row)**: Expect HTTP `403 Forbidden`.
- **Test Case 3 (Admin attempts to delete organization)**: Expect HTTP `403 Forbidden`.
- **Test Case 4 (Owner deletes organization)**: Expect HTTP `200 OK`.

---

## 📋 Checkpoints & Remarks Ledger

| Checkpoint ID | Verification Item | Status | Tester Remarks / Failures / Edge Cases | Fixed? |
| :--- | :--- | :--- | :--- | :--- |
| **CP-2.01** | Create organization auto-assigns creator as `owner` | [ ] PASS | | |
| **CP-2.02** | Duplicate organization slug is rejected with 400 Bad Request | [ ] PASS | | |
| **CP-2.03** | List user organizations returns correct role per organization | [ ] PASS | | |
| **CP-2.04** | Admin can invite new members with `member` or `viewer` roles | [ ] PASS | | |
| **CP-2.05** | Member and Viewer roles cannot invite new members (403 Forbidden) | [ ] PASS | | |
| **CP-2.06** | Role upgrade/downgrade takes effect immediately across all endpoints | [ ] PASS | | |
| **CP-2.07** | Owner cannot be removed by an Admin | [ ] PASS | | |
| **CP-2.08** | Members can leave the organization voluntarily (self-removal) | [ ] PASS | | |
| **CP-2.09** | Only Owner can delete organization; deletion cascades soft-delete | [ ] PASS | | |
