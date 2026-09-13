import { useState, useMemo } from "react"
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Ban, CheckCircle2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LiveProgressCard } from "@/components/migrations/LiveProgressCard"
import { PipelineFlowRibbon } from "@/components/migrations/PipelineFlowRibbon"
import { ResourceMetricsGrid } from "@/components/migrations/ResourceMetricsGrid"
import { MigrationTerminalLog } from "@/components/migrations/MigrationTerminalLog"
import { CancelMigrationDialog } from "@/components/migrations/CancelMigrationDialog"
import { migrationsApi } from "@/api/migrations"
import { projectsApi } from "@/api/projects"
import { connectionKeys, migrationKeys } from "@/lib/queryKeys"
import { useMigrationStream } from "@/hooks/useMigrationStream"
import { useActiveProject } from "@/hooks/useActiveProject"
import { calculateMigrationResourceStats } from "@/lib/migrationMetrics"
import { getMigrationStatusFlags } from "@/lib/migrationStatus"

export function MigrationLivePage() {
  const params = useParams<{
    jobId?: string
    projectSlug?: string
    projectId?: string
  }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const jobId = params.jobId || ""
  const projectParam =
    params.projectSlug ||
    params.projectId ||
    searchParams.get("project") ||
    searchParams.get("projectId") ||
    ""

  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  // Resolves the active project from URL param, store, or first-project fallback
  const {
    projectId,
    projectSlugOrId,
    orgId,
    isLoading: isProjectsLoading,
  } = useActiveProject(projectParam)

  // 2. Fetch initial migration job record from REST API
  const {
    data: job,
    isLoading: isJobLoading,
    error: jobError,
    refetch,
  } = useQuery({
    queryKey: migrationKeys.detail(orgId, projectId, jobId),
    queryFn: async () => {
      if (!orgId || !projectId || !jobId) return null
      const res = await migrationsApi.getMigration(orgId, projectId, jobId)
      return res.data || null
    },
    enabled: !!orgId && !!projectId && !!jobId,
  })

  // Fetch connections to resolve user-friendly database and connection names
  const { data: connections = [] } = useQuery({
    queryKey: connectionKeys.list(orgId, projectId),
    queryFn: async () => {
      if (!orgId || !projectId) return []
      const res = await projectsApi.listConnections(orgId, projectId)
      return res.data || []
    },
    enabled: !!orgId && !!projectId,
  })

  const sourceConn = useMemo(
    () => connections.find((c) => c.id === job?.source_connection_id),
    [connections, job?.source_connection_id]
  )
  const targetConn = useMemo(
    () => connections.find((c) => c.id === job?.target_connection_id),
    [connections, job?.target_connection_id]
  )

  const sourceName =
    sourceConn?.name || job?.source_connection_name || "Source Database"
  const targetName =
    targetConn?.name || job?.target_connection_name || "Destination Database"
  const sourceDatabase = sourceConn?.database
  const targetDatabase = targetConn?.database
  const sourceDbType = sourceConn?.db_type || job?.source_db_type
  const targetDbType = targetConn?.db_type || job?.target_db_type

  // 3. Connect to Server-Sent Events (SSE) Live Telemetry Stream
  const {
    status,
    totalRows,
    migratedRows,
    percentage,
    rowsPerSecond,
    etaFormatted,
    errorMessage,
    isConnected,
  } = useMigrationStream({
    orgId,
    projectId,
    jobId,
    initialStatus: job?.status,
    initialTotalRows: job?.total_rows,
    initialMigratedRows: job?.migrated_rows,
    onComplete: () => {
      queryClient.invalidateQueries({
        queryKey: migrationKeys.list(orgId, projectId),
      })
      queryClient.invalidateQueries({
        queryKey: migrationKeys.detail(orgId, projectId, jobId),
      })
    },
  })

  // 4. Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !projectId || !jobId) return
      await migrationsApi.cancelMigration(orgId, projectId, jobId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: migrationKeys.list(orgId, projectId),
      })
      queryClient.invalidateQueries({
        queryKey: migrationKeys.detail(orgId, projectId, jobId),
      })
      refetch()
    },
  })

  // 5. Calculate storage, memory, and telemetry metrics
  const stats = useMemo(() => {
    if (!job) return null
    return calculateMigrationResourceStats(
      job,
      totalRows,
      migratedRows,
      rowsPerSecond,
      isConnected
    )
  }, [job, totalRows, migratedRows, rowsPerSecond, isConnected])

  if (!orgId) {
    return (
      <div className="mx-auto max-w-md space-y-4 pt-12 text-center">
        <h2 className="text-foreground text-lg font-bold">
          No Organization Selected
        </h2>
        <p className="text-muted-foreground text-xs">
          Please select or create an organization from the workspace switcher to
          view migration telemetry.
        </p>
        <Link to="/dashboard">
          <Button size="sm" className="mt-2 text-xs">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  if ((isProjectsLoading && !projectId) || isJobLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="border-border/70 bg-card/60 text-muted-foreground flex min-h-75 flex-col items-center justify-center gap-3 rounded-xl border p-12 text-center text-xs">
          <RefreshCw className="text-primary h-6 w-6 animate-spin" />
          <span>Connecting to live migration progress...</span>
        </div>
      </div>
    )
  }

  if (jobError || !job) {
    return (
      <div className="mx-auto max-w-md space-y-4 pt-12 text-center">
        <h2 className="text-foreground text-lg font-bold">
          Migration Not Found
        </h2>
        <p className="text-muted-foreground text-xs">
          The requested migration does not exist or has been deleted.
        </p>
        <Link
          to={
            projectSlugOrId
              ? `/migration?project=${projectSlugOrId}`
              : "/migration"
          }
        >
          <Button size="sm" className="mt-2 text-xs">
            Return to Migrations
          </Button>
        </Link>
      </div>
    )
  }

  const { isRunning, isCompleted } = getMigrationStatusFlags(status)

  return (
    <div className="w-full space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={
              projectSlugOrId
                ? `/migration?project=${projectSlugOrId}`
                : "/migration"
            }
          >
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
                {job.id.slice(0, 8)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              <span className="text-foreground font-semibold">
                {sourceName}
              </span>
              <span className="font-mono"> ({job.source_table})</span>
              <span className="text-muted-foreground mx-1.5">➔</span>
              <span className="text-foreground font-semibold">
                {targetName}
              </span>
              <span className="font-mono"> ({job.target_table})</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>

          {isRunning && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="gap-1.5 text-xs font-semibold shadow-xs"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Cancel Migration</span>
            </Button>
          )}

          {isCompleted && (
            <Button
              size="sm"
              onClick={() =>
                navigate(
                  projectSlugOrId
                    ? `/migration?project=${projectSlugOrId}`
                    : "/migration"
                )
              }
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
              <span className="font-semibold">{sourceName}</span> (
              {job.source_table}) to{" "}
              <span className="font-semibold">{targetName}</span> (
              {job.target_table}).
            </p>
          </div>
        </div>
      )}

      {/* 1. Visual Flow Ribbon */}
      <PipelineFlowRibbon
        job={job}
        status={status}
        totalRows={totalRows}
        batchSize={job.batch_size || 500}
        latencyMs={stats?.latencyMs ?? 16}
        sourceName={sourceName}
        targetName={targetName}
        sourceDatabase={sourceDatabase}
        targetDatabase={targetDatabase}
        sourceDbType={sourceDbType}
        targetDbType={targetDbType}
      />

      {/* 2. Progress Card */}
      {stats && (
        <LiveProgressCard
          job={job}
          percentage={percentage}
          migratedRows={migratedRows}
          totalRows={totalRows}
          status={status}
          rowsPerSecond={rowsPerSecond}
          etaFormatted={etaFormatted}
          stats={stats}
          sourceName={sourceName}
          targetName={targetName}
          errorMessage={errorMessage}
        />
      )}

      {/* 3. Performance & System Details */}
      {stats && <ResourceMetricsGrid stats={stats} isConnected={isConnected} />}

      {/* 4. Activity Log */}
      <MigrationTerminalLog
        job={job}
        status={status}
        totalRows={totalRows}
        migratedRows={migratedRows}
        sourceName={sourceName}
        targetName={targetName}
        errorMessage={errorMessage}
      />

      {/* Cancel Confirmation Modal */}
      <CancelMigrationDialog
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        jobName={`${sourceName} (${job.source_table}) ➔ ${targetName} (${job.target_table})`}
        isCancelling={cancelMutation.isPending}
        onConfirm={async () => {
          try {
            await cancelMutation.mutateAsync()
          } catch {
            // Error is reflected in cancelMutation.isError
          }
        }}
      />
    </div>
  )
}
