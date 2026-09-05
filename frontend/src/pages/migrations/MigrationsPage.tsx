import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Activity, RefreshCw, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MigrationHistoryTable } from "@/components/migrations/MigrationHistoryTable"
import { migrationsApi } from "@/api/migrations"
import { migrationKeys } from "@/lib/queryKeys"
import { useWorkspaceStore } from "@/store/workspaceStore"

export function MigrationsPage() {
  const queryClient = useQueryClient()
  const { activeOrg, activeProjectId } = useWorkspaceStore()

  const orgId = activeOrg?.id || ""
  const projectId = activeProjectId || ""

  // Fetch all migration pipelines for this project
  const {
    data: jobs = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: migrationKeys.list(orgId, projectId),
    queryFn: async () => {
      if (!orgId || !projectId) return []
      const res = await migrationsApi.listMigrations(orgId, projectId)
      return res.data || []
    },
    enabled: !!orgId && !!projectId,
    refetchInterval: 10000, // Background poll every 10s for updates
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
    },
  })

  // Metric aggregates
  const metrics = useMemo(() => {
    const total = jobs.length
    const running = jobs.filter((j) => j.status === "running").length
    const completed = jobs.filter((j) => j.status === "completed").length
    const totalRowsSynced = jobs.reduce(
      (acc, j) => acc + (j.migrated_rows || 0),
      0
    )

    return { total, running, completed, totalRowsSynced }
  }, [jobs])

  const activeRunningJob = jobs.find((j) => j.status === "running")

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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
            onClick={() => refetch()}
            className="gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>

          <Link to="/migration/new">
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

            <Link to={`/migration/${activeRunningJob.id}`}>
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

      {/* Studio Overview Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/70 bg-card/60 p-4 shadow-xs backdrop-blur-xs">
          <p className="text-muted-foreground text-xs font-medium">
            Total Pipelines
          </p>
          <p className="text-foreground mt-1 font-mono text-2xl font-bold tracking-tight">
            {metrics.total}
          </p>
        </Card>

        <Card className="border-border/70 bg-card/60 p-4 shadow-xs backdrop-blur-xs">
          <p className="text-muted-foreground text-xs font-medium">
            Active Streaming
          </p>
          <p className="text-info mt-1 font-mono text-2xl font-bold tracking-tight">
            {metrics.running}
          </p>
        </Card>

        <Card className="border-border/70 bg-card/60 p-4 shadow-xs backdrop-blur-xs">
          <p className="text-muted-foreground text-xs font-medium">
            Completed Pipelines
          </p>
          <p className="text-success mt-1 font-mono text-2xl font-bold tracking-tight">
            {metrics.completed}
          </p>
        </Card>

        <Card className="border-border/70 bg-card/60 p-4 shadow-xs backdrop-blur-xs">
          <p className="text-muted-foreground text-xs font-medium">
            Total Records Synced
          </p>
          <p className="text-foreground mt-1 font-mono text-2xl font-bold tracking-tight">
            {metrics.totalRowsSynced.toLocaleString()}
          </p>
        </Card>
      </div>

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
          onCancelJob={async (jobId) => {
            await cancelMutation.mutateAsync(jobId)
          }}
          isCancellingJob={cancelMutation.isPending}
        />
      </div>
    </div>
  )
}
