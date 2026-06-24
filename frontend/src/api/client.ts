import axios from "axios"
import { useAuthStore } from "../store/authStore"
import { getCookie } from "../lib/utils"

// Create an Axios instance configuration
const apiClient = axios.create({
  baseURL: "/v1", // Using relative URL to leverage Vite Proxy
  withCredentials: true, // Enable automatic transmission of HTTP-Only cookies
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to automatically attach the token cookie in the Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = getCookie("access_token")
    console.log(
      `[apiClient] Requesting: ${config.method?.toUpperCase()} ${config.url}`,
      {
        hasCookieToken: !!token,
        cookieTokenLength: token ? token.length : 0,
      }
    )
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log(
        `[apiClient] Attached Authorization Header: Bearer ${token.substring(0, 10)}...`
      )
    } else {
      console.log(
        "[apiClient] No token found in cookies. Authorization header not attached."
      )
    }
    return config
  },
  (error) => {
    console.error("[apiClient] Request interceptor error:", error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle global authentication errors (e.g., expired cookie)
apiClient.interceptors.response.use(
  (response) => {
    console.log(
      `[apiClient] Response Success: ${response.config.method?.toUpperCase()} ${response.config.url}`,
      response.status
    )
    return response
  },
  async (error) => {
    console.error(
      `[apiClient] Response Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      }
    )
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn(
        "[apiClient] Intercepted 401 Unauthorized. Attempting to refresh token..."
      )
      originalRequest._retry = true
      try {
        // Ping backend refresh endpoint. Browser automatically sends the HttpOnly refresh_token cookie.
        await axios.post("/v1/auth/refresh", {}, { withCredentials: true })

        // If successful, the backend set a new access_token cookie. Retry original request.
        return apiClient(originalRequest)
      } catch (refreshError) {
        console.error(
          "[apiClient] Token refresh failed. Triggering clearAuth()."
        )
        // Refresh token is also expired or invalid. Clear auth store.
        useAuthStore.getState().clearAuth()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
