import axios from "axios"
import { useAuthStore } from "../store/authStore"
import { getCookie } from "../lib/utils"

// Create an Axios instance configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/v1",
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
  (error) => {
    console.error(
      `[apiClient] Response Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      }
    )
    if (error.response?.status === 401) {
      console.warn(
        "[apiClient] Intercepted 401 Unauthorized. Triggering clearAuth()."
      )
      // Clear auth store if session is expired or unauthorized
      useAuthStore.getState().clearAuth()
    }
    return Promise.reject(error)
  }
)

export default apiClient
