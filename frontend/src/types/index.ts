import type { ReactNode } from "react"

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

// ─── Domain & Feature Types ───────────────────────────────────────────────────
export * from "./auth"
export * from "./org"
export * from "./project"
export * from "./schema"
