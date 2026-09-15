import { useState, useMemo } from "react"
import { useParams, useSearchParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LiveProgressCard } from "@/components/migrations/LiveProgressCard"
import { PipelineFlowRibbon } from "@/components/migrations/PipelineFlowRibbon"
import { ResourceMetricsGrid } from "@/components/migrations/ResourceMetricsGrid"
import { MigrationTerminalLog } from "@/components/migrations/MigrationTerminalLog"
import { CancelMigrationDialog } from "@/components/migrations/CancelMigrationDialog"
import { MigrationPageHeader } from "@/components/migrations/MigrationPageHeader"
import { migrationsApi } from "@/api/migrations"
import { projectsApi } from "@/api/projects"
import { connectionKeys, migrationKeys } from "@/lib/queryKeys"
import { useMigrationStream } from "@/hooks/useMigrationStream"
import { useActiveProject } from "@/hooks/useActiveProject"
import { calculateMigrationResourceStats } from "@/lib/migrationMetrics"

export function MigrationLivePage() {
  const params = useParams<{
    jobId?: string
    projectSlug?: string
    projectId?: string
  }>()
  const [searchParams] = useSearchParams()
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

  // 2. Fetch initial migration job record from REST API with active polling fallback
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
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data || data.status === "pending" || data.status === "running") {
        return 1500
      }
      return false
    },
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
    bandwidthFormatted,
    bytesTransferredFormatted,
    batchLatencyMs,
    liveLogs,
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
    const baseStats = calculateMigrationResourceStats(
      job,
      totalRows,
      migratedRows,
      rowsPerSecond,
      isConnected
    )
    if (bytesTransferredFormatted) {
      baseStats.formattedMigratedBytes = bytesTransferredFormatted
    }
    if (bandwidthFormatted) {
      baseStats.transferRateFormatted = bandwidthFormatted
    }
    if (batchLatencyMs !== undefined && batchLatencyMs > 0) {
      baseStats.latencyMs = batchLatencyMs
    }
    return baseStats
  }, [
    job,
    totalRows,
    migratedRows,
    rowsPerSecond,
    isConnected,
    bytesTransferredFormatted,
    bandwidthFormatted,
    batchLatencyMs,
  ])

  if (!orgId) {
    return (
      <div className="mx-auto max-w-md space-y-4 pt-12 text-center">
        <h2 className="text-foreground text-lg font-semibold">
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
        <h2 className="text-foreground text-lg font-semibold">
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

  return (
    <div className="w-full space-y-5">
      {/* Top Header & Completion Notification Banner */}
      <MigrationPageHeader
        jobId={job.id}
        projectSlugOrId={projectSlugOrId}
        status={status}
        sourceName={sourceName}
        targetName={targetName}
        sourceTable={job.source_table}
        targetTable={job.target_table}
        migratedRows={migratedRows}
        onRefresh={() => refetch()}
        onCancelClick={() => setCancelModalOpen(true)}
      />

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

      {/* 3. Live Streaming Activity Log */}
      <MigrationTerminalLog
        job={job}
        status={status}
        totalRows={totalRows}
        migratedRows={migratedRows}
        sourceName={sourceName}
        targetName={targetName}
        errorMessage={errorMessage}
        liveLogs={liveLogs}
      />

      {/* 4. Telemetry Diagnostics & Resource Details */}
      {stats && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase">
              Diagnostic & Telemetry Details
            </span>
          </div>
          <ResourceMetricsGrid stats={stats} isConnected={isConnected} />
        </div>
      )}

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

export default MigrationLivePage
