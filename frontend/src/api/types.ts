/**
 * API Request & Response Wire Types
 * Represents the exact payload and response contracts for backend communication.
 */

import type { User, OAuthUrlData } from "@/types"

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  error?: string
  data?: T
  user?: User
  access_token?: string
  response_time?: string
}

export type AuthResponse = ApiResponse<User>
export type OAuthUrlResponse = ApiResponse<OAuthUrlData>

export type {
  SignupPayload,
  VerifyEmailPayload,
  UpdateProfilePayload,
  OAuthUrlData,
} from "@/types"
