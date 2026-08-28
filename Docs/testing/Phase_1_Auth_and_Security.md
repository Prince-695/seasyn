# Phase 1 QA Manual: Authentication, Security & OTP Verification

This manual covers testing for **User Signup, Login, Password Management, OTP Email Verification, OAuth2 (Google & GitHub), Session Cookies, Logout Cookie Deletion, and Rate Limiting**.

---

## 📌 API Endpoints Under Test

| Endpoint | Method | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| `/v1/auth/signup` | `POST` | Register new user account | No |
| `/v1/auth/login` | `POST` | Authenticate user & issue tokens | No |
| `/v1/auth/me` | `GET` | Get authenticated user profile & verification status | Yes (Bearer/Cookie) |
| `/v1/auth/refresh` | `POST` | Refresh access token using refresh token | No (Cookie/Body) |
| `/v1/auth/logout` | `POST` | Clear access & refresh cookies and invalidate tokens | Yes (Bearer/Cookie) |
| `/v1/auth/otp/send` | `POST` | Send 6-digit OTP email (verification/reset) | No |
| `/v1/auth/otp/verify` | `POST` | Verify 6-digit OTP code | No |
| `/v1/auth/forgot-password` | `POST` | Request password reset OTP | No |
| `/v1/auth/reset-password` | `POST` | Reset password using verified OTP | No |
| `/v1/auth/change-password` | `POST` | Update password for logged-in user | Yes (Bearer) |
| `/v1/auth/{provider}/login` | `GET` | Get OAuth2 authorization redirect URL | No |
| `/v1/auth/{provider}/callback`| `GET` | Handle OAuth2 code exchange & set cookies | No |

---

## 🧪 Detailed Test Scenarios

### 1. User Registration (`POST /v1/auth/signup`)
- **Pre-conditions**: Backend server running.
- **Request Body**:
```json
{
  "email": "tester_qa@seasyn.io",
  "password": "StrongPassword@123",
  "first_name": "QA",
  "last_name": "Tester"
}
```
- **Expected Outcome**:
  - HTTP `201 Created`
  - Response contains user object with `is_verified: false`
  - Access and refresh tokens set in `HttpOnly`, `SameSite=Lax` cookies.

---

### 2. OTP Email Verification (`POST /v1/auth/otp/send` & `/v1/auth/otp/verify`)
- **Test Case 1 (Send Email Verification OTP)**:
  - `POST /v1/auth/otp/send` with `{"email": "tester_qa@seasyn.io", "type": "verification"}`
  - **Expected Outcome**: HTTP `200 OK`, HTML email received using `verify_email_otp.html` template.
- **Test Case 2 (Verify OTP)**:
  - `POST /v1/auth/otp/verify` with `{"email": "tester_qa@seasyn.io", "code": "<6_digit_otp>", "type": "verification"}`
  - **Expected Outcome**: HTTP `200 OK`, `GET /v1/auth/me` now returns `is_verified: true`.
- **Test Case 3 (Invalid OTP / Expired OTP)**:
  - Test with `000000` -> Expect HTTP `400 Bad Request`.

---

### 3. Password Reset Flow (`POST /v1/auth/forgot-password` & `/v1/auth/reset-password`)
- **Test Case 1 (Forgot Password Request)**:
  - `POST /v1/auth/forgot-password` with `{"email": "tester_qa@seasyn.io"}`
  - **Expected Outcome**: HTTP `200 OK`, password reset OTP sent using `password_reset_otp.html` template.
- **Test Case 2 (Reset Password with OTP)**:
  - `POST /v1/auth/reset-password` with `{"email": "tester_qa@seasyn.io", "otp": "<6_digit_otp>", "new_password": "NewStrongPassword@123"}`
  - **Expected Outcome**: HTTP `200 OK`. User can now log in with the new password.

---

### 4. Logout & Cookie Deletion (`POST /v1/auth/logout`)
- **Test Case 1**:
  - Call `POST /v1/auth/logout` with active session.
  - **Expected Outcome**:
    - HTTP `200 OK`
    - Response headers include `Set-Cookie: access_token=; Max-Age=0` and `Set-Cookie: refresh_token=; Max-Age=0`.
    - Subsequent calls to `/v1/auth/me` without Authorization header return `401 Unauthorized`.

---

### 5. OAuth2 Social Login (`GET /v1/auth/{provider}/login` & `/callback`)
- **Test Case 1 (Google OAuth)**:
  - `GET /v1/auth/google/login` -> Returns JSON containing `auth_url` pointing to `accounts.google.com`.
- **Test Case 2 (GitHub OAuth)**:
  - `GET /v1/auth/github/login` -> Returns JSON containing `auth_url` pointing to `github.com/login/oauth/authorize`.
- **Test Case 3 (Callback Failure Redirection)**:
  - Simulate invalid state: `GET /v1/auth/google/callback?state=invalid&code=1234`
  - **Expected Outcome**: Redirects to `${FRONTEND_URL}/sign-in?error=invalid_csrf_token`.

---

## 📋 Checkpoints & Remarks Ledger

| Checkpoint ID | Verification Item | Status | Tester Remarks / Failures / Edge Cases | Fixed? |
| :--- | :--- | :--- | :--- | :--- |
| **CP-1.01** | Signup with valid email & strong password returns 201 | [ ] PASS | | |
| **CP-1.02** | Signup with duplicate email returns 400 Bad Request | [ ] PASS | | |
| **CP-1.03** | Login with valid credentials returns tokens in cookies & body | [ ] PASS | | |
| **CP-1.04** | Login with incorrect password returns 401 Unauthorized | [ ] PASS | | |
| **CP-1.05** | Send Verification OTP delivers email with SEASYN branded template | [ ] PASS | | |
| **CP-1.06** | Verify OTP marks user `is_verified: true` | [ ] PASS | | |
| **CP-1.07** | Forgot Password OTP uses dedicated reset template | [ ] PASS | | |
| **CP-1.08** | Reset Password completes successfully and rejects old password | [ ] PASS | | |
| **CP-1.09** | Logout completely deletes `access_token` and `refresh_token` cookies | [ ] PASS | | |
| **CP-1.10** | Token refresh endpoint exchanges valid refresh token for new access token | [ ] PASS | | |
| **CP-1.11** | OAuth login URLs contain correct `client_id`, `redirect_uri`, and CSRF `state` | [ ] PASS | | |
| **CP-1.12** | OAuth callback error redirects to frontend sign-in error URL | [ ] PASS | | |
| **CP-1.13** | Rate limiter blocks brute force attempts after limit threshold | [ ] PASS | | |
