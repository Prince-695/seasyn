import React from "react"
import {
  FolderKanban,
  ArrowRight,
  Plus,
  Loader2,
  Search,
  Server,
  MoreVertical,
  Trash2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { CreateProjectModal } from "@/components/projects/CreateProjectModal"
import { formatDate } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { Project, Environment } from "@/types"
import type { OrgConnection } from "@/hooks/useOrgConnections"

import {
  ENVIRONMENT_CONFIG,
  type EnvFilter,
} from "@/lib/constants/environments"
export type { EnvFilter }

interface EnvStats {
  total: number
  dev: number
  staging: number
  prod: number
}

interface DashboardProjectsTableProps {
  projects: Project[]
  filteredProjects: Project[]
  connections: OrgConnection[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (val: string) => void
  envFilter: EnvFilter
  onEnvFilterChange: (env: EnvFilter) => void
  envStats: EnvStats
  onSelectProject: (project: Project) => void
  onAddDatabase: (projectId: string) => void
  onDeleteProject: (project: Project) => void
}

interface DropdownAction {
  label: string
  icon: LucideIcon
  onClick: () => void
  destructive?: boolean
  separatorBefore?: boolean
}

function ProjectRowActions({
  onSelect,
  onAddDb,
  onDelete,
}: {
  onSelect: () => void
  onAddDb: () => void
  onDelete: () => void
}) {
  const actions: DropdownAction[] = [
    {
      label: "Open Studio",
      icon: FolderKanban,
      onClick: onSelect,
    },
    {
      label: "Add Database",
      icon: Server,
      onClick: onAddDb,
    },
    {
      label: "Delete Project",
      icon: Trash2,
      onClick: onDelete,
      destructive: true,
      separatorBefore: true,
    },
  ]

  return (
    <div
      className="flex items-center justify-end gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        size="xs"
        variant="ghost"
        onClick={onSelect}
        className="group/btn text-muted-foreground hover:text-foreground gap-1 text-xs"
      >
        <span>Open Studio</span>
        <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="icon-xs"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground h-7 w-7 rounded-lg"
              aria-label="Project actions"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44 text-xs">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <React.Fragment key={action.label}>
                {action.separatorBefore && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={action.onClick}
                  className={cn(
                    "cursor-pointer gap-2",
                    action.destructive &&
                      "text-destructive focus:text-destructive"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{action.label}</span>
                </DropdownMenuItem>
              </React.Fragment>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function DashboardProjectsTable({
  projects,
  filteredProjects,
  connections,
  isLoading,
  searchQuery,
  onSearchChange,
  envFilter,
  onEnvFilterChange,
  envStats,
  onSelectProject,
  onAddDatabase,
  onDeleteProject,
}: DashboardProjectsTableProps) {
  const filterTabs: {
    value: EnvFilter
    label: string
    count: number
    activeTextClass?: string
  }[] = [
    { value: "all", label: "All", count: envStats.total },
    {
      value: "development",
      label: "Dev",
      count: envStats.dev,
      activeTextClass: "text-info",
    },
    {
      value: "staging",
      label: "Staging",
      count: envStats.staging,
      activeTextClass: "text-warning",
    },
    {
      value: "production",
      label: "Prod",
      count: envStats.prod,
      activeTextClass: "text-success",
    },
  ]

  const tableHeaders = [
    { label: "Name", align: "left" },
    { label: "Environment", align: "left" },
    { label: "Created at", align: "left" },
    { label: "Databases", align: "left" },
    { label: "Status", align: "left" },
    { label: "Actions", align: "right" },
  ] as const

  return (
    <div className="space-y-4">
      {/* Header with Project Count & Filter Pills */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-foreground text-xl font-semibold">
          {projects.length} {projects.length === 1 ? "Project" : "Projects"}
        </h2>

        {/* Environment Filter Pills mapped from config array */}
        <div className="border-border/80 bg-muted/30 flex flex-wrap items-center gap-1 rounded-lg border p-1 text-xs">
          {filterTabs.map((tab) => {
            const isActive = envFilter === tab.value
            return (
              <Button
                key={tab.value}
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => onEnvFilterChange(tab.value)}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  isActive
                    ? cn(
                        "bg-background font-semibold shadow-xs",
                        tab.activeTextClass || "text-foreground"
                      )
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label} ({tab.count})
              </Button>
            )
          })}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <Search className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 rounded-xl pl-10 text-xs shadow-2xs"
        />
      </div>

      {/* Projects Table / Empty State / Loading State */}
      {isLoading ? (
        <div className="border-border/70 flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed">
          <Loader2 className="text-primary h-7 w-7 animate-spin" />
          <p className="text-muted-foreground text-xs font-medium">
            Loading projects...
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="border-border/80 bg-card/40 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
          <div className="border-border/80 bg-muted/40 flex h-14 w-14 items-center justify-center rounded-2xl border">
            <FolderKanban className="text-muted-foreground h-7 w-7" />
          </div>
          <h3 className="text-foreground mt-4 text-base font-semibold">
            {searchQuery || envFilter !== "all"
              ? "No matching projects found"
              : "No projects created yet"}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-md text-xs">
            {searchQuery || envFilter !== "all"
              ? "Try adjusting your search query or switching environment filters."
              : "Create a project workspace to connect source and destination databases and run migrations."}
          </p>
          {!searchQuery && envFilter === "all" && (
            <div className="mt-5">
              <PermissionGuard allowedRoles={["owner", "admin"]}>
                <CreateProjectModal
                  trigger={
                    <Button size="sm" className="gap-2 font-semibold">
                      <Plus className="h-4 w-4" />
                      <span>Create First Project</span>
                    </Button>
                  }
                  onProjectCreated={onSelectProject}
                />
              </PermissionGuard>
            </div>
          )}
        </div>
      ) : (
        <div className="border-border/70 bg-card/60 overflow-hidden rounded-2xl border shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-border/60 bg-muted/30 text-muted-foreground border-b text-[11px] font-semibold uppercase">
                  {tableHeaders.map((header) => (
                    <th
                      key={header.label}
                      className={cn(
                        "px-5 py-3.5",
                        header.align === "right" && "text-right"
                      )}
                    >
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-border/50 divide-y">
                {filteredProjects.map((project) => {
                  const projectConnections = connections.filter(
                    (c) => c.project_id === project.id
                  )
                  const sourceCount = projectConnections.filter(
                    (c) => c.is_source
                  ).length
                  const targetCount = projectConnections.filter(
                    (c) => !c.is_source
                  ).length

                  const envConfig = ENVIRONMENT_CONFIG[
                    project.environment as Environment
                  ] || {
                    label: project.environment,
                    className: "border-muted bg-muted text-muted-foreground",
                  }

                  return (
                    <tr
                      key={project.id}
                      onClick={() => onSelectProject(project)}
                      className="hover:bg-muted/35 group cursor-pointer transition-colors"
                    >
                      {/* Name Column */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="border-primary/20 bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105">
                            <FolderKanban className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-foreground group-hover:text-primary font-semibold transition-colors">
                              {project.name}
                            </span>
                            <p className="text-muted-foreground truncate font-mono text-[11px]">
                              /{project.slug || project.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Environment Column */}
                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-2 py-0.5 text-[11px]",
                            envConfig.className
                          )}
                        >
                          {envConfig.label}
                        </Badge>
                      </td>

                      {/* Created At */}
                      <td className="text-muted-foreground px-5 py-4">
                        {formatDate(project.created_at)}
                      </td>

                      {/* Databases Count */}
                      <td className="px-5 py-4">
                        {projectConnections.length > 0 ? (
                          <span className="text-foreground font-medium">
                            {projectConnections.length}{" "}
                            <span className="text-muted-foreground text-[11px]">
                              ({sourceCount} in, {targetCount} out)
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px] italic">
                            None configured
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="text-success inline-flex items-center gap-1.5 font-medium">
                          <span className="bg-success h-1.5 w-1.5 animate-pulse rounded-full" />
                          <span>Ready</span>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-4 text-right">
                        <ProjectRowActions
                          onSelect={() => onSelectProject(project)}
                          onAddDb={() => onAddDatabase(project.id)}
                          onDelete={() => onDeleteProject(project)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
