import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Ban, CheckCircle2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getMigrationStatusFlags } from "@/lib/migrationStatus"
import type { MigrationJob } from "@/types/migration"

interface MigrationPageHeaderProps {
  jobId: string
  projectSlugOrId: string
  status: MigrationJob["status"]
  sourceName: string
  targetName: string
  sourceTable?: string
  targetTable?: string
  migratedRows: number
  onRefresh: () => void
  onCancelClick: () => void
}

export function MigrationPageHeader({
  jobId,
  projectSlugOrId,
  status,
  sourceName,
  targetName,
  sourceTable,
  targetTable,
  migratedRows,
  onRefresh,
  onCancelClick,
}: MigrationPageHeaderProps) {
  const navigate = useNavigate()
  const { isRunning, isCompleted } = getMigrationStatusFlags(status)

  const returnUrl = projectSlugOrId
    ? `/migration?project=${projectSlugOrId}`
    : "/migration"

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to={returnUrl}>
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
              title="Return to Migrations"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-xl font-bold tracking-tight">
                Live Data Migration
              </h1>
              <Badge variant="outline" className="font-mono text-[10px]">
                {jobId.slice(0, 8)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>

          {isRunning && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onCancelClick}
              className="gap-1.5 text-xs font-semibold shadow-xs"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Cancel Migration</span>
            </Button>
          )}

          {isCompleted && (
            <Button
              size="sm"
              onClick={() => navigate(returnUrl)}
              className="bg-success text-success-foreground hover:bg-success/90 gap-1.5 text-xs font-semibold shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Done (Back to Migrations)</span>
            </Button>
          )}
        </div>
      </div>

      {/* Completion Notification Banner */}
      {isCompleted && (
        <div className="border-success/40 bg-success/10 flex items-center gap-3 rounded-xl border p-3.5 shadow-2xs backdrop-blur-xs">
          <div className="border-success/30 bg-success/20 text-success flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-foreground text-xs font-bold">
              Migration Completed Successfully!
            </p>
            <p className="text-success text-xs">
              All {migratedRows.toLocaleString()} rows copied from{" "}
              <span className="font-semibold">{sourceName}</span>
              {sourceTable && ` (${sourceTable})`} to{" "}
              <span className="font-semibold">{targetName}</span>
              {targetTable && ` (${targetTable})`}.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
