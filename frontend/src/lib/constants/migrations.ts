import type { MigrationStatus } from "@/types"

export const BATCH_SIZE_PRESETS = [100, 500, 1000, 2500, 5000] as const

export const MIGRATION_STATUS_FILTERS: Array<{
  value: "all" | MigrationStatus
  label: string
}> = [
  { value: "all", label: "All" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
]

export const TERMINAL_FILTER_LEVELS = [
  "ALL",
  "INFO",
  "STREAM",
  "BATCH",
  "SUCCESS",
  "WARN",
  "ERROR",
] as const

export type TerminalFilterLevel = (typeof TERMINAL_FILTER_LEVELS)[number]

export const PROGRESS_MILESTONES = ["0%", "25%", "50%", "75%", "100%"] as const
