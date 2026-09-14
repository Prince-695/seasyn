import { useMemo } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus,
  Activity,
  RefreshCw,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MigrationHistoryTable } from "@/components/migrations/MigrationHistoryTable"
import { migrationsApi } from "@/api/migrations"
import { analyticsApi } from "@/api/analytics"
import { migrationKeys, analyticsKeys } from "@/lib/queryKeys"
import { useActiveProject } from "@/hooks/useActiveProject"

export function MigrationsPage() {
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const projectParam =
    searchParams.get("project") || searchParams.get("projectId") || ""

  // Resolves active project from URL param, store, or first-project fallback
  const { projectId, projectSlugOrId, orgId } = useActiveProject(projectParam)

  // Fetch all migration pipelines for this project
  const {
    data: jobs = [],
    isLoading,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: migrationKeys.list(orgId, projectId),
    queryFn: async () => {
      if (!orgId || !projectId) return []
      const res = await migrationsApi.listMigrations(orgId, projectId)
      return res.data || []
    },
    enabled: !!orgId && !!projectId,
    // Only poll while at least one job is actively running
    refetchInterval: (query) => {
      const data = query.state.data
      if (Array.isArray(data) && data.some((j) => j.status === "running")) {
        return 10_000
      }
      return false
    },
  })

  // Fetch migration analytics from backend (removes manual frontend calculations)
  const { data: migrationAnalytics, refetch: refetchAnalytics } = useQuery({
    queryKey: analyticsKeys.migration(orgId, projectId),
    queryFn: async () => {
      if (!orgId || !projectId) return null
      const res = await analyticsApi.getMigrationAnalytics(orgId, projectId)
      return res.data || null
    },
    enabled: !!orgId && !!projectId,
  })

  // Cancel running job mutation
  const cancelMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await migrationsApi.cancelMigration(orgId, projectId, jobId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: migrationKeys.list(orgId, projectId),
      })
      queryClient.invalidateQueries({
        queryKey: analyticsKeys.migration(orgId, projectId),
      })
    },
  })

  // Backend-derived metric aggregates
  const summary = migrationAnalytics?.summary
  const activeCount = useMemo(
    () => jobs.filter((j) => j.status === "running").length,
    [jobs]
  )
  const totalPipelines = summary?.total_pipelines ?? jobs.length
  const totalSynced = summary?.total_rows_synced ?? 0
  const avgSpeed = summary?.avg_throughput_rps
    ? `${Math.round(summary.avg_throughput_rps)} rows/sec`
    : "--"
  const avgDuration = summary?.avg_duration_seconds
    ? `${Math.round(summary.avg_duration_seconds)}s`
    : "--"

  const activeRunningJob = jobs.find((j) => j.status === "running")

  return (
    <div className="w-full space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-xl font-bold tracking-tight">
              Migration Studio
            </h1>
            <div className="border-primary/30 bg-primary/10 text-primary flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold">
              <Zap className="h-3 w-3" />
              <span>Real-Time CDC</span>
            </div>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Orchestrate zero-downtime, cross-database data streaming with
            real-time SSE telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchJobs()
              refetchAnalytics()
            }}
            className="gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>

          <Link
            to={`/migration/new${projectSlugOrId ? `?project=${projectSlugOrId}` : ""}`}
          >
            <Button
              size="sm"
              className="gap-1.5 text-xs font-semibold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Migration</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Running Pipeline Banner */}
      {activeRunningJob && (
        <Card className="border-info/40 bg-info/10 relative overflow-hidden p-4 shadow-sm backdrop-blur-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="bg-info absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                <span className="bg-info relative inline-flex h-3 w-3 rounded-full"></span>
              </div>
              <div>
                <p className="text-foreground text-xs font-bold">
                  Active Live Migration in Progress
                </p>
                <p className="text-info font-mono text-[11px]">
                  {activeRunningJob.source_table} ➔{" "}
                  {activeRunningJob.target_table} (
                  {activeRunningJob.migrated_rows?.toLocaleString()} /{" "}
                  {activeRunningJob.total_rows > 0
                    ? activeRunningJob.total_rows.toLocaleString()
                    : "--"}{" "}
                  rows synced)
                </p>
              </div>
            </div>

            <Link
              to={`/migration/${activeRunningJob.id}${projectSlugOrId ? `?project=${projectSlugOrId}` : ""}`}
            >
              <Button
                size="sm"
                className="bg-info text-info-foreground hover:bg-info/90 gap-1.5 text-xs font-semibold shadow-xs"
              >
                <Activity className="h-3.5 w-3.5 animate-spin" />
                <span>Open Live Telemetry</span>
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Studio Overview Metrics (Powered by backend analytics summary) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/70 bg-card/60 p-4 shadow-xs backdrop-blur-xs">
          <p className="text-muted-foreground text-xs font-medium">
            Total Pipelines
          </p>
          <p className="text-foreground mt-1 font-mono text-2xl font-bold tracking-tight">
            {totalPipelines}
          </p>
        </Card>

        <Card className="border-border/70 bg-card/60 p-4 shadow-xs backdrop-blur-xs">
          <p className="text-muted-foreground text-xs font-medium">
            Active Streaming
          </p>
          <p className="text-info mt-1 font-mono text-2xl font-bold tracking-tight">
            {activeCount}
          </p>
        </Card>

        <Card className="border-border/70 bg-card/60 p-4 shadow-xs backdrop-blur-xs">
          <p className="text-muted-foreground text-xs font-medium">
            Average Speed
          </p>
          <p className="text-foreground mt-1 font-mono text-xl font-bold tracking-tight">
            {avgSpeed}
          </p>
        </Card>

        <Card className="border-border/70 bg-card/60 p-4 shadow-xs backdrop-blur-xs">
          <p className="text-muted-foreground text-xs font-medium">
            Total Records Synced
          </p>
          <p className="text-foreground mt-1 font-mono text-2xl font-bold tracking-tight">
            {totalSynced.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Migration Performance & Reliability Intelligence */}
      {migrationAnalytics && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Duration Distribution */}
          <Card className="border-border/70 bg-card/60 p-4 shadow-xs backdrop-blur-xs">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="text-foreground text-sm font-bold tracking-tight sm:text-base">
                  Migration Time Ranges
                </h3>
              </div>
              <span className="text-muted-foreground text-xs">
                {avgDuration !== "--" ? `Avg ${avgDuration}` : "Completed jobs"}
              </span>
            </div>

            {migrationAnalytics.duration_distribution &&
            migrationAnalytics.duration_distribution.some(
              (b) => b.count > 0
            ) ? (
              <div className="space-y-2.5">
                {migrationAnalytics.duration_distribution.map((b) => (
                  <div key={b.bucket} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        {b.bucket}
                      </span>
                      <span className="text-foreground font-mono text-[11px]">
                        {b.count} ({Math.round(b.percentage)}%)
                      </span>
                    </div>
                    <div className="bg-muted/40 h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(b.percentage, b.count > 0 ? 3 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-6 text-center text-xs">
                No completed migrations yet to calculate duration ranges.
              </p>
            )}
          </Card>

          {/* Error & Reliability Intelligence */}
          <Card className="border-border/70 bg-card/60 p-4 shadow-xs backdrop-blur-xs">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-warning/10 text-warning flex h-7 w-7 items-center justify-center rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <h3 className="text-foreground text-sm font-bold tracking-tight sm:text-base">
                  Recent Issues & Failure Reasons
                </h3>
              </div>
              <span className="text-muted-foreground text-xs">
                Failure analysis
              </span>
            </div>

            {migrationAnalytics.error_breakdown &&
            migrationAnalytics.error_breakdown.length > 0 ? (
              <div className="space-y-2">
                {migrationAnalytics.error_breakdown.map((err, idx) => (
                  <div
                    key={idx}
                    className="border-destructive/30 bg-destructive/5 flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                  >
                    <span className="text-foreground line-clamp-1 max-w-[80%] font-mono text-[11px]">
                      {err.error_type}
                    </span>
                    <Badge
                      variant="destructive"
                      className="font-mono text-[10px]"
                    >
                      {err.count} {err.count === 1 ? "time" : "times"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="bg-success/10 text-success mb-2 flex h-8 w-8 items-center justify-center rounded-full">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-foreground text-xs font-semibold">
                  Zero Failure Incidents
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  All completed migration pipelines ran cleanly without errors.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Migration Pipelines History Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-sm font-semibold">
            Pipeline History & Active Telemetry
          </h2>
        </div>

        <MigrationHistoryTable
          jobs={jobs}
          isLoading={isLoading}
          projectSlugOrId={projectSlugOrId}
          onCancelJob={async (jobId) => {
            await cancelMutation.mutateAsync(jobId)
          }}
          isCancellingJob={cancelMutation.isPending}
        />
      </div>
    </div>
  )
}
