import axios from "axios"
import { useAuthStore } from "../store/authStore"

// Create an Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api", // default as per PRD
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to attach the auth token
apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle global errors like 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth store if unauthorized
      useAuthStore.getState().clearAuth()
    }
    return Promise.reject(error)
  }
)

export default apiClient
