import apiClient from "./client"
import type {
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/lib/validators"
import type {
  ApiResponse,
  SignupPayload,
  VerifyEmailPayload,
  UpdateProfilePayload,
  OAuthUrlData,
} from "./types"
import type { User } from "@/types"

export const authApi = {
  login: async (data: LoginInput): Promise<ApiResponse<User>> => {
    const response = await apiClient.post("/auth/login", data)
    return response.data
  },

  register: async (data: SignupPayload): Promise<ApiResponse<User>> => {
    const response = await apiClient.post("/auth/signup", data)
    return response.data
  },

  sendOtp: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.post("/auth/otp/send")
    return response.data
  },

  resendOtp: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.post("/auth/otp/send")
    return response.data
  },

  verifyEmail: async (data: VerifyEmailPayload): Promise<ApiResponse<null>> => {
    const response = await apiClient.post("/auth/otp/verify", data)
    return response.data
  },

  me: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get("/auth/me")
    return response.data
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.post("/auth/logout")
    return response.data
  },

  forgotPassword: async (
    data: ForgotPasswordInput
  ): Promise<ApiResponse<null>> => {
    const response = await apiClient.post("/auth/forgot-password", data)
    return response.data
  },

  resetPassword: async (
    data: ResetPasswordInput
  ): Promise<ApiResponse<null>> => {
    const response = await apiClient.post("/auth/reset-password", data)
    return response.data
  },

  getOAuthUrl: async (
    provider: "google" | "github"
  ): Promise<ApiResponse<OAuthUrlData>> => {
    const response = await apiClient.get(`/auth/${provider}/login`)
    return response.data
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get("/user/profile")
    return response.data
  },

  updateProfile: async (
    data: UpdateProfilePayload
  ): Promise<ApiResponse<User>> => {
    const response = await apiClient.put("/user/profile", data)
    return response.data
  },
}

export const userApi = {
  getMyProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get("/user/me")
    return response.data
  },
}
