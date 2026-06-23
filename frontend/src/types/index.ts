import type { ReactNode } from "react"

export interface User {
  id: string
  email: string
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

export interface SignupPayload {
  email: string
  password: string
  first_name: string
  last_name: string
}

export type DBType = "postgresql" | "mysql" | "mongodb" | "sqlite"

export interface DBTypeMeta {
  displayName: string
  colorClass: string // Tailwind text color
  bgColorClass: string // Tailwind background color
}

export interface ProtectedRouteProps {
  children?: ReactNode
}
