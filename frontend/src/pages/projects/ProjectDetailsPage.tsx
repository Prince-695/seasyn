import { useEffect, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Database,
  Server,
  Plus,
  Loader2,
  FolderKanban,
  AlertTriangle,
  ArrowRight,
  Activity,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProjectConnectionSection } from "@/components/projects/ProjectConnectionSection"
import { ConnectionWizardModal } from "@/components/connections/ConnectionWizardModal"
import { EngineIcon } from "@/components/connections/EngineIcon"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { projectKeys, connectionKeys, analyticsKeys } from "@/lib/queryKeys"
import { projectsApi } from "@/api/projects"
import { analyticsApi } from "@/api/analytics"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { cn } from "@/lib/utils"
import type { PublicDatabaseConnection } from "@/types"
import type { TopologyNode } from "@/types/analytics"
import { ENVIRONMENT_CONFIG } from "@/lib/constants/environments"

export function ProjectDetailsPage() {
  const params = useParams<{ projectSlug?: string; projectId?: string }>()
  const projectSlugOrId = params.projectSlug || params.projectId || ""
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeOrg, setActiveProjectId, setActiveProject } =
    useWorkspaceStore()

  // 1. Fetch organization projects to resolve slug to ID
  const { data: orgProjects = [], isLoading: isOrgProjectsLoading } = useQuery({
    queryKey: projectKeys.list(activeOrg?.id || "none"),
    queryFn: async () => {
      if (!activeOrg?.id) return []
      const res = await projectsApi.list(activeOrg.id)
      return res.data || []
    },
    enabled: !!activeOrg?.id,
  })

  const matchedProjectFromList = useMemo(() => {
    if (!projectSlugOrId) return null
    return (
      orgProjects.find(
        (p) => p.slug === projectSlugOrId || p.id === projectSlugOrId
      ) || null
    )
  }, [orgProjects, projectSlugOrId])

  const actualProjectId = matchedProjectFromList?.id || projectSlugOrId || ""

  // Sync active project id in workspace store
  useEffect(() => {
    if (actualProjectId) {
      setActiveProjectId(actualProjectId)
    }
  }, [actualProjectId, setActiveProjectId])

  // Fetch Project Details
  const {
    data: projectDetail,
    isLoading: isProjectDetailLoading,
    isError: isProjectDetailError,
  } = useQuery({
    queryKey: projectKeys.detail(activeOrg?.id || "", actualProjectId),
    queryFn: async () => {
      if (!activeOrg?.id || !actualProjectId) return null
      try {
        const res = await projectsApi.get(activeOrg.id, actualProjectId)
        return res.data
      } catch (err) {
        if (matchedProjectFromList) return matchedProjectFromList
        throw err
      }
    },
    enabled: !!activeOrg?.id && !!actualProjectId,
  })

  const project = projectDetail || matchedProjectFromList
  const isProjectLoading =
    (isOrgProjectsLoading && !project) || (isProjectDetailLoading && !project)
  const isProjectError = isProjectDetailError && !project

  // Sync full project metadata into workspace store
  useEffect(() => {
    if (project) {
      setActiveProject({
        id: project.id,
        slug: project.slug,
        name: project.name,
        environment: project.environment,
      })
    }
  }, [project, setActiveProject])

  // Fetch Database Connections for this Project
  const { data: connections = [], isLoading: isConnectionsLoading } = useQuery({
    queryKey: connectionKeys.list(activeOrg?.id || "", actualProjectId),
    queryFn: async () => {
      if (!activeOrg?.id || !actualProjectId) return []
      const res = await projectsApi.listConnections(
        activeOrg.id,
        actualProjectId
      )
      return res.data || []
    },
    enabled: !!activeOrg?.id && !!actualProjectId,
  })

  // Fetch Project Analytics & Topology Flow from Backend
  const { data: projectAnalytics } = useQuery({
    queryKey: analyticsKeys.project(activeOrg?.id || "", actualProjectId),
    queryFn: async () => {
      if (!activeOrg?.id || !actualProjectId) return null
      const res = await analyticsApi.getProjectAnalytics(
        activeOrg.id,
        actualProjectId
      )
      return res.data || null
    },
    enabled: !!activeOrg?.id && !!actualProjectId,
  })

  // Delete Connection Mutation
  const deleteConnectionMutation = useMutation({
    mutationFn: async (connId: string) => {
      if (!activeOrg?.id || !actualProjectId) {
        throw new Error(
          "Unable to delete connection: missing organization or project context. Please refresh and try again."
        )
      }
      await projectsApi.deleteConnection(activeOrg.id, actualProjectId, connId)
    },
    onSuccess: () => {
      if (activeOrg?.id && actualProjectId) {
        queryClient.invalidateQueries({
          queryKey: connectionKeys.list(activeOrg.id, actualProjectId),
        })
      }
    },
  })

  const handleDeleteConnection = (conn: PublicDatabaseConnection) => {
    deleteConnectionMutation.mutate(conn.id)
  }

  const sourceConnections = connections.filter((c) => c.is_source)
  const targetConnections = connections.filter((c) => !c.is_source)

  const nodeMap = useMemo(() => {
    const map = new Map<string, TopologyNode>()
    projectAnalytics?.topology_nodes?.forEach((n) => map.set(n.id, n))
    return map
  }, [projectAnalytics?.topology_nodes])

  if (isProjectLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">
          Loading project workspace...
        </p>
      </div>
    )
  }

  if (isProjectError || !project) {
    return (
      <div className="space-y-6">
        <Link
          to="/projects"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects</span>
        </Link>
        <div className="border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center rounded-2xl border p-12 text-center">
          <AlertTriangle className="text-destructive h-10 w-10" />
          <h3 className="text-foreground mt-3 text-base font-semibold">
            Project Not Found
          </h3>
          <p className="text-muted-foreground mt-1 max-w-md text-xs">
            This project could not be found or you may not have permission to
            access it within this organization.
          </p>
          <Button
            onClick={() => navigate("/projects")}
            className="mt-5"
            size="sm"
          >
            Return to Projects List
          </Button>
        </div>
      </div>
    )
  }

  const envConfig = (project?.environment &&
    ENVIRONMENT_CONFIG[project.environment]) || {
    label: project?.environment || "Dev",
    className: "border-muted bg-muted text-muted-foreground",
  }

  return (
    <div className="space-y-6">
      {/* ── Main Studio Header Strip (Plain on background, matching Image 1) ── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-semibold">
                {project.name}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "px-2 py-0.5 font-mono text-xs",
                  envConfig.className
                )}
              >
                {envConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {project.description ||
                "Database studio, schemas, and live connection workbench."}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <PermissionGuard allowedRoles={["owner", "admin"]}>
            <ConnectionWizardModal
              projectId={project.id}
              defaultIsSource={true}
              trigger={
                <Button size="sm" className="gap-2 font-semibold shadow-xs">
                  <Plus className="h-4 w-4" />
                  <span>Add Database</span>
                </Button>
              }
            />
          </PermissionGuard>
        </div>
      </div>

      {/* ── Project Quick Metrics Strip (Real backend quota & intelligence) ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border-border/70 bg-card rounded-lg border p-3.5 shadow-xs">
          <span className="text-muted-foreground text-xs font-medium">
            Total Databases
          </span>
          <p className="text-foreground mt-1 font-mono text-lg font-semibold">
            {projectAnalytics?.connection_quota
              ? `${projectAnalytics.connection_quota.used} / ${projectAnalytics.connection_quota.max}`
              : connections.length}
          </p>
        </div>

        <div className="border-border/70 bg-card rounded-lg border p-3.5 shadow-xs">
          <span className="text-info text-xs font-medium">
            Source DBs (Inbound)
          </span>
          <p className="text-info mt-1 font-mono text-lg font-semibold">
            {projectAnalytics?.connection_quota?.sources_count ??
              sourceConnections.length}
          </p>
        </div>

        <div className="border-border/70 bg-card rounded-lg border p-3.5 shadow-xs">
          <span className="text-success text-xs font-medium">
            Target DBs (Outbound)
          </span>
          <p className="text-success mt-1 font-mono text-lg font-semibold">
            {projectAnalytics?.connection_quota?.targets_count ??
              targetConnections.length}
          </p>
        </div>

        <div className="border-border/70 bg-card rounded-lg border p-3.5 shadow-xs">
          <span className="text-muted-foreground text-xs font-medium">
            Data Flow Routes
          </span>
          <div className="text-foreground mt-1 flex items-center gap-1.5 font-mono text-lg font-semibold">
            <span>{projectAnalytics?.topology_edges?.length ?? 0}</span>
            <span className="text-muted-foreground text-xs font-normal">
              active routes
            </span>
          </div>
        </div>
      </div>

      {/* ── Data Flow & Sync Intelligence ── */}
      {projectAnalytics?.topology_edges?.length ||
      projectAnalytics?.top_tables?.length ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Data Flow Routes */}
          <div className="border-border/70 bg-card rounded-xl border p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="text-foreground text-sm font-semibold sm:text-base">
                  Data Flow Routes
                </h3>
              </div>
              <span className="text-muted-foreground text-xs">
                {projectAnalytics?.topology_edges?.length || 0} active routes
              </span>
            </div>

            {projectAnalytics?.topology_edges &&
            projectAnalytics.topology_edges.length > 0 ? (
              <div className="space-y-2.5">
                {projectAnalytics.topology_edges.map((edge) => {
                  const srcNode = nodeMap.get(edge.source_id)
                  const tgtNode = nodeMap.get(edge.target_id)
                  return (
                    <div
                      key={`${edge.source_id}-${edge.target_id}`}
                      className="border-border/60 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {srcNode && (
                          <EngineIcon
                            engine={srcNode.db_type}
                            className="h-4 w-4"
                          />
                        )}
                        <span className="text-foreground font-medium">
                          {srcNode?.name || "Source DB"}
                        </span>
                      </div>

                      <div className="flex flex-col items-center px-2 text-[10px]">
                        <span className="text-muted-foreground font-mono">
                          {edge.total_rows_transferred.toLocaleString()} rows
                        </span>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <span className="bg-border h-0.5 w-8" />
                          <ArrowRight className="h-3 w-3" />
                        </div>
                        {edge.active_pipelines > 0 && (
                          <span className="text-info animate-pulse font-medium">
                            Syncing live
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {tgtNode && (
                          <EngineIcon
                            engine={tgtNode.db_type}
                            className="h-4 w-4"
                          />
                        )}
                        <span className="text-foreground font-medium">
                          {tgtNode?.name || "Target DB"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground py-6 text-center text-xs">
                No migrations executed between databases in this project yet.
              </p>
            )}
          </div>

          {/* Top Synchronized Tables */}
          <div className="border-border/70 bg-card rounded-xl border p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-info/10 text-info flex h-7 w-7 items-center justify-center rounded-lg">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="text-foreground text-sm font-semibold sm:text-base">
                  Most Active Tables
                </h3>
              </div>
              <span className="text-muted-foreground text-xs">
                Top transferred
              </span>
            </div>

            {projectAnalytics?.top_tables &&
            projectAnalytics.top_tables.length > 0 ? (
              <div className="space-y-2">
                {projectAnalytics.top_tables.map((table, idx) => (
                  <div
                    key={table.table_name || idx}
                    className="border-border/50 bg-muted/20 flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-mono text-[11px]">
                        #{idx + 1}
                      </span>
                      <span className="text-foreground font-mono font-medium">
                        {table.table_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {table.sync_runs}{" "}
                        {table.sync_runs === 1 ? "run" : "runs"}
                      </span>
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px]"
                      >
                        {table.rows_migrated.toLocaleString()} rows
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-6 text-center text-xs">
                No table sync statistics available yet.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* Database Connections Studio Canvas */}
      <div className="space-y-8 pt-2">
        {/* Section A: Source Databases */}
        <ProjectConnectionSection
          title="Source Databases"
          description="Databases read by SEASYN for schema extraction and data introspection."
          icon={Database}
          iconBadgeClass="border-info/30 bg-info/10 text-info"
          connections={sourceConnections}
          isLoading={isConnectionsLoading}
          isSource={true}
          projectId={project.id}
          addBtnText="Add Source DB"
          emptyTitle="No Source Databases Configured"
          emptyDesc="Add a PostgreSQL, MySQL, MongoDB, or SQLite database to begin inspecting schemas and running migrations."
          emptyBtnText="Configure First Source"
          onDelete={handleDeleteConnection}
          onInspectSchema={(c) =>
            navigate(
              `/editor?project=${project.slug || project.id}&conn=${c.name || c.id}`
            )
          }
        />

        {/* Section B: Target Databases */}
        <ProjectConnectionSection
          title="Target Databases"
          description="Destination databases to receive converted schemas and synchronized records."
          icon={Server}
          iconBadgeClass="border-success/30 bg-success/10 text-success"
          connections={targetConnections}
          isLoading={isConnectionsLoading}
          isSource={false}
          projectId={project.id}
          addBtnText="Add Target DB"
          emptyTitle="No Target Databases Configured"
          emptyDesc="Add target database connections to receive converted schema definitions and migrated data."
          emptyBtnText="Configure First Target"
          onDelete={handleDeleteConnection}
          onInspectSchema={(c) =>
            navigate(
              `/editor?project=${project.slug || project.id}&conn=${c.name || c.id}`
            )
          }
          className="border-border/60 border-t pt-4"
        />
      </div>
    </div>
  )
}
