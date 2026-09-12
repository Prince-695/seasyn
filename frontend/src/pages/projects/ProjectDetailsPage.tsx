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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConnectionCard } from "@/components/connections/ConnectionCard"
import { ConnectionWizardModal } from "@/components/connections/ConnectionWizardModal"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { projectKeys, connectionKeys } from "@/lib/queryKeys"
import { projectsApi } from "@/api/projects"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { cn } from "@/lib/utils"
import type { Environment, PublicDatabaseConnection } from "@/types"

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
    envBadgeStyles[project.environment as Environment]) || {
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
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
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

      {/* ── Project Quick Metrics Strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border-border/70 bg-card rounded-lg border p-3.5 shadow-xs">
          <span className="text-muted-foreground text-xs font-medium">
            Total Databases
          </span>
          <p className="text-foreground mt-1 font-mono text-lg font-bold">
            {connections.length}
          </p>
        </div>

        <div className="border-border/70 bg-card rounded-lg border p-3.5 shadow-xs">
          <span className="text-info text-xs font-medium">
            Source DBs (Inbound)
          </span>
          <p className="text-info mt-1 font-mono text-lg font-bold">
            {sourceConnections.length}
          </p>
        </div>

        <div className="border-border/70 bg-card rounded-lg border p-3.5 shadow-xs">
          <span className="text-success text-xs font-medium">
            Target DBs (Outbound)
          </span>
          <p className="text-success mt-1 font-mono text-lg font-bold">
            {targetConnections.length}
          </p>
        </div>

        <div className="border-border/70 bg-card rounded-lg border p-3.5 shadow-xs">
          <span className="text-muted-foreground text-xs font-medium">
            Project Status
          </span>
          <div className="text-success mt-1 flex items-center gap-1.5 font-mono text-xs font-semibold">
            <span className="bg-success h-2 w-2 animate-pulse rounded-full" />
            <span>Active Studio</span>
          </div>
        </div>
      </div>

      {/* Database Connections Studio Canvas */}
      <div className="space-y-8 pt-2">
        {/* Section A: Source Databases */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="border-info/30 bg-info/10 text-info flex h-7 w-7 items-center justify-center rounded-lg border">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-foreground text-sm font-semibold">
                  Source Databases ({sourceConnections.length})
                </h3>
                <p className="text-muted-foreground text-[11px]">
                  Databases read by SEASYN for schema extraction and data
                  introspection.
                </p>
              </div>
            </div>

            <PermissionGuard allowedRoles={["owner", "admin"]}>
              <ConnectionWizardModal
                projectId={project.id}
                defaultIsSource={true}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Source DB</span>
                  </Button>
                }
              />
            </PermissionGuard>
          </div>

          {isConnectionsLoading ? (
            <div className="border-border/60 bg-muted/10 flex h-32 items-center justify-center rounded-xl border">
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
            </div>
          ) : sourceConnections.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sourceConnections.map((conn) => (
                <ConnectionCard
                  key={conn.id}
                  connection={conn}
                  onDelete={handleDeleteConnection}
                  onInspectSchema={(c) =>
                    navigate(
                      `/editor?project=${project.slug || project.id}&conn=${c.name || c.id}`
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="border-border/80 bg-muted/10 flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
              <Database className="text-muted-foreground/60 h-8 w-8" />
              <h4 className="text-foreground mt-2 text-xs font-semibold">
                No Source Databases Configured
              </h4>
              <p className="text-muted-foreground mt-1 max-w-sm text-[11px]">
                Add a PostgreSQL, MySQL, MongoDB, or SQLite database to begin
                inspecting schemas and running migrations.
              </p>
              <PermissionGuard allowedRoles={["owner", "admin"]}>
                <div className="mt-3">
                  <ConnectionWizardModal
                    projectId={project.id}
                    defaultIsSource={true}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Configure First Source</span>
                      </Button>
                    }
                  />
                </div>
              </PermissionGuard>
            </div>
          )}
        </div>

        {/* Section B: Target Databases */}
        <div className="border-border/60 space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="border-success/30 bg-success/10 text-success flex h-7 w-7 items-center justify-center rounded-lg border">
                <Server className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-foreground text-sm font-semibold">
                  Target Databases ({targetConnections.length})
                </h3>
                <p className="text-muted-foreground text-[11px]">
                  Destination databases to receive converted schemas and
                  synchronized records.
                </p>
              </div>
            </div>

            <PermissionGuard allowedRoles={["owner", "admin"]}>
              <ConnectionWizardModal
                projectId={project.id}
                defaultIsSource={false}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Target DB</span>
                  </Button>
                }
              />
            </PermissionGuard>
          </div>

          {isConnectionsLoading ? (
            <div className="border-border/60 bg-muted/10 flex h-32 items-center justify-center rounded-xl border">
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
            </div>
          ) : targetConnections.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {targetConnections.map((conn) => (
                <ConnectionCard
                  key={conn.id}
                  connection={conn}
                  onDelete={handleDeleteConnection}
                  onInspectSchema={(c) =>
                    navigate(
                      `/editor?project=${project.slug || project.id}&conn=${c.name || c.id}`
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="border-border/80 bg-muted/10 flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
              <Server className="text-muted-foreground/60 h-8 w-8" />
              <h4 className="text-foreground mt-2 text-xs font-semibold">
                No Target Databases Configured
              </h4>
              <p className="text-muted-foreground mt-1 max-w-sm text-[11px]">
                Add target database connections to receive converted schema
                definitions and migrated data.
              </p>
              <PermissionGuard allowedRoles={["owner", "admin"]}>
                <div className="mt-3">
                  <ConnectionWizardModal
                    projectId={project.id}
                    defaultIsSource={false}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Configure First Target</span>
                      </Button>
                    }
                  />
                </div>
              </PermissionGuard>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
