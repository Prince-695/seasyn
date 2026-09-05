import { useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Ban, CheckCircle2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LiveProgressCard } from "@/components/migrations/LiveProgressCard"
import { ThroughputGauge } from "@/components/migrations/ThroughputGauge"
import { CancelMigrationDialog } from "@/components/migrations/CancelMigrationDialog"
import { EngineIcon } from "@/components/connections/EngineIcon"
import { migrationsApi } from "@/api/migrations"
import { migrationKeys } from "@/lib/queryKeys"
import { useMigrationStream } from "@/hooks/useMigrationStream"
import { useWorkspaceStore } from "@/store/workspaceStore"

export function MigrationLivePage() {
  const { jobId = "" } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeOrg, activeProjectId } = useWorkspaceStore()

  const orgId = activeOrg?.id || ""
  const projectId = activeProjectId || ""

  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  // 1. Fetch initial migration job record from REST API
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

  // 2. Connect to Server-Sent Events (SSE) Live Telemetry Stream
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

  // 3. Cancel Mutation
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

  if (isJobLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border-border/70 bg-card/60 text-muted-foreground p-12 text-center text-xs">
          Loading pipeline telemetry stream...
        </Card>
      </div>
    )
  }

  if (jobError || !job) {
    return (
      <div className="mx-auto max-w-md space-y-4 pt-12 text-center">
        <h2 className="text-foreground text-lg font-bold">
          Migration Pipeline Not Found
        </h2>
        <p className="text-muted-foreground text-xs">
          The requested migration pipeline does not exist or has been deleted.
        </p>
        <Link to="/migration">
          <Button size="sm" className="mt-2 text-xs">
            Return to Migration Studio
          </Button>
        </Link>
      </div>
    )
  }

  const isRunning = status === "running"
  const isCompleted = status === "completed"

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/migration">
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-xl font-bold tracking-tight">
                Live Migration Telemetry
              </h1>
              <Badge variant="outline" className="font-mono text-[10px]">
                {job.id}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-xs">
              {job.source_table} ➔ {job.target_table}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
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
              <span>Cancel Pipeline</span>
            </Button>
          )}

          {isCompleted && (
            <Button
              size="sm"
              onClick={() => navigate("/migration")}
              className="bg-success text-success-foreground hover:bg-success/90 gap-1.5 text-xs font-semibold shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Finished (Return to Studio)</span>
            </Button>
          )}
        </div>
      </div>

      {/* Completion Celebration Callout Banner */}
      {isCompleted && (
        <Card className="border-success/40 bg-success/10 p-4 shadow-xs backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="border-success/30 bg-success/20 text-success flex h-9 w-9 items-center justify-center rounded-xl border">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-foreground text-xs font-bold">
                Pipeline Successfully Completed!
              </p>
              <p className="text-success font-mono text-[11px]">
                All {migratedRows.toLocaleString()} rows were streamed and
                verified from {job.source_table} to {job.target_table}.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Primary Animated Live Progress Card */}
      <LiveProgressCard
        job={job}
        percentage={percentage}
        migratedRows={migratedRows}
        totalRows={totalRows}
        status={status}
        errorMessage={errorMessage}
      />

      {/* Live Telemetry Speedometer & Network Throughput Gauge */}
      <ThroughputGauge
        rowsPerSecond={rowsPerSecond}
        status={status}
        etaFormatted={etaFormatted}
        isConnected={isConnected}
      />

      {/* Detailed Endpoints Configuration Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Source Endpoint Card */}
        <Card className="border-border/70 bg-card/60 p-4 shadow-xs backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            {job.source_db_type && (
              <div className="border-border/60 bg-muted/30 flex h-8 w-8 items-center justify-center rounded-lg border">
                <EngineIcon engine={job.source_db_type} className="h-4 w-4" />
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                Source Connection
              </p>
              <p className="text-foreground text-xs font-semibold">
                {job.source_connection_name || "Source Database"}
              </p>
            </div>
          </div>

          <div className="border-border/50 bg-muted/20 mt-3 space-y-1 rounded-lg border p-2.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Table:</span>
              <span className="text-foreground font-semibold">
                {job.source_table}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Engine:</span>
              <span className="text-foreground uppercase">
                {job.source_db_type || "Relational"}
              </span>
            </div>
          </div>
        </Card>

        {/* Target Endpoint Card */}
        <Card className="border-border/70 bg-card/60 p-4 shadow-xs backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            {job.target_db_type && (
              <div className="border-border/60 bg-muted/30 flex h-8 w-8 items-center justify-center rounded-lg border">
                <EngineIcon engine={job.target_db_type} className="h-4 w-4" />
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                Target Connection
              </p>
              <p className="text-foreground text-xs font-semibold">
                {job.target_connection_name || "Target Database"}
              </p>
            </div>
          </div>

          <div className="border-border/50 bg-muted/20 mt-3 space-y-1 rounded-lg border p-2.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Table:</span>
              <span className="text-foreground font-semibold">
                {job.target_table}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Engine:</span>
              <span className="text-foreground uppercase">
                {job.target_db_type || "Relational"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Cancel Confirmation Modal */}
      <CancelMigrationDialog
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        jobName={`${job.source_table} ➔ ${job.target_table}`}
        isCancelling={cancelMutation.isPending}
        onConfirm={async () => {
          await cancelMutation.mutateAsync()
        }}
      />
    </div>
  )
}
