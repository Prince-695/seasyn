import { ArrowRight, ShieldCheck, Zap, CheckCircle2 } from "lucide-react"
import { EngineIcon } from "@/components/connections/EngineIcon"
import { Badge } from "@/components/ui/badge"
import type { MigrationJob, MigrationStatus } from "@/types/migration"
import { getMigrationStatusFlags } from "@/lib/migrationStatus"
import { cn } from "@/lib/utils"

interface PipelineFlowRibbonProps {
  job: MigrationJob
  status: MigrationStatus
  totalRows: number
  batchSize: number
  latencyMs: number
  className?: string
}

export function PipelineFlowRibbon({
  job,
  status,
  totalRows,
  batchSize,
  latencyMs,
  className,
}: PipelineFlowRibbonProps) {
  const { isRunning, isCompleted, isFailed } = getMigrationStatusFlags(status)

  return (
    <div
      className={cn(
        "border-border/60 bg-muted/20 relative overflow-hidden rounded-xl border p-4 backdrop-blur-xs",
        className
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Source Database Node */}
        <div className="bg-card/80 border-border/60 flex flex-1 items-center gap-3 rounded-lg border p-3 shadow-2xs">
          <div className="border-border/50 bg-muted/40 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
            {job.source_db_type ? (
              <EngineIcon engine={job.source_db_type} className="h-5 w-5" />
            ) : (
              <Zap className="text-primary h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Source Endpoint
              </span>
              <Badge
                variant="outline"
                className="px-1.5 py-0 font-mono text-[9px]"
              >
                {job.source_db_type || "RELATIONAL"}
              </Badge>
            </div>
            <p className="text-foreground truncate text-sm font-semibold">
              {job.source_connection_name || "Source Database"}
            </p>
            <p className="text-muted-foreground font-mono text-xs">
              Table:{" "}
              <span className="text-foreground font-medium">
                {job.source_table}
              </span>
              <span className="text-muted-foreground/60 ml-2">
                ({totalRows.toLocaleString()} rows)
              </span>
            </p>
          </div>
        </div>

        {/* Transit Streaming Conduit */}
        <div className="flex flex-col items-center justify-center px-2 py-1 md:w-64 md:shrink-0">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border-border/60 font-mono text-[10px] font-medium transition-colors",
                isRunning && "border-primary/40 bg-primary/10 text-primary",
                isCompleted && "border-success/40 bg-success/10 text-success",
                isFailed &&
                  "border-destructive/40 bg-destructive/10 text-destructive"
              )}
            >
              {isRunning ? (
                <span className="mr-1.5 flex h-2 w-2">
                  <span className="bg-primary absolute inline-flex h-2 w-2 animate-ping rounded-full opacity-75" />
                  <span className="bg-primary relative inline-flex h-2 w-2 rounded-full" />
                </span>
              ) : isCompleted ? (
                <CheckCircle2 className="text-success mr-1 h-3 w-3" />
              ) : null}
              {isRunning
                ? "Streaming Active"
                : isCompleted
                  ? "Conduit Verified"
                  : isFailed
                    ? "Conduit Halted"
                    : "Conduit Standby"}
            </Badge>
          </div>

          {/* Flow Beam Indicator */}
          <div className="relative my-2 flex w-full items-center justify-center">
            <div className="border-border/50 bg-border/40 h-0.5 w-full rounded-full" />
            <div
              className={cn(
                "absolute h-1 rounded-full transition-all",
                isRunning
                  ? "from-primary/20 via-primary to-primary/20 w-3/4 animate-pulse bg-linear-to-r"
                  : isCompleted
                    ? "bg-success/50 w-full"
                    : "w-0"
              )}
            />
            <div className="bg-card border-border/70 text-muted-foreground absolute rounded-full border p-1 shadow-2xs">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="text-muted-foreground flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1 font-mono">
              <ShieldCheck className="text-success h-3 w-3" /> TLS
            </span>
            <span>•</span>
            <span className="font-mono">Batch: {batchSize}</span>
            <span>•</span>
            <span className="font-mono">
              {latencyMs > 0 ? `${latencyMs}ms` : "0ms"}
            </span>
          </div>
        </div>

        {/* Target Database Node */}
        <div className="bg-card/80 border-border/60 flex flex-1 items-center gap-3 rounded-lg border p-3 shadow-2xs">
          <div className="border-border/50 bg-muted/40 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
            {job.target_db_type ? (
              <EngineIcon engine={job.target_db_type} className="h-5 w-5" />
            ) : (
              <Zap className="text-primary h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Target Endpoint
              </span>
              <Badge
                variant="outline"
                className="px-1.5 py-0 font-mono text-[9px]"
              >
                {job.target_db_type || "RELATIONAL"}
              </Badge>
            </div>
            <p className="text-foreground truncate text-sm font-semibold">
              {job.target_connection_name || "Target Database"}
            </p>
            <p className="text-muted-foreground font-mono text-xs">
              Table:{" "}
              <span className="text-foreground font-medium">
                {job.target_table}
              </span>
              <span className="text-muted-foreground/60 ml-2">
                ({isCompleted ? "Committed" : "Syncing"})
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
