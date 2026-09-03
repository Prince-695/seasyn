import type { ReactNode } from "react"

// ─── Core User & Auth Types ───────────────────────────────────────────────────
// Matches the Go backend `domain.User` response exactly.

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

// Re-export API wire types for backward compatibility
export type { SignupPayload } from "@/api/types"

// ─── Database Types ───────────────────────────────────────────────────────────

export type DBType = "postgres" | "mysql" | "mongodb" | "sqlite"

export interface DBTypeMeta {
  displayName: string
  colorClass: string
  bgColorClass: string
}

// ─── Component Prop Types ─────────────────────────────────────────────────────

export interface ProtectedRouteProps {
  children?: ReactNode
}

// ─── Organization & RBAC Types ────────────────────────────────────────────────
export * from "./org"
