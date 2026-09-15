import {
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  HardDrive,
  Radio,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { MigrationStatusBadge } from "./MigrationStatusBadge"
import type { MigrationJob } from "@/types/migration"
import type { MigrationResourceStats } from "@/lib/migrationMetrics"
import {
  getMigrationStatusFlags,
  getMigrationProgressBarClass,
} from "@/lib/migrationStatus"
import { cn } from "@/lib/utils"
import { PROGRESS_MILESTONES } from "@/lib/constants/migrations"

interface MetricColumn {
  label: string
  icon: LucideIcon
  iconColor: string
  mainValue: string
  subValue?: string
}

interface LiveProgressCardProps {
  job: MigrationJob
  percentage: number
  migratedRows: number
  totalRows: number
  status: MigrationJob["status"]
  rowsPerSecond: number
  etaFormatted: string | null
  stats: MigrationResourceStats
  sourceName?: string
  targetName?: string
  errorMessage?: string | null
  className?: string
}

export function LiveProgressCard({
  job,
  percentage,
  migratedRows,
  totalRows,
  status,
  rowsPerSecond,
  etaFormatted,
  stats,
  sourceName,
  targetName,
  errorMessage,
  className,
}: LiveProgressCardProps) {
  const { isRunning, isCompleted, isFailed } = getMigrationStatusFlags(status)

  const metricColumns: MetricColumn[] = [
    {
      label: "Transfer Speed",
      icon: Zap,
      iconColor: "text-warning",
      mainValue: isRunning ? rowsPerSecond.toLocaleString() : "0",
      subValue: "rows/s",
    },
    {
      label: "Data Moved",
      icon: HardDrive,
      iconColor: "text-primary",
      mainValue: stats.formattedMigratedBytes,
      subValue: `of ${stats.formattedTotalBytes}`,
    },
    {
      label: "Time Elapsed",
      icon: Clock,
      iconColor: "text-info",
      mainValue: stats.elapsedFormatted,
      subValue:
        isRunning && etaFormatted
          ? `(Left: ~${etaFormatted})`
          : isCompleted
            ? "(Done)"
            : "",
    },
    {
      label: "Connection",
      icon: Radio,
      iconColor: "text-success",
      mainValue: isCompleted
        ? "Completed"
        : isRunning
          ? "Active"
          : isFailed
            ? "Failed"
            : "Idle",
    },
  ]

  return (
    <div
      className={cn(
        "border-border/60 bg-card/60 overflow-hidden rounded-xl border p-5 shadow-sm backdrop-blur-xs",
        className
      )}
    >
      {/* Top Header Row: Title & Status */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-semibold">
              Migration Progress
            </span>
            <span className="text-muted-foreground font-mono text-xs">
              • Job {job.id.slice(0, 8)}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            {sourceName && targetName
              ? `Moving records from ${sourceName} to ${targetName}`
              : "Live record transfer between databases"}
          </p>
        </div>

        <MigrationStatusBadge status={status} />
      </div>

      {/* Hero Metrics Counter */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline gap-2.5">
          <span className="text-foreground font-mono text-3xl font-semibold sm:text-4xl">
            {migratedRows.toLocaleString()}
          </span>
          <span className="text-muted-foreground font-mono text-sm font-medium">
            / {totalRows > 0 ? totalRows.toLocaleString() : "--"} rows
            transferred
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-mono text-3xl font-semibold sm:text-4xl",
              isCompleted
                ? "text-success"
                : isFailed
                  ? "text-destructive"
                  : "text-primary"
            )}
          >
            {percentage}%
          </span>
          {isCompleted && (
            <CheckCircle2 className="text-success animate-in fade-in h-6 w-6" />
          )}
        </div>
      </div>

      {/* High-Precision Progress Bar with Glowing Pulse */}
      <div className="mt-3">
        <div className="border-border/50 bg-muted/40 relative h-3.5 w-full overflow-hidden rounded-full border">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out",
              getMigrationProgressBarClass(status),
              isRunning && "animate-pulse"
            )}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>

        {/* Milestone Tick Marks */}
        <div className="text-muted-foreground/60 mt-1.5 flex justify-between font-mono text-[10px]">
          {PROGRESS_MILESTONES.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      </div>

      {/* 4-Column Key Metrics Strip mapped from array */}
      <div className="border-border/50 bg-muted/20 mt-4 grid grid-cols-2 gap-3 rounded-lg border p-3 md:grid-cols-4">
        {metricColumns.map((col) => {
          const Icon = col.icon
          return (
            <div key={col.label} className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold uppercase">
                <Icon className={cn("h-3 w-3", col.iconColor)} />
                <span>{col.label}</span>
              </div>
              <p className="text-foreground font-mono text-sm font-semibold">
                {col.mainValue}{" "}
                {col.subValue && (
                  <span className="text-muted-foreground text-[10px] font-normal">
                    {col.subValue}
                  </span>
                )}
              </p>
            </div>
          )
        })}
      </div>

      {/* Error Message Alert Banner */}
      {(errorMessage || job.error_message) && isFailed && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs">
          <AlertCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Migration encountered an issue</p>
            <p className="text-destructive/90 font-mono text-[11px] leading-relaxed">
              {errorMessage || job.error_message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
