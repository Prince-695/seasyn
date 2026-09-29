// ─── Core User & Auth Domain Types ──────────────────────────────────────────

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  username?: string
  avatar_url?: string
  is_verified: boolean
  created_at?: string
  updated_at?: string
  // Derived convenience getter used in UI
  name?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isInitialized: boolean
  setAuth: (user: User) => void
  clearAuth: () => void
  setInitialized: (status: boolean) => void
}

// ─── Wire Payloads ───────────────────────────────────────────────────────────

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
