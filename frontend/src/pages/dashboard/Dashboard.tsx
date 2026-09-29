import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Building2, Plus, Loader2 } from "lucide-react"
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
import { useOrgConnections } from "@/hooks/useOrgConnections"
import { Button } from "@/components/ui/button"
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
import { DashboardMetricStrip } from "@/components/dashboard/DashboardMetricStrip"
import { DashboardAnalyticsCards } from "@/components/dashboard/DashboardAnalyticsCards"
import {
  DashboardProjectsTable,
  type EnvFilter,
} from "@/components/dashboard/DashboardProjectsTable"
import type { Project } from "@/types"

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

  // Fetch organization-wide analytics overview from backend
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

  // Aggregate metrics from backend analytics overview
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
          <h1 className="text-foreground text-2xl font-medium sm:text-3xl">
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
                  <Button className="gap-2 font-medium shadow-xs">
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

      {/* ── Empty Org State ── */}
      {!activeOrg && (
        <div className="border-border/80 bg-card/30 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center shadow-xs">
          <div className="bg-primary/10 text-primary mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
            <Building2 className="h-7 w-7" />
          </div>
          <h3 className="text-foreground text-lg font-medium">
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

      {/* ── Top Aggregate Metrics Strip ── */}
      {activeOrg && (
        <DashboardMetricStrip
          runningPipelines={orgMetrics.runningPipelines}
          totalPipelines={orgMetrics.totalPipelines}
          totalRowsSynced={orgMetrics.totalRowsSynced}
          totalDatabases={orgMetrics.totalDatabases}
          totalProjects={orgMetrics.totalProjects}
          orgName={activeOrg.name}
        />
      )}

      {/* ── Organization Analytics: Quotas & Infrastructure Breakdown ── */}
      {activeOrg && orgOverview && (
        <DashboardAnalyticsCards
          orgName={activeOrg.name}
          successRate={orgOverview.migration_health.success_rate}
          quotas={orgOverview.quotas}
          connectionsCount={connections.length}
          engineDistribution={orgOverview.engine_distribution}
          completedMigrations={orgOverview.migration_health.completed}
          velocityTimeline={orgOverview.velocity_timeline}
        />
      )}

      {/* ── Projects Directory Section ── */}
      {activeOrg && (
        <DashboardProjectsTable
          projects={projects}
          filteredProjects={filteredProjects}
          connections={connections}
          isLoading={isLoadingOrgData}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          envFilter={envFilter}
          onEnvFilterChange={setEnvFilter}
          envStats={envStats}
          onSelectProject={handleSelectProject}
          onAddDatabase={(projectId) => setActiveModalProjectId(projectId)}
          onDeleteProject={(project) => setProjectToDelete(project)}
        />
      )}

      {/* ── Add Database Connection Modal ── */}
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
              <span className="text-foreground font-medium">
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
