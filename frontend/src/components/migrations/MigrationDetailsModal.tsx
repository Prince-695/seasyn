import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { MigrationStatusBadge } from "./MigrationStatusBadge"
import { EngineIcon } from "@/components/connections/EngineIcon"
import type { MigrationJob } from "@/types/migration"

interface MigrationDetailsModalProps {
  job: MigrationJob | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MigrationDetailsModal({
  job,
  open,
  onOpenChange,
}: MigrationDetailsModalProps) {
  if (!job) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/80 bg-card max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="text-foreground text-base font-semibold">
              Migration Pipeline Audit Details
            </DialogTitle>
            <MigrationStatusBadge status={job.status} />
          </div>
          <DialogDescription className="text-muted-foreground font-mono text-xs">
            Job ID: {job.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          {/* Pipeline Endpoints */}
          <div className="border-border/60 bg-muted/20 grid grid-cols-2 gap-3 rounded-xl border p-3.5">
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                Source Engine
              </p>
              <div className="text-foreground mt-1 flex items-center gap-1.5 font-semibold">
                {job.source_db_type && (
                  <EngineIcon engine={job.source_db_type} className="h-4 w-4" />
                )}
                <span>{job.source_connection_name || "Source Connection"}</span>
              </div>
              <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                Table: {job.source_table}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                Target Engine
              </p>
              <div className="text-foreground mt-1 flex items-center gap-1.5 font-semibold">
                {job.target_db_type && (
                  <EngineIcon engine={job.target_db_type} className="h-4 w-4" />
                )}
                <span>{job.target_connection_name || "Target Connection"}</span>
              </div>
              <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                Table: {job.target_table}
              </p>
            </div>
          </div>

          {/* Transfer Metrics */}
          <div className="border-border/60 bg-muted/20 grid grid-cols-3 gap-3 rounded-xl border p-3.5">
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                Rows Migrated
              </p>
              <p className="text-foreground mt-1 font-mono text-sm font-bold">
                {job.migrated_rows?.toLocaleString()} /{" "}
                {job.total_rows?.toLocaleString() || "--"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                Progress
              </p>
              <p className="text-foreground mt-1 font-mono text-sm font-bold">
                {job.percentage}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                Batch Size
              </p>
              <p className="text-foreground mt-1 font-mono text-sm font-bold">
                {job.batch_size}
              </p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-border/60 bg-muted/20 space-y-1.5 rounded-xl border p-3.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="text-foreground">
                {new Date(job.created_at).toLocaleString()}
              </span>
            </div>
            {job.started_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started:</span>
                <span className="text-foreground">
                  {new Date(job.started_at).toLocaleString()}
                </span>
              </div>
            )}
            {job.completed_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span className="text-foreground">
                  {new Date(job.completed_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Failure Error Message */}
          {job.error_message && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border p-3.5">
              <p className="mb-1 text-xs font-semibold">
                Execution Failure Error Log
              </p>
              <p className="font-mono text-[11px] leading-relaxed break-all">
                {job.error_message}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
