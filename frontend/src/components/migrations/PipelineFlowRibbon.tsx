import { ArrowRight, ShieldCheck, Zap, CheckCircle2 } from "lucide-react"
import { EngineIcon } from "@/components/connections/EngineIcon"
import { Badge } from "@/components/ui/badge"
import type { MigrationJob, MigrationStatus } from "@/types/migration"
import type { DBType } from "@/types"
import { getMigrationStatusFlags } from "@/lib/migrationStatus"
import { cn } from "@/lib/utils"

interface PipelineFlowRibbonProps {
  job: MigrationJob
  status: MigrationStatus
  totalRows: number
  batchSize: number
  latencyMs: number
  sourceName?: string
  targetName?: string
  sourceDatabase?: string
  targetDatabase?: string
  sourceDbType?: DBType
  targetDbType?: DBType
  className?: string
}

export function PipelineFlowRibbon({
  job,
  status,
  totalRows,
  batchSize,
  latencyMs,
  sourceName,
  targetName,
  sourceDatabase,
  targetDatabase,
  sourceDbType,
  targetDbType,
  className,
}: PipelineFlowRibbonProps) {
  const { isRunning, isCompleted, isFailed } = getMigrationStatusFlags(status)

  const effectiveSourceName =
    sourceName || job.source_connection_name || "Source Database"
  const effectiveTargetName =
    targetName || job.target_connection_name || "Destination Database"
  const effectiveSourceType = sourceDbType || job.source_db_type || "postgres"
  const effectiveTargetType = targetDbType || job.target_db_type || "postgres"

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
            {effectiveSourceType ? (
              <EngineIcon engine={effectiveSourceType} className="h-5 w-5" />
            ) : (
              <Zap className="text-primary h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                From (Source)
              </span>
              <Badge
                variant="outline"
                className="px-1.5 py-0 font-mono text-[9px] uppercase"
              >
                {effectiveSourceType}
              </Badge>
            </div>
            <p className="text-foreground truncate text-sm font-semibold">
              {effectiveSourceName}
            </p>
            <p className="text-muted-foreground text-xs">
              {sourceDatabase && (
                <span className="font-mono">{sourceDatabase} • </span>
              )}
              Table:{" "}
              <span className="text-foreground font-mono font-medium">
                {job.source_table}
              </span>
              <span className="text-muted-foreground/60 ml-1.5 font-mono">
                ({totalRows.toLocaleString()} rows)
              </span>
            </p>
          </div>
        </div>

        {/* Transfer Indicator */}
        <div className="flex flex-col items-center justify-center px-2 py-1 md:w-64 md:shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "border-border/60 text-xs font-medium transition-colors",
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
              ? "Transferring Data"
              : isCompleted
                ? "Transfer Complete"
                : isFailed
                  ? "Transfer Stopped"
                  : "Ready"}
          </Badge>

          {/* Flow Arrow */}
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

          <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="text-success h-3 w-3" /> Encrypted
            </span>
            <span>•</span>
            <span>Batch: {batchSize}</span>
            {latencyMs > 0 && (
              <>
                <span>•</span>
                <span>{latencyMs}ms</span>
              </>
            )}
          </div>
        </div>

        {/* Target Database Node */}
        <div className="bg-card/80 border-border/60 flex flex-1 items-center gap-3 rounded-lg border p-3 shadow-2xs">
          <div className="border-border/50 bg-muted/40 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
            {effectiveTargetType ? (
              <EngineIcon engine={effectiveTargetType} className="h-5 w-5" />
            ) : (
              <Zap className="text-primary h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                To (Destination)
              </span>
              <Badge
                variant="outline"
                className="px-1.5 py-0 font-mono text-[9px] uppercase"
              >
                {effectiveTargetType}
              </Badge>
            </div>
            <p className="text-foreground truncate text-sm font-semibold">
              {effectiveTargetName}
            </p>
            <p className="text-muted-foreground text-xs">
              {targetDatabase && (
                <span className="font-mono">{targetDatabase} • </span>
              )}
              Table:{" "}
              <span className="text-foreground font-mono font-medium">
                {job.target_table}
              </span>
              <span className="text-muted-foreground/60 ml-1.5 font-mono">
                ({isCompleted ? "All saved" : "Writing records"})
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
