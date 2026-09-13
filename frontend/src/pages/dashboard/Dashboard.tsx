import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  Building2,
  FolderKanban,
  ArrowRight,
  Plus,
  Loader2,
  Search,
  Server,
  Zap,
  Activity,
  MoreVertical,
  Trash2,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { CreateOrgModal } from "@/components/orgs/CreateOrgModal"
import { CreateProjectModal } from "@/components/projects/CreateProjectModal"
import { ConnectionWizardModal } from "@/components/connections/ConnectionWizardModal"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { projectsApi } from "@/api/projects"
import { analyticsApi } from "@/api/analytics"
import { userApi } from "@/api/auth"
import { projectKeys, analyticsKeys } from "@/lib/queryKeys"
import { formatDate } from "@/lib/formatters"
import { useOrgConnections } from "@/hooks/useOrgConnections"
import { EngineIcon } from "@/components/connections/EngineIcon"
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
import { cn } from "@/lib/utils"
import type { Project, Environment } from "@/types"

type EnvFilter = "all" | Environment

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

export function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { activeOrg, setActiveProject } = useWorkspaceStore()
  const [createOrgOpen, setCreateOrgOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [envFilter, setEnvFilter] = useState<EnvFilter>("all")
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [activeModalProjectId, setActiveModalProjectId] = useState<
    string | null
  >(null)

  // Fetch real user profile from /users/me
  const { data: profileData } = useQuery({
    queryKey: ["userProfile", "me"],
    queryFn: async () => {
      const res = await userApi.getMyProfile()
      return res.data
    },
  })

  const currentProfile = profileData ?? user

  // Fetch projects and aggregated connections across active organization
  const {
    projects = [],
    connections = [],
    isLoading: isLoadingOrgData,
  } = useOrgConnections(activeOrg?.id)

  // Fetch organization-wide analytics overview from backend (replaces client-side calculations)
  const { data: orgOverview } = useQuery({
    queryKey: analyticsKeys.orgOverview(activeOrg?.id || ""),
    queryFn: async () => {
      if (!activeOrg?.id) return null
      const res = await analyticsApi.getOrgOverview(activeOrg.id)
      return res.data || null
    },
    enabled: !!activeOrg?.id,
  })

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!activeOrg?.id) {
        throw new Error(
          "No organization is currently active. Please select an organization to delete this project."
        )
      }
      await projectsApi.delete(activeOrg.id, projectId)
    },
    onSuccess: () => {
      if (activeOrg?.id) {
        queryClient.invalidateQueries({
          queryKey: projectKeys.byOrg(activeOrg.id),
        })
      }
      setProjectToDelete(null)
    },
  })

  // Filter projects by search query and environment
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.slug && p.slug.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))

      const matchesEnv = envFilter === "all" || p.environment === envFilter

      return matchesSearch && matchesEnv
    })
  }, [projects, searchQuery, envFilter])

  // Count statistics by environment
  const envStats = useMemo(() => {
    const dev = projects.filter((p) => p.environment === "development").length
    const staging = projects.filter((p) => p.environment === "staging").length
    const prod = projects.filter((p) => p.environment === "production").length
    return { total: projects.length, dev, staging, prod }
  }, [projects])

  // Aggregate metrics from backend analytics overview (removes manual frontend calculations)
  const orgMetrics = useMemo(() => {
    const health = orgOverview?.migration_health
    return {
      runningPipelines: health?.running ?? 0,
      totalPipelines: health?.total_jobs ?? 0,
      totalRowsSynced: health?.total_rows_migrated ?? 0,
      successRate: health?.success_rate ?? 100,
      totalDatabases: connections.length,
      totalProjects: projects.length,
    }
  }, [orgOverview, connections, projects])

  // Handler to navigate into a project and establish project context
  const handleSelectProject = (project: Project) => {
    setActiveProject({
      id: project.id,
      slug: project.slug,
      name: project.name,
      environment: project.environment,
    })
    navigate(`/projects/${project.slug || project.id}`)
  }

  // Fallback org display name
  const orgDisplayName =
    activeOrg?.name ||
    (currentProfile?.email
      ? `${currentProfile.email}'s projects`
      : "Organization Projects")

  return (
    <div className="space-y-6">
      {/* ── Top Header Strip ── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            {activeOrg?.name ? `${activeOrg.name}'s projects` : orgDisplayName}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Manage your database projects, environments, and data
            synchronization pipelines.
          </p>
        </div>

        {activeOrg && (
          <div className="flex items-center gap-2.5">
            <PermissionGuard allowedRoles={["owner", "admin"]}>
              <CreateProjectModal
                trigger={
                  <Button className="gap-2 font-semibold shadow-xs">
                    <Plus className="h-4 w-4" />
                    <span>New project</span>
                  </Button>
                }
                onProjectCreated={(newProject) =>
                  handleSelectProject(newProject)
                }
              />
            </PermissionGuard>
          </div>
        )}
      </div>

      {/* ── When no organization is active ── */}
      {!activeOrg && (
        <div className="border-border/80 bg-card/30 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center shadow-xs">
          <div className="bg-primary/10 text-primary mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
            <Building2 className="h-7 w-7" />
          </div>
          <h3 className="text-foreground text-lg font-bold">
            No Workspace Selected
          </h3>
          <p className="text-muted-foreground mt-1 max-w-md text-sm">
            Select an existing organization or create a new workspace to start
            managing database projects.
          </p>
          <Button
            onClick={() => setCreateOrgOpen(true)}
            className="mt-6 gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Organization</span>
          </Button>
          <CreateOrgModal
            open={createOrgOpen}
            onOpenChange={setCreateOrgOpen}
          />
        </div>
      )}

      {/* ── Top Aggregate Metrics Strip (Inspired by reference Neon-style cards) ── */}
      {activeOrg && (
        <div className="border-border/70 bg-card/50 overflow-hidden rounded-2xl border shadow-xs backdrop-blur-xs">
          <div className="divide-border/60 grid grid-cols-2 divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {/* Metric 1: Live Pipelines */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Active Pipelines
                </span>
                <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
                  <Zap className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-foreground font-mono text-2xl font-extrabold tracking-tight">
                  {orgMetrics.runningPipelines > 0
                    ? `${orgMetrics.runningPipelines} active`
                    : `${orgMetrics.totalPipelines} total`}
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  {orgMetrics.runningPipelines > 0
                    ? "In-flight live replication"
                    : "Configured migration jobs"}
                </p>
              </div>
            </div>

            {/* Metric 2: Synced Records */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Synced Records
                </span>
                <div className="bg-info/10 text-info flex h-7 w-7 items-center justify-center rounded-lg">
                  <Activity className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-foreground font-mono text-2xl font-extrabold tracking-tight">
                  {orgMetrics.totalRowsSynced > 0
                    ? orgMetrics.totalRowsSynced.toLocaleString()
                    : "0 rec"}
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Zero data loss in-flight
                </p>
              </div>
            </div>

            {/* Metric 3: Connected Databases */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Databases
                </span>
                <div className="bg-success/10 text-success flex h-7 w-7 items-center justify-center rounded-lg">
                  <Server className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-foreground font-mono text-2xl font-extrabold tracking-tight">
                  {orgMetrics.totalDatabases}
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Verified database adapters
                </p>
              </div>
            </div>

            {/* Metric 4: Total Projects */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Projects
                </span>
                <div className="bg-accent/10 text-accent flex h-7 w-7 items-center justify-center rounded-lg">
                  <FolderKanban className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-foreground font-mono text-2xl font-extrabold tracking-tight">
                  {orgMetrics.totalProjects}
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Workspaces in {activeOrg.name}
                </p>
              </div>
            </div>
          </div>

          <div className="border-border/60 bg-muted/20 text-muted-foreground border-t px-5 py-2.5 text-[11px]">
            Telemetry metrics for organization{" "}
            <span className="text-foreground font-semibold">
              {activeOrg.name}
            </span>
            . Synchronized in real-time across all database adapters.
          </div>
        </div>
      )}

      {/* ── Organization Analytics: Quotas & Infrastructure Breakdown ── */}
      {activeOrg && orgOverview && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Card 1: Workspace Limits & Quotas */}
          <div className="border-border/70 bg-card/50 rounded-2xl border p-4 shadow-xs backdrop-blur-xs">
            <div className="border-border/50 flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-foreground text-sm font-bold tracking-tight sm:text-base">
                  Workspace Limits
                </h3>
                <p className="text-muted-foreground text-xs">
                  Resource usage for {activeOrg.name}
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {orgOverview.migration_health.success_rate.toFixed(0)}% Success
              </Badge>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              {/* Projects Quota */}
              <div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Projects</span>
                  <span className="text-foreground font-mono font-semibold">
                    {orgOverview.quotas.projects.used} /{" "}
                    {orgOverview.quotas.projects.max}
                  </span>
                </div>
                <div className="bg-muted/50 mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, orgOverview.quotas.projects.percentage)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Members Quota */}
              <div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Team Members</span>
                  <span className="text-foreground font-mono font-semibold">
                    {orgOverview.quotas.members.used} /{" "}
                    {orgOverview.quotas.members.max}
                  </span>
                </div>
                <div className="bg-muted/50 mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-info h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, orgOverview.quotas.members.percentage)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Connected Database Types */}
          <div className="border-border/70 bg-card/50 rounded-2xl border p-4 shadow-xs backdrop-blur-xs">
            <div className="border-border/50 flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-foreground text-sm font-bold tracking-tight sm:text-base">
                  Database Engines
                </h3>
                <p className="text-muted-foreground text-xs">
                  Infrastructure mix in workspace
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {connections.length} Total
              </Badge>
            </div>

            <div className="mt-3 space-y-2">
              {orgOverview.engine_distribution &&
              orgOverview.engine_distribution.length > 0 ? (
                orgOverview.engine_distribution.map((item) => (
                  <div
                    key={item.db_type}
                    className="border-border/40 bg-muted/20 flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <EngineIcon
                        engine={item.db_type}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-foreground text-xs font-medium capitalize">
                        {item.db_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {item.count} {item.count === 1 ? "db" : "dbs"}
                      </span>
                      <Badge
                        variant="secondary"
                        className="px-1.5 py-0 font-mono text-[10px]"
                      >
                        {item.percentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  No databases connected yet.
                </p>
              )}
            </div>
          </div>

          {/* Card 3: 30-Day Activity Trend */}
          <div className="border-border/70 bg-card/50 rounded-2xl border p-4 shadow-xs backdrop-blur-xs">
            <div className="border-border/50 flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-foreground text-sm font-bold tracking-tight sm:text-base">
                  Sync Activity
                </h3>
                <p className="text-muted-foreground text-xs">
                  Past 30 days data transfer
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-success/30 bg-success/10 text-success font-mono text-[10px]"
              >
                {orgOverview.migration_health.completed} Completed
              </Badge>
            </div>

            <div className="mt-3">
              {orgOverview.velocity_timeline &&
              orgOverview.velocity_timeline.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex h-16 items-end justify-between gap-1 pt-2">
                    {(() => {
                      const maxRows = Math.max(
                        ...orgOverview.velocity_timeline.map(
                          (p) => p.rows_migrated
                        ),
                        1
                      )
                      return orgOverview.velocity_timeline
                        .slice(-14)
                        .map((point) => {
                          const heightPct = Math.max(
                            12,
                            Math.round((point.rows_migrated / maxRows) * 100)
                          )
                          return (
                            <div
                              key={point.date}
                              className="group relative flex h-full flex-1 flex-col items-center justify-end"
                              title={`${point.date}: ${point.rows_migrated.toLocaleString()} rows (${point.jobs_count} jobs)`}
                            >
                              <div
                                className="bg-primary/80 hover:bg-primary w-full rounded-t transition-all"
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                          )
                        })
                    })()}
                  </div>
                  <div className="border-border/40 text-muted-foreground flex items-center justify-between border-t pt-1.5 font-mono text-[10px]">
                    <span>14 days ago</span>
                    <span>Today</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  No sync activity recorded in the past 30 days.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Projects Directory Section ── */}
      {activeOrg && (
        <div className="space-y-4">
          {/* Section Header with Project Count & Filter Pills */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-foreground text-xl font-bold tracking-tight">
              {projects.length} {projects.length === 1 ? "Project" : "Projects"}
            </h2>

            {/* Environment Filter Pills */}
            <div className="border-border/80 bg-muted/30 flex flex-wrap items-center gap-1 rounded-lg border p-1 text-xs">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setEnvFilter("all")}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  envFilter === "all"
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All ({envStats.total})
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setEnvFilter("development")}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  envFilter === "development"
                    ? "bg-background text-info font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Dev ({envStats.dev})
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setEnvFilter("staging")}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  envFilter === "staging"
                    ? "bg-background text-warning font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Staging ({envStats.staging})
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setEnvFilter("production")}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  envFilter === "production"
                    ? "bg-background text-success font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Prod ({envStats.prod})
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-xl pl-10 text-xs shadow-2xs"
            />
          </div>

          {/* Projects Table / List */}
          {isLoadingOrgData ? (
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
                      onProjectCreated={(newProject) =>
                        handleSelectProject(newProject)
                      }
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
                    <tr className="border-border/60 bg-muted/30 text-muted-foreground border-b text-[11px] font-semibold tracking-wider uppercase">
                      <th className="px-5 py-3.5">Name</th>
                      <th className="px-5 py-3.5">Environment</th>
                      <th className="px-5 py-3.5">Created at</th>
                      <th className="px-5 py-3.5">Databases</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
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

                      const envConfig = envBadgeStyles[
                        project.environment as Environment
                      ] || {
                        label: project.environment,
                        className:
                          "border-muted bg-muted text-muted-foreground",
                      }

                      return (
                        <tr
                          key={project.id}
                          onClick={() => handleSelectProject(project)}
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
                          <td
                            className="px-5 py-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleSelectProject(project)}
                                className="group/btn text-muted-foreground hover:text-foreground gap-1 text-xs"
                              >
                                <span>Open Studio</span>
                                <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                              </Button>

                              {/* Dropdown Menu */}
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
                                <DropdownMenuContent
                                  align="end"
                                  className="w-44 text-xs"
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleSelectProject(project)}
                                    className="cursor-pointer gap-2"
                                  >
                                    <FolderKanban className="h-3.5 w-3.5" />
                                    <span>Open Studio</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() =>
                                      setActiveModalProjectId(project.id)
                                    }
                                    className="cursor-pointer gap-2"
                                  >
                                    <Server className="h-3.5 w-3.5" />
                                    <span>Add Database</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() => setProjectToDelete(project)}
                                    className="text-destructive focus:text-destructive cursor-pointer gap-2"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete Project</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
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
      )}

      {/* ── Add Database Connection Modal (Triggered from Table Action) ── */}
      {activeModalProjectId && (
        <ConnectionWizardModal
          projectId={activeModalProjectId}
          defaultIsSource={true}
          trigger={<span className="hidden" />}
        />
      )}

      {/* ── Delete Project Confirmation Dialog ── */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="text-foreground font-semibold">
                "{projectToDelete?.name}"
              </span>
              ? This action is permanent and will remove all associated database
              connections and pipelines.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (projectToDelete) {
                  deleteMutation.mutate(projectToDelete.id)
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Dashboard
