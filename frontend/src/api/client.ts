import axios from "axios"
import { useAuthStore } from "../store/authStore"

// Create an Axios instance configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/v1",
  withCredentials: true, // Enable automatic transmission of HTTP-Only cookies
  headers: {
    "Content-Type": "application/json",
  },
})

// Response interceptor to handle global authentication errors (e.g., expired cookie)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth store if session is expired or unauthorized
      useAuthStore.getState().clearAuth()
    }
    return Promise.reject(error)
  }
)

export default apiClient
