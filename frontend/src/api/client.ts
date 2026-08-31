import axios from "axios"
import { useAuthStore } from "../store/authStore"

// ─── Axios Instance ────────────────────────────────────────────────────────────
// baseURL uses a relative path so Vite's dev-proxy forwards /v1/* to the backend.
// withCredentials ensures the browser attaches HttpOnly cookies automatically
// on every request — no manual token handling required.
const apiClient = axios.create({
  baseURL: "/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// ─── Request Interceptor ───────────────────────────────────────────────────────
// HttpOnly cookies (access_token, refresh_token) are invisible to document.cookie
// and therefore to any JS cookie helper. The browser attaches them automatically
// via withCredentials — there is nothing to do here manually.
apiClient.interceptors.request.use(
  (config) => config,
  (error) => {
    console.error("[apiClient] Request error:", error)
    return Promise.reject(error)
  }
)

// ─── Response Interceptor ──────────────────────────────────────────────────────
// Handles 401 responses by attempting a silent token refresh, then retrying
// the original request. If the refresh also fails, clears the auth store so
// the user is redirected to the sign-in page.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn("[apiClient] 401 received — attempting token refresh...")
      originalRequest._retry = true

      try {
        // The browser auto-sends the HttpOnly refresh_token cookie here.
        await axios.post("/v1/auth/refresh", {}, { withCredentials: true })

        // Refresh succeeded — backend set a new access_token cookie.
        // Retry the original request; the browser will attach the new cookie.
        return apiClient(originalRequest)
      } catch (refreshError) {
        console.error("[apiClient] Token refresh failed — clearing auth.")
        useAuthStore.getState().clearAuth()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
