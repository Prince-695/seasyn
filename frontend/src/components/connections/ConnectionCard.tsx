import { useState } from "react"
import {
  MoreVertical,
  Trash2,
  Lock,
  HardDrive,
  Globe,
  Database,
  CheckCircle2,
  XCircle,
  Activity,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EngineIcon } from "./EngineSelector"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { projectsApi } from "@/api/projects"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { cn } from "@/lib/utils"
import type { PublicDatabaseConnection, ConnectionTestResult } from "@/types"

interface ConnectionCardProps {
  connection: PublicDatabaseConnection
  onDelete?: (conn: PublicDatabaseConnection) => void
  onInspectSchema?: (conn: PublicDatabaseConnection) => void
}

export function ConnectionCard({
  connection,
  onDelete,
  onInspectSchema,
}: ConnectionCardProps) {
  const { activeOrg } = useWorkspaceStore()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(
    null
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Direct ping test for saved connection
  const handleTestPing = async () => {
    if (!activeOrg?.id) return
    setTesting(true)
    setTestResult(null)

    try {
      const res = await projectsApi.testSavedConnection(
        activeOrg.id,
        connection.project_id,
        connection.id
      )
      setTestResult(
        res.data || {
          success: false,
          latency_ms: 0,
          error_message: "No response",
        }
      )
    } catch (err: unknown) {
      setTestResult({
        success: false,
        latency_ms: 0,
        error_message:
          err instanceof Error ? err.message : "Connection diagnostic failed",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <>
      <div className="group border-border/80 bg-card hover:border-border relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 hover:shadow-md">
        {/* Card Header */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="border-border/80 bg-muted/30 group-hover:border-primary/20 flex h-11 w-11 items-center justify-center rounded-xl border transition-colors">
                <EngineIcon type={connection.db_type} className="h-6 w-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-foreground line-clamp-1 font-semibold tracking-tight">
                    {connection.name}
                  </h3>
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="border-border bg-muted/40 px-1.5 py-0 font-mono text-[10px] font-semibold uppercase"
                  >
                    {connection.db_type}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={cn(
                      "px-1.5 py-0 font-mono text-[10px] font-semibold",
                      connection.is_source
                        ? "border-info/30 bg-info/10 text-info"
                        : "border-success/30 bg-success/10 text-success"
                    )}
                  >
                    {connection.is_source ? "Source DB" : "Target DB"}
                  </Badge>

                  {connection.ssl_mode && connection.ssl_mode !== "disable" && (
                    <Badge
                      variant="outline"
                      className="border-muted-foreground/20 text-muted-foreground flex items-center gap-1 px-1.5 py-0 text-[10px]"
                    >
                      <Lock className="h-2.5 w-2.5" />
                      <span>{connection.ssl_mode}</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-8 w-8"
                    aria-label="Connection actions"
                  />
                }
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={handleTestPing}
                  className="cursor-pointer gap-2"
                >
                  <Activity className="text-primary h-4 w-4" />
                  <span>Test Connection</span>
                </DropdownMenuItem>

                {onInspectSchema && (
                  <DropdownMenuItem
                    onClick={() => onInspectSchema(connection)}
                    className="cursor-pointer gap-2"
                  >
                    <Database className="text-info h-4 w-4" />
                    <span>Explore Schema</span>
                  </DropdownMenuItem>
                )}

                <PermissionGuard allowedRoles={["owner", "admin"]}>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Connection</span>
                  </DropdownMenuItem>
                </PermissionGuard>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Connection Endpoint Details */}
          <div className="border-border/60 bg-muted/20 mt-4 space-y-1.5 rounded-lg border p-3 font-mono text-xs">
            {connection.db_type === "sqlite" ? (
              <div className="text-muted-foreground flex items-center gap-2 truncate">
                <HardDrive className="text-warning h-3.5 w-3.5 shrink-0" />
                <span className="text-foreground truncate">
                  {connection.file_path || "File path not specified"}
                </span>
              </div>
            ) : (
              <>
                <div className="text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <Globe className="text-primary h-3.5 w-3.5 shrink-0" />
                    <span className="text-foreground truncate">
                      {connection.host || "localhost"}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-semibold">
                    :{connection.port || 5432}
                  </span>
                </div>

                {connection.database && (
                  <div className="text-muted-foreground flex items-center gap-2 pt-0.5">
                    <Database className="text-info h-3.5 w-3.5 shrink-0" />
                    <span className="text-foreground truncate font-medium">
                      {connection.database}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Card Footer: Live Diagnostic Ping Feedback & Trigger */}
        <div className="border-border/60 mt-4 flex flex-col gap-2 border-t pt-3">
          {testResult ? (
            <div
              className={cn(
                "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-all",
                testResult.success
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              )}
            >
              <div className="flex items-center gap-1.5 truncate">
                {testResult.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate font-medium">
                  {testResult.success
                    ? `${testResult.latency_ms}ms • Operational`
                    : "Connection Failed"}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleTestPing}
                disabled={testing}
                className="hover:bg-background/20 h-6 px-2 text-[11px]"
              >
                Re-test
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">
                Ephemeral credentials verified
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestPing}
                disabled={testing}
                className="h-7 gap-1.5 text-xs font-medium"
              >
                {testing ? (
                  <Loader2 className="text-primary h-3 w-3 animate-spin" />
                ) : (
                  <Activity className="text-primary h-3 w-3" />
                )}
                <span>{testing ? "Testing..." : "Test Ping"}</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete Database Connection
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="text-foreground font-semibold">
                "{connection.name}"
              </span>
              ? This database connection will be unlinked from active migration
              pipelines and schema inspection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete?.(connection)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Connection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
