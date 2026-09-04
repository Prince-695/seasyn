/**
 * API Request & Response Wire Types
 * Represents the exact payload and response contracts for backend communication.
 */

import type { User } from "@/types"

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  error?: string
  data?: T
  user?: User
  access_token?: string
  response_time?: string
}

export interface SignupPayload {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface VerifyEmailPayload {
  otp: string
}

export interface UpdateProfilePayload {
  first_name?: string
  last_name?: string
  username?: string
}

export interface OAuthUrlData {
  auth_url: string
}

export type AuthResponse = ApiResponse<User>
export type OAuthUrlResponse = ApiResponse<OAuthUrlData>
