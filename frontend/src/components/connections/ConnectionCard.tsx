import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  MoreVertical,
  Trash2,
  Lock,
  HardDrive,
  Globe,
  Database,
  ChevronRight,
  Edit,
  FolderKanban,
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
import { EditConnectionModal } from "./EditConnectionModal"
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
  connection: PublicDatabaseConnection & {
    projectName?: string
    projectSlug?: string
    projectEnvironment?: string
  }
  onDelete?: (conn: PublicDatabaseConnection) => void
  onInspectSchema?: (conn: PublicDatabaseConnection) => void
  onEdit?: (conn: PublicDatabaseConnection) => void
  showProject?: boolean
}

export function ConnectionCard({
  connection,
  onDelete,
  onInspectSchema,
  onEdit,
  showProject = false,
}: ConnectionCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const navigate = useNavigate()

  const handleOpenStudio = () => {
    if (onInspectSchema) {
      onInspectSchema(connection)
    } else {
      const projectSlugOrId =
        (connection as { projectSlug?: string }).projectSlug ||
        connection.project_id
      const connNameOrId = connection.name || connection.id
      navigate(`/editor?project=${projectSlugOrId}&conn=${connNameOrId}`)
    }
  }

  return (
    <>
      <div
        className={cn(
          "group border-border/80 bg-card hover:border-border relative flex h-full flex-col justify-between rounded-xl border p-4.5 transition-all duration-200 hover:shadow-md",
          showProject ? "min-h-62" : "min-h-55"
        )}
      >
        {/* Card Header & Body */}
        <div>
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleOpenStudio}
                className="border-border/80 bg-muted/30 group-hover:border-primary/40 group-hover:bg-primary/5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border p-0 transition-all"
                title={`Open ${connection.name} in Schema Studio`}
              >
                <EngineIcon type={connection.db_type} className="h-5 w-5" />
              </Button>

              <div className="min-w-0 flex-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleOpenStudio}
                  className="hover:text-primary group/title flex h-auto max-w-full cursor-pointer items-center gap-1 p-0 text-left font-semibold tracking-tight transition-colors"
                  title={`Open ${connection.name} in Schema Studio`}
                >
                  <span className="text-foreground group-hover/title:text-primary truncate text-sm font-semibold transition-colors">
                    {connection.name}
                  </span>
                  <ChevronRight className="text-primary h-3 w-3 shrink-0 opacity-0 transition-all duration-150 group-hover/title:translate-x-0.5 group-hover/title:opacity-100" />
                </Button>

                <div className="mt-1 flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
                  <Badge
                    variant="outline"
                    className="border-border bg-muted/40 shrink-0 px-1.5 py-0 font-mono text-[10px] font-semibold uppercase"
                  >
                    {connection.db_type}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 px-1.5 py-0 font-mono text-[10px] font-semibold",
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
                      className="border-muted-foreground/20 text-muted-foreground flex shrink-0 items-center gap-1 px-1.5 py-0 text-[10px]"
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
                    className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
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
                    onClick={() => setShowEditModal(true)}
                    className="cursor-pointer gap-2"
                  >
                    <Edit className="text-primary h-4 w-4" />
                    <span>Edit Connection</span>
                  </DropdownMenuItem>
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
          <div className="border-border/60 bg-muted/20 mt-3.5 flex h-17 flex-col justify-center gap-1 rounded-lg border p-3 font-mono text-xs">
            {connection.db_type === "sqlite" ? (
              <div className="text-muted-foreground flex items-center gap-2 truncate">
                <HardDrive className="text-warning h-3.5 w-3.5 shrink-0" />
                <span className="text-foreground truncate">
                  {connection.file_path || "File path not specified"}
                </span>
              </div>
            ) : (
              <>
                <div className="text-muted-foreground flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 truncate">
                    <Globe className="text-primary h-3.5 w-3.5 shrink-0" />
                    <span className="text-foreground truncate">
                      {connection.host || "localhost"}
                    </span>
                  </div>
                  <span className="text-muted-foreground shrink-0 font-semibold">
                    :{connection.port || 5432}
                  </span>
                </div>

                <div className="text-muted-foreground flex items-center gap-2 truncate pt-0.5">
                  <Database className="text-info h-3.5 w-3.5 shrink-0" />
                  <span className="text-foreground truncate font-medium">
                    {connection.database || "default"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Optional Parent Project Identifier (used on Workspace Database Connections page) */}
          {showProject && connection.projectName && (
            <div className="text-muted-foreground border-border/40 mt-3 flex items-center justify-between border-t pt-2 text-[11px]">
              <span className="flex min-w-0 items-center gap-1 truncate">
                <FolderKanban className="text-muted-foreground h-3 w-3 shrink-0" />
                <span className="text-muted-foreground shrink-0">Project:</span>
                <Link
                  to={`/projects/${connection.projectSlug || connection.project_id}`}
                  className="text-primary truncate font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {connection.projectName}
                </Link>
              </span>
              {connection.projectEnvironment && (
                <span className="text-muted-foreground ml-2 shrink-0 font-mono text-[10px] uppercase">
                  {connection.projectEnvironment}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card Footer: Live Diagnostic Ping Feedback & Trigger */}
        <div className="border-border/60 mt-3.5 border-t pt-3">
          <DiagnosticPingButton
            compact
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

      <EditConnectionModal
        connection={connection}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onConnectionUpdated={onEdit}
      />
    </>
  )
}
