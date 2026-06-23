import apiClient from "./client"
import type {
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/lib/validators"
import type { SignupPayload } from "@/types"

export const authApi = {
  login: async (data: LoginInput) => {
    const response = await apiClient.post("/auth/login", data)
    return response.data
  },

  register: async (data: SignupPayload) => {
    const response = await apiClient.post("/auth/signup", data)
    return response.data
  },

  me: async () => {
    const response = await apiClient.get("/auth/me")
    return response.data
  },

  forgotPassword: async (data: ForgotPasswordInput) => {
    const response = await apiClient.post("/auth/forgot-password", data)
    return response.data
  },

  resetPassword: async (data: ResetPasswordInput) => {
    const response = await apiClient.post("/auth/reset-password", data)
    return response.data
  },

  getOAuthUrl: async (provider: "google" | "github") => {
    const response = await apiClient.get(`/auth/${provider}/login`)
    return response.data
  },

  getProfile: async () => {
    const response = await apiClient.get("/user/profile")
    return response.data
  },
}
