import { useNavigate } from "react-router-dom"
import {
  FolderKanban,
  Database,
  Calendar,
  MoreVertical,
  ArrowUpRight,
  Trash2,
  Check,
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
import { useWorkspaceStore } from "@/store/workspaceStore"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { cn } from "@/lib/utils"
import type { Project, Environment } from "@/types/project"

interface ProjectCardProps {
  project: Project
  connectionCount?: number
  onDelete?: (project: Project) => void
}

const envBadgeStyles: Record<
  Environment,
  { label: string; className: string }
> = {
  development: {
    label: "Dev",
    className: "border-info/30 bg-info/10 text-info font-mono",
  },
  staging: {
    label: "Staging",
    className: "border-warning/30 bg-warning/10 text-warning font-mono",
  },
  production: {
    label: "Prod",
    className: "border-success/30 bg-success/10 text-success font-mono",
  },
}

export function ProjectCard({
  project,
  connectionCount = 0,
  onDelete,
}: ProjectCardProps) {
  const navigate = useNavigate()
  const { activeProjectId, setActiveProjectId } = useWorkspaceStore()
  const isActive = activeProjectId === project.id

  const envConfig = envBadgeStyles[project.environment] || {
    label: project.environment || "Dev",
    className: "border-muted bg-muted text-muted-foreground",
  }

  const handleOpen = () => {
    setActiveProjectId(project.id)
    navigate(`/projects/${project.id}`)
  }

  const formattedDate = new Date(project.created_at).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  )

  return (
    <div
      onClick={handleOpen}
      className={cn(
        "group relative flex cursor-pointer flex-col justify-between rounded-xl border bg-card p-5.5 transition-all duration-200",
        "hover:border-border hover:shadow-md",
        isActive
          ? "border-primary/50 bg-primary/2 shadow-xs"
          : "border-border/80"
      )}
    >
      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "border border-primary/30 bg-primary/10 text-primary"
                  : "border border-border/80 bg-muted/30 text-muted-foreground group-hover:border-primary/20 group-hover:text-primary"
              )}
            >
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="line-clamp-1 font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                  {project.name}
                </h3>
                {isActive && (
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 px-1.5 py-0 text-[10px] font-semibold text-primary"
                  >
                    Active
                  </Badge>
                )}
              </div>
              <p className="line-clamp-1 font-mono text-xs text-muted-foreground">
                {project.slug || project.id.slice(0, 8)}
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Badge
              variant="outline"
              className={cn(
                "px-2 py-0.5 text-xs font-semibold",
                envConfig.className
              )}
            >
              {envConfig.label}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Project actions"
                  />
                }
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleOpen} className="gap-2">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                  <span>Open Studio</span>
                </DropdownMenuItem>

                {!isActive && (
                  <DropdownMenuItem
                    onClick={() => setActiveProjectId(project.id)}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4 text-success" />
                    <span>Set as Active</span>
                  </DropdownMenuItem>
                )}

                <PermissionGuard allowedRoles={["owner", "admin"]}>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(project)}
                    className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Project</span>
                  </DropdownMenuItem>
                </PermissionGuard>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Project Description */}
        <p className="mt-3.5 line-clamp-2 min-h-8 text-xs leading-relaxed text-muted-foreground">
          {project.description ||
            "No description provided for this database project."}
        </p>
      </div>

      {/* Card Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <Database className="h-3.5 w-3.5 text-primary" />
          <span>
            {connectionCount}{" "}
            {connectionCount === 1 ? "Connection" : "Connections"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <Calendar className="h-3 w-3" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  )
}
