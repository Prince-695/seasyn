import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  MoreVertical,
  Trash2,
  Lock,
  HardDrive,
  Globe,
  Database,
  ChevronRight,
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
import { DiagnosticPingButton } from "./DiagnosticPingButton"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { cn } from "@/lib/utils"
import type { PublicDatabaseConnection } from "@/types"

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const navigate = useNavigate()

  const handleOpenStudio = () => {
    if (onInspectSchema) {
      onInspectSchema(connection)
    } else {
      navigate(
        `/editor?projectId=${connection.project_id}&connId=${connection.id}`
      )
    }
  }

  return (
    <>
      <div className="group border-border/80 bg-card hover:border-border relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 hover:shadow-md">
        {/* Card Header */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleOpenStudio}
                className="border-border/80 bg-muted/30 group-hover:border-primary/40 group-hover:bg-primary/5 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border p-0 transition-all"
                title={`Open ${connection.name} in Schema Studio`}
              >
                <EngineIcon type={connection.db_type} className="h-6 w-6" />
              </Button>

              <div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleOpenStudio}
                    className="hover:text-primary group/title flex h-auto cursor-pointer items-center gap-1.5 p-0 text-left font-semibold tracking-tight transition-colors"
                    title={`Open ${connection.name} in Schema Studio`}
                  >
                    <h3 className="text-foreground group-hover/title:text-primary line-clamp-1 font-semibold transition-colors">
                      {connection.name}
                    </h3>
                    <ChevronRight className="text-primary h-3.5 w-3.5 opacity-0 transition-all duration-150 group-hover/title:translate-x-0.5 group-hover/title:opacity-100" />
                  </Button>
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
                  {onInspectSchema && <DropdownMenuSeparator />}
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
        <div className="border-border/60 mt-4 border-t pt-3">
          <DiagnosticPingButton
            savedConnId={connection.id}
            projectId={connection.project_id}
            size="sm"
            variant="outline"
            className="w-full justify-center"
          />
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
