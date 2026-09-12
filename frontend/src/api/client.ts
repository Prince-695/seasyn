import axios from "axios"
import { useAuthStore } from "../store/authStore"

// ─── API Base URL ─────────────────────────────────────────────────────────────
// In production or cross-origin dev, targeting the backend directly ensures
// the browser automatically attaches cookies scoped to the backend domain
// (including those set during Google/GitHub OAuth redirects).
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://seasyn.onrender.com/v1"

// ─── Axios Instance ────────────────────────────────────────────────────────────
// withCredentials ensures the browser attaches HttpOnly cookies automatically
// on every request — no manual token handling required.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// ─── Response Interceptor ──────────────────────────────────────────────────────
// Singleton refresh promise to eliminate race conditions when multiple concurrent
// requests fail with 401 at the same time.
let refreshPromise: Promise<void> | null = null

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const url = originalRequest.url || ""
    const isAuthHandshake =
      url.includes("/auth/login") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout")

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthHandshake
    ) {
      originalRequest._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
            .then(() => {})
            .finally(() => {
              refreshPromise = null
            })
        }

        await refreshPromise
        return apiClient(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().clearAuth()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const checkSystemHealth = async (): Promise<boolean> => {
  try {
    const rootUrl = API_BASE_URL.replace(/\/v1\/?$/, "")
    const response = await axios.get<{ success?: boolean }>(
      `${rootUrl}/health`,
      {
        timeout: 5000,
      }
    )
    return response.status === 200 && response.data?.success === true
  } catch {
    return false
  }
}

export default apiClient
