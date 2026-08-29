# SEASYN Platform — Plain English Module & API Guide (`explanation.md`)

This guide explains **every module and every single API endpoint** in SEASYN in simple terms. It details the purpose of each endpoint, what input it expects, what it returns, and why it is used.

---

## 🧭 Table of Contents

1. [High-Level Architecture (In Simple Terms)](#1-high-level-architecture-in-simple-terms)
2. [Module 1: Authentication & User Accounts (Phase 1)](#2-module-1-authentication--user-accounts-phase-1)
3. [Module 2: Organizations & Team Access Control (Phase 2)](#3-module-2-organizations--team-access-control-phase-2)
4. [Module 3: Projects & Database Connections (Phase 3)](#4-module-3-projects--database-connections-phase-3)
5. [Module 4: Live Schema Inspector & Data Explorer (Phase 4)](#5-module-4-live-schema-inspector--data-explorer-phase-4)
6. [Module 5: Migration Engine & Streaming Pipeline (Phase 5)](#6-module-5-migration-engine--streaming-pipeline-phase-5)
7. [Module 6: Webhooks, Audit Logs & Notifications (Phase 6)](#7-module-6-webhooks-audit-logs--notifications-phase-6)
8. [Module 7: System & Diagnostic Endpoints](#8-module-7-system--diagnostic-endpoints)

---

## 1. High-Level Architecture (In Simple Terms)

SEASYN is an intelligent database bridge and migration platform.
- **You create an Organization** (e.g. your company or team workspace).
- **Inside your Organization, you create Projects** (e.g. "Production E-Commerce", "Analytics Warehouse").
- **Inside a Project, you register Database Connections** (e.g. PostgreSQL, MySQL, MongoDB, SQLite). Passwords are encrypted with bank-grade AES-256-GCM.
- **Inspect Schemas & Edit Data**: Look at tables, column types, and edit rows directly without installing database clients.
- **Diff Schemas**: Compare Dev database with Prod database to see what changed.
- **Migrate Data**: Stream millions of rows from one database to another with a live progress bar.
- **Audit & Webhooks**: Every change is logged, and events can ping Slack, Discord, or your API server.

---

## 2. Module 1: Authentication & User Accounts (Phase 1)

This module handles who you are, making sure your account is secure, and issuing login session tokens.

### `POST /v1/auth/signup`
- **What it does**: Creates a brand new SEASYN user account.
- **Input**: Your email, first name, last name, and password.
- **Output**: Creates the user, sets your session cookie, and marks your email as `unverified`.

### `POST /v1/auth/login`
- **What it does**: Logs in an existing user.
- **Input**: Email and password.
- **Output**: Returns an `access_token` (valid for short time) and `refresh_token` (valid for 7 days), and sets secure `HttpOnly` cookies.

### `GET /v1/auth/me`
- **What it does**: Checks who is currently logged in.
- **Input**: Session cookie or `Authorization: Bearer <token>` header.
- **Output**: Your user ID, name, email, and whether you have verified your email (`is_verified: true/false`).

### `POST /v1/auth/refresh`
- **What it does**: Silently gets a fresh access token without making you log in again.
- **Input**: Your refresh token cookie.
- **Output**: A brand new access token.

### `POST /v1/auth/logout`
- **What it does**: Logs you out completely.
- **Input**: None (just your active session).
- **Output**: **Deletes all cookies immediately** from your browser so nobody else on your computer can use your account.

### `POST /v1/auth/otp/send`
- **What it does**: Sends a 6-digit OTP code to your email.
- **Input**: `email` and `type` (`"verification"` or `"password_reset"`).
- **Output**: An email with a SEASYN HTML template.

### `POST /v1/auth/otp/verify`
- **What it does**: Validates the 6-digit code you received in your email.
- **Input**: `email`, `code`, and `type`.
- **Output**: Marks your email address as officially verified.

### `POST /v1/auth/forgot-password`
- **What it does**: Starts the password recovery flow if you forgot your password.
- **Input**: Your email address.
- **Output**: Generates a password reset OTP and emails it to you.

### `POST /v1/auth/reset-password`
- **What it does**: Sets a new password using the OTP from your email.
- **Input**: `email`, `otp`, and `new_password`.
- **Output**: Changes your password so you can log in again.

### `POST /v1/auth/change-password`
- **What it does**: Lets a logged-in user change their current password.
- **Input**: `old_password` and `new_password`.
- **Output**: Password updated successfully.

### `GET /v1/auth/{provider}/login` (e.g. `/v1/auth/google/login` or `/github/login`)
- **What it does**: Returns the URL to redirect you to Google or GitHub for 1-click social sign-in.
- **Output**: `{ "auth_url": "https://accounts.google.com/..." }`.

### `GET /v1/auth/{provider}/callback`
- **What it does**: The browser returns here after logging in with Google/GitHub. It verifies your identity, logs you in, sets cookies, and redirects you to the dashboard.

### `GET /v1/users/me` & `PUT /v1/users/update` & `PUT /v1/users/username`
- **What they do**: View and update your personal user profile (first name, last name, unique username).

---

## 3. Module 2: Organizations & Team Access Control (Phase 2)

This module allows multiple users to collaborate inside shared company workspaces with role-based permissions (`Owner`, `Admin`, `Member`, `Viewer`).

### `POST /v1/organizations`
- **What it does**: Creates a new team workspace (e.g. "Acme Corp").
- **Input**: `name`, `slug` (unique URL name like `acme-corp`), and optional `description`.
- **Output**: The new organization, and **you become the Owner**.

### `GET /v1/organizations`
- **What it does**: Lists all organizations you belong to, along with your role in each one.

### `GET /v1/organizations/{orgID}`
- **What it does**: Gets full details of a specific organization.

### `PUT /v1/organizations/{orgID}`
- **What it does**: Updates the organization name or description. (Requires `Admin` or `Owner` role).

### `DELETE /v1/organizations/{orgID}`
- **What it does**: Deletes the organization. (Requires `Owner` role).

### `GET /v1/organizations/{orgID}/members`
- **What it does**: Lists all team members in the organization and their roles.

### `POST /v1/organizations/{orgID}/members`
- **What it does**: Invites a new team member to your organization by email with a role (`admin`, `member`, `viewer`).

### `PUT /v1/organizations/{orgID}/members/{userID}/role`
- **What it does**: Changes a team member's permission level (e.g. promotes a `member` to `admin`).

### `DELETE /v1/organizations/{orgID}/members/{userID}`
- **What it does**: Removes a member from the organization, or lets you leave an organization yourself.

---

## 4. Module 3: Projects & Database Connections (Phase 3)

This module organizes your work into environments (Dev, Staging, Prod) and securely manages database credentials.

### `POST /v1/organizations/{orgID}/projects`
- **What it does**: Creates a project within an organization (e.g. "Billing Service" in `production`).
- **Input**: `name`, `slug`, `environment`, and `description`.

### `GET /v1/organizations/{orgID}/projects` & `GET /.../projects/{projectID}`
- **What they do**: Lists all projects in the organization or gets full details of a single project.

### `PUT /v1/organizations/{orgID}/projects/{projectID}` & `DELETE /.../projects/{projectID}`
- **What they do**: Edits project details or deletes a project.

### `POST /v1/organizations/{orgID}/projects/{projectID}/connections`
- **What it does**: Saves database connection details (host, port, user, password, database name, SSL mode).
- **Security**: The password is **never stored in plain text**. It is encrypted using AES-256-GCM.

### `GET /v1/organizations/{orgID}/projects/{projectID}/connections`
- **What it does**: Lists all saved database connections for a project. Passwords are automatically stripped from the response.

### `POST /v1/organizations/{orgID}/projects/{projectID}/connections/test`
- **What it does**: Tests raw database credentials **before saving them** to see if SEASYN can connect.
- **Output**: `{ "success": true, "latency_ms": 14, "server_info": "PostgreSQL 16.2" }`.

### `POST /v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/test`
- **What it does**: Tests an already saved database connection by decrypting its credentials and running a live ping.

---

## 5. Module 4: Live Schema Inspector & Data Explorer (Phase 4)

This module allows you to inspect tables, understand data types, compare different environments, and browse/edit rows directly.

### `GET /.../connections/{connID}/schema`
- **What it does**: Reads the entire live database structure without downloading data. Returns all tables, columns, primary keys, foreign keys, and indexes.
- **SeasonType**: Automatically translates engine-specific types (like Postgres `timestamptz`, `int8`, `jsonb`) into universal normalized types (`timestamp`, `int`, `json`).

### `GET /.../connections/{connID}/tables`
- **What it does**: Returns a quick list of all table names in the database.

### `GET /.../connections/{connID}/tables/{tableName}`
- **What it does**: Returns the deep structure of one specific table (all column types, primary keys, foreign keys, and indexes).

### `POST /.../schema/diff`
- **What it does**: Compares two database connections (e.g. Dev DB vs Prod DB).
- **Output**: Tells you exactly:
  - Which tables were **added**
  - Which tables were **removed**
  - Which tables had columns **altered** (e.g. type changed, nullable changed)
  - Which tables are identical

### `GET /.../connections/{connID}/tables/{tableName}/rows`
- **What it does**: Browses rows in a table with pagination (`page=1&limit=50`) and sorting (`order_by=created_at&order_dir=desc`).

### `POST /.../connections/{connID}/tables/{tableName}/rows`
- **What it does**: Inserts a new row into the live database table safely.

### `PUT /.../connections/{connID}/tables/{tableName}/rows`
- **What it does**: Updates a row in the live database table matching a primary key.

### `DELETE /.../connections/{connID}/tables/{tableName}/rows`
- **What it does**: Deletes a row matching a primary key from the live database table.

---

## 6. Module 5: Migration Engine & Streaming Pipeline (Phase 5)

This module transfers data from a source database to a destination database reliably without crashing the server's memory.

### `POST /.../migrations`
- **What it does**: Starts an asynchronous migration from a source table to a target table.
- **Input**: `source_connection_id`, `target_connection_id`, `source_table`, `target_table`, and `batch_size` (e.g. 500 rows per batch).
- **Execution Lock**: Prevents duplicate concurrent migrations on the exact same table.
- **Output**: Returns the `job_id` immediately so the UI doesn't freeze.

### `GET /.../migrations` & `GET /.../migrations/{migrationID}`
- **What they do**: Lists past and running migrations or inspects the live status of a single job.

### `GET /.../migrations/{migrationID}/progress` (Server-Sent Events / SSE)
- **What it does**: Opens a real-time live data stream to your browser.
- **Output**: Emits live progress events per batch:
  ```json
  { "job_id": "...", "state": "running", "migrated_rows": 2500, "total_rows": 10000, "percentage": 25.0 }
  ```
  When finished, it emits `state: "completed"` with `percentage: 100.0` and closes.

### `DELETE /.../migrations/{migrationID}`
- **What it does**: Cancels a running migration mid-flight. The background streaming pipeline stops immediately.

---

## 7. Module 6: Webhooks, Audit Logs & Notifications (Phase 6)

This module provides enterprise security tracking and connects SEASYN to external notification services.

### `GET /v1/organizations/{orgID}/audit-logs`
- **What it does**: Returns an immutable security audit log showing who did what, when, from what IP address, and with what User-Agent.
- **Filterable**: By `action`, `user_id`, `project_id`, and `date`.

### `POST /v1/organizations/{orgID}/webhooks`
- **What it does**: Registers an outbound webhook URL (e.g. your Slack bot, Discord webhook, or API backend).
- **Secret**: Generates a cryptographic secret key for payload signing.

### `GET /v1/organizations/{orgID}/webhooks` & `GET /.../webhooks/{webhookID}`
- **What they do**: Lists all webhooks or gets details of a single webhook.

### `PUT /v1/organizations/{orgID}/webhooks/{webhookID}` & `DELETE /.../webhooks/{webhookID}`
- **What they do**: Updates webhook settings (subscribed events, active toggle) or deletes a webhook.

### `POST /v1/organizations/{orgID}/webhooks/{webhookID}/test`
- **What it does**: Sends a test `ping` event to your webhook URL immediately and shows you if your server responded with HTTP 200 and the latency in milliseconds.

### `GET /v1/organizations/{orgID}/webhooks/{webhookID}/deliveries`
- **What it does**: Shows a history of all webhook POST attempts, including payload, HTTP status code received, and error messages if any.

### **HMAC-SHA256 Payload Signature**
Every webhook sent by SEASYN includes a security header:
```
X-Seasyn-Signature-256: sha256=d3b07384d113edec49eaa6238ad5ff00...
```
This allows your server to verify that the webhook actually came from SEASYN and was not spoofed.

---

## 8. Module 7: System & Diagnostic Endpoints

### `GET /`
- **What it does**: Welcome endpoint returning API version and response time in milliseconds.

### `GET /health`
- **What it does**: Kubernetes and load-balancer health check endpoint. Returns `HTTP 200 OK` if the backend is running.

### `GET /swagger/*`
- **What it does**: Interactive OpenAPI Swagger documentation explorer for testing every single API endpoint directly in your browser.
