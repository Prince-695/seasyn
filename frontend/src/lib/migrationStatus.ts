import type { MigrationStatus } from "@/types/migration"

/**
 * Derives the 5 boolean status flags from a MigrationStatus string.
 * Use this instead of redefining `const isRunning = status === "running"` in every component.
 */
export function getMigrationStatusFlags(status: MigrationStatus) {
  return {
    isRunning: status === "running",
    isCompleted: status === "completed",
    isFailed: status === "failed",
    isCancelled: status === "cancelled",
    isPending: status === "pending",
  }
}

/**
 * Returns the CSS class for a migration pipeline progress bar fill.
 * Centralizes the `failed → destructive, completed → success, else → primary` pattern.
 */
export function getMigrationProgressBarClass(status: MigrationStatus): string {
  if (status === "failed") return "bg-destructive"
  if (status === "completed") return "bg-success"
  if (status === "running") return "bg-primary"
  return "bg-info"
}
