import {
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  HardDrive,
  Radio,
} from "lucide-react"
import { MigrationStatusBadge } from "./MigrationStatusBadge"
import type { MigrationJob } from "@/types/migration"
import type { MigrationResourceStats } from "@/lib/migrationMetrics"
import { cn } from "@/lib/utils"

interface LiveProgressCardProps {
  job: MigrationJob
  percentage: number
  migratedRows: number
  totalRows: number
  status: MigrationJob["status"]
  rowsPerSecond: number
  etaFormatted: string | null
  stats: MigrationResourceStats
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
  errorMessage,
  className,
}: LiveProgressCardProps) {
  const isRunning = status === "running"
  const isCompleted = status === "completed"
  const isFailed = status === "failed"

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
            <span className="text-foreground text-sm font-bold tracking-tight">
              Pipeline Sync Progress
            </span>
            <span className="text-muted-foreground font-mono text-xs">
              • Job {job.id.slice(0, 8)}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            Live record replication and checksum verification
          </p>
        </div>

        <MigrationStatusBadge status={status} />
      </div>

      {/* Hero Metrics Counter */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline gap-2.5">
          <span className="text-foreground font-mono text-3xl font-black tracking-tight sm:text-4xl">
            {migratedRows.toLocaleString()}
          </span>
          <span className="text-muted-foreground font-mono text-sm font-medium">
            / {totalRows > 0 ? totalRows.toLocaleString() : "--"} rows synced
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-mono text-3xl font-black sm:text-4xl",
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
              "h-full transition-all duration-300 ease-out",
              isFailed
                ? "bg-destructive"
                : isCompleted
                  ? "bg-success"
                  : "bg-primary",
              isRunning && "animate-pulse"
            )}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>

        {/* Milestone Tick Marks */}
        <div className="text-muted-foreground/60 mt-1.5 flex justify-between font-mono text-[10px]">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Embedded 4-Column KPI Telemetry Strip */}
      <div className="border-border/50 bg-muted/20 mt-4 grid grid-cols-2 gap-3 rounded-lg border p-3 md:grid-cols-4">
        {/* 1. Velocity */}
        <div className="space-y-1">
          <div className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase">
            <Zap className="text-warning h-3 w-3" />
            <span>Throughput Speed</span>
          </div>
          <p className="text-foreground font-mono text-sm font-bold">
            {isRunning ? rowsPerSecond.toLocaleString() : "0"}{" "}
            <span className="text-muted-foreground text-[10px] font-normal">
              rows/s
            </span>
          </p>
        </div>

        {/* 2. Volume */}
        <div className="space-y-1">
          <div className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase">
            <HardDrive className="text-primary h-3 w-3" />
            <span>Volume Streamed</span>
          </div>
          <p className="text-foreground font-mono text-sm font-bold">
            {stats.formattedMigratedBytes}{" "}
            <span className="text-muted-foreground text-[10px] font-normal">
              of {stats.formattedTotalBytes}
            </span>
          </p>
        </div>

        {/* 3. Duration & ETA */}
        <div className="space-y-1">
          <div className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase">
            <Clock className="text-info h-3 w-3" />
            <span>Elapsed / ETA</span>
          </div>
          <p className="text-foreground font-mono text-sm font-bold">
            {stats.elapsedFormatted}{" "}
            <span className="text-muted-foreground text-[10px] font-normal">
              {isRunning && etaFormatted
                ? `(ETA: ${etaFormatted})`
                : isCompleted
                  ? "(Finished)"
                  : ""}
            </span>
          </p>
        </div>

        {/* 4. Telemetry State */}
        <div className="space-y-1">
          <div className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase">
            <Radio className="text-success h-3 w-3" />
            <span>Channel Health</span>
          </div>
          <p className="text-foreground font-mono text-sm font-bold">
            {isCompleted
              ? "Verified"
              : isRunning
                ? "SSE Streaming"
                : isFailed
                  ? "Failed"
                  : "Idle"}
          </p>
        </div>
      </div>

      {/* Error Message Alert Banner */}
      {(errorMessage || job.error_message) && isFailed && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs">
          <AlertCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Pipeline encountered an error</p>
            <p className="text-destructive/90 font-mono text-[11px] leading-relaxed">
              {errorMessage || job.error_message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
