import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MigrationStatusBadge } from "./MigrationStatusBadge"
import { EngineIcon } from "@/components/connections/EngineIcon"
import type { MigrationJob } from "@/types/migration"
import { cn } from "@/lib/utils"

interface LiveProgressCardProps {
  job: MigrationJob
  percentage: number
  migratedRows: number
  totalRows: number
  status: MigrationJob["status"]
  errorMessage?: string | null
  className?: string
}

export function LiveProgressCard({
  job,
  percentage,
  migratedRows,
  totalRows,
  status,
  errorMessage,
  className,
}: LiveProgressCardProps) {
  const isRunning = status === "running"
  const isCompleted = status === "completed"
  const isFailed = status === "failed"

  return (
    <Card
      className={cn(
        "border-border/70 bg-card/60 overflow-hidden p-6 shadow-sm backdrop-blur-xs",
        className
      )}
    >
      {/* Top Header: Pipeline Route & Status Badge */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Source Database */}
          <div className="border-border/60 bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-1.5">
            {job.source_db_type && (
              <EngineIcon engine={job.source_db_type} className="h-4 w-4" />
            )}
            <span className="text-foreground text-xs font-semibold">
              {job.source_connection_name || "Source DB"}
            </span>
            <Badge
              variant="outline"
              className="border-border/40 font-mono text-[10px]"
            >
              {job.source_table}
            </Badge>
          </div>

          <ArrowRight className="text-muted-foreground/60 h-4 w-4 shrink-0" />

          {/* Target Database */}
          <div className="border-border/60 bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-1.5">
            {job.target_db_type && (
              <EngineIcon engine={job.target_db_type} className="h-4 w-4" />
            )}
            <span className="text-foreground text-xs font-semibold">
              {job.target_connection_name || "Target DB"}
            </span>
            <Badge
              variant="outline"
              className="border-border/40 font-mono text-[10px]"
            >
              {job.target_table}
            </Badge>
          </div>
        </div>

        <MigrationStatusBadge status={status} />
      </div>

      {/* Progress Metric Numbers */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-foreground font-mono text-3xl font-extrabold tracking-tight">
            {migratedRows.toLocaleString()}
          </span>
          <span className="text-muted-foreground text-sm font-medium">
            / {totalRows > 0 ? totalRows.toLocaleString() : "--"} rows synced
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-foreground font-mono text-2xl font-bold">
            {percentage}%
          </span>
          {isCompleted && <CheckCircle2 className="text-success h-5 w-5" />}
        </div>
      </div>

      {/* Animated Custom Progress Bar */}
      <div className="bg-muted/40 border-border/50 relative mt-3 h-3 w-full overflow-hidden rounded-full border">
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

      {/* Error Message Banner */}
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
    </Card>
  )
}
