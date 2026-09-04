import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { Activity, ArrowRight, Search, Ban, Info, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MigrationStatusBadge } from "./MigrationStatusBadge"
import { EngineIcon } from "@/components/connections/EngineIcon"
import { CancelMigrationDialog } from "./CancelMigrationDialog"
import { MigrationDetailsModal } from "./MigrationDetailsModal"
import type { MigrationJob, MigrationStatus } from "@/types/migration"
import { cn } from "@/lib/utils"

interface MigrationHistoryTableProps {
  jobs: MigrationJob[]
  isLoading?: boolean
  onCancelJob?: (jobId: string) => Promise<void>
  isCancellingJob?: boolean
  className?: string
}

type FilterTab = "all" | MigrationStatus

export function MigrationHistoryTable({
  jobs,
  isLoading = false,
  onCancelJob,
  isCancellingJob = false,
  className,
}: MigrationHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<FilterTab>("all")

  // Modals state
  const [jobToCancel, setJobToCancel] = useState<MigrationJob | null>(null)
  const [selectedJobForDetails, setSelectedJobForDetails] =
    useState<MigrationJob | null>(null)

  // Filtered list
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Status filter
      if (selectedStatus !== "all" && job.status !== selectedStatus) {
        return false
      }

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchSourceTable = job.source_table?.toLowerCase().includes(term)
        const matchTargetTable = job.target_table?.toLowerCase().includes(term)
        const matchSourceConn = job.source_connection_name
          ?.toLowerCase()
          .includes(term)
        const matchTargetConn = job.target_connection_name
          ?.toLowerCase()
          .includes(term)
        const matchId = job.id?.toLowerCase().includes(term)
        return (
          matchSourceTable ||
          matchTargetTable ||
          matchSourceConn ||
          matchTargetConn ||
          matchId
        )
      }

      return true
    })
  }, [jobs, selectedStatus, searchTerm])

  const statusCounts = useMemo(() => {
    return {
      all: jobs.length,
      running: jobs.filter((j) => j.status === "running").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed").length,
      cancelled: jobs.filter((j) => j.status === "cancelled").length,
    }
  }, [jobs])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table Filter Controls Strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Tabs */}
        <div className="border-border/60 bg-muted/20 flex flex-wrap items-center gap-1 rounded-xl border p-1">
          {(
            ["all", "running", "completed", "failed", "cancelled"] as const
          ).map((tab) => {
            const count = statusCounts[tab] || 0
            const isSelected = selectedStatus === tab
            return (
              <Button
                key={tab}
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setSelectedStatus(tab)}
                className={cn(
                  "flex h-auto cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all",
                  isSelected
                    ? "bg-background text-foreground hover:bg-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{tab}</span>
                <span
                  className={cn(
                    "py-0.2 rounded-full px-1.5 font-mono text-[10px]",
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </Button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pipelines or tables..."
            className="h-8 pl-8 font-mono text-xs"
          />
        </div>
      </div>

      {/* Main Jobs Table */}
      <div className="border-border/70 bg-card/60 overflow-hidden rounded-xl border shadow-xs backdrop-blur-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-border/60 bg-muted/30 text-muted-foreground border-b text-[11px] font-semibold tracking-wider uppercase">
              <tr>
                <th className="px-4 py-3">Route (Source ➔ Target)</th>
                <th className="px-4 py-3">Tables</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Records Synced</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-border/40 divide-y">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted-foreground py-12 text-center text-xs"
                  >
                    Loading migration pipelines...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted-foreground py-12 text-center text-xs"
                  >
                    {jobs.length === 0
                      ? "No migration pipelines launched yet. Click 'New Migration' above to start your first pipeline."
                      : "No pipelines match your search criteria."}
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* 1. Source ➔ Target Engines */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            {job.source_db_type && (
                              <EngineIcon
                                engine={job.source_db_type}
                                className="h-4 w-4"
                              />
                            )}
                            <span className="text-foreground font-semibold">
                              {job.source_connection_name || "Source"}
                            </span>
                          </div>

                          <ArrowRight className="text-muted-foreground/60 h-3 w-3" />

                          <div className="flex items-center gap-1.5">
                            {job.target_db_type && (
                              <EngineIcon
                                engine={job.target_db_type}
                                className="h-4 w-4"
                              />
                            )}
                            <span className="text-foreground font-semibold">
                              {job.target_connection_name || "Target"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Source Table ➔ Target Table */}
                      <td className="px-4 py-3.5 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {job.source_table}
                          </Badge>
                          <span className="text-muted-foreground/50">➔</span>
                          <Badge variant="outline" className="text-[10px]">
                            {job.target_table}
                          </Badge>
                        </div>
                      </td>

                      {/* 3. Status Badge */}
                      <td className="px-4 py-3.5">
                        <MigrationStatusBadge status={job.status} />
                      </td>

                      {/* 4. Progress / Rows Synced */}
                      <td className="px-4 py-3.5">
                        <div>
                          <div className="text-foreground flex items-baseline gap-1 font-mono text-xs font-semibold">
                            <span>{job.migrated_rows?.toLocaleString()}</span>
                            <span className="text-muted-foreground text-[10px] font-normal">
                              /{" "}
                              {job.total_rows > 0
                                ? job.total_rows.toLocaleString()
                                : "--"}
                            </span>
                          </div>
                          <div className="bg-muted/50 mt-1 h-1.5 w-24 overflow-hidden rounded-full">
                            <div
                              className={cn(
                                "h-full transition-all",
                                job.status === "failed"
                                  ? "bg-destructive"
                                  : job.status === "completed"
                                    ? "bg-success"
                                    : "bg-info"
                              )}
                              style={{
                                width: `${Math.min(100, Math.max(0, job.percentage))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 5. Date */}
                      <td className="text-muted-foreground px-4 py-3.5 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* 6. Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Telemetry View */}
                          <Link to={`/migration/${job.id}`}>
                            <Button
                              variant="outline"
                              size="xs"
                              className="gap-1 text-[11px]"
                            >
                              <Activity className="text-info h-3 w-3" />
                              <span>Live</span>
                            </Button>
                          </Link>

                          {/* Details Inspection */}
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setSelectedJobForDetails(job)}
                            className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </Button>

                          {/* Abort/Cancel if running */}
                          {job.status === "running" && onCancelJob && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setJobToCancel(job)}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7 p-0"
                              title="Cancel Migration"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {jobToCancel && onCancelJob && (
        <CancelMigrationDialog
          open={!!jobToCancel}
          onOpenChange={(open) => !open && setJobToCancel(null)}
          jobName={`${jobToCancel.source_table} ➔ ${jobToCancel.target_table}`}
          isCancelling={isCancellingJob}
          onConfirm={async () => {
            if (jobToCancel) {
              await onCancelJob(jobToCancel.id)
            }
          }}
        />
      )}

      {/* Details Modal */}
      {selectedJobForDetails && (
        <MigrationDetailsModal
          job={selectedJobForDetails}
          open={!!selectedJobForDetails}
          onOpenChange={(open) => !open && setSelectedJobForDetails(null)}
        />
      )}
    </div>
  )
}
