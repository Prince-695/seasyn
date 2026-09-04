import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Database,
  Server,
  Settings,
  Plus,
  Calendar,
  Loader2,
  FolderKanban,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ConnectionCard } from "@/components/connections/ConnectionCard"
import { ConnectionWizardModal } from "@/components/connections/ConnectionWizardModal"
import { ProjectSettingsTab } from "@/components/projects/ProjectSettingsTab"
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
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeOrg, setActiveProjectId } = useWorkspaceStore()
  const [activeTab, setActiveTab] = useState("connections")

  // Sync active project id in workspace store
  useEffect(() => {
    if (projectId) {
      setActiveProjectId(projectId)
    }
  }, [projectId, setActiveProjectId])

  // Fetch Project Details
  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
  } = useQuery({
    queryKey: projectKeys.detail(activeOrg?.id || "", projectId || ""),
    queryFn: async () => {
      if (!activeOrg?.id || !projectId) return null
      const res = await projectsApi.get(activeOrg.id, projectId)
      return res.data
    },
    enabled: !!activeOrg?.id && !!projectId,
  })

  // Fetch Database Connections for this Project
  const { data: connections = [], isLoading: isConnectionsLoading } = useQuery({
    queryKey: connectionKeys.list(activeOrg?.id || "", projectId || ""),
    queryFn: async () => {
      if (!activeOrg?.id || !projectId) return []
      const res = await projectsApi.listConnections(activeOrg.id, projectId)
      return res.data || []
    },
    enabled: !!activeOrg?.id && !!projectId,
  })

  // Delete Connection Mutation
  const deleteConnectionMutation = useMutation({
    mutationFn: async (connId: string) => {
      if (!activeOrg?.id || !projectId) throw new Error("Missing parameters")
      await projectsApi.deleteConnection(activeOrg.id, projectId, connId)
    },
    onSuccess: () => {
      if (activeOrg?.id && projectId) {
        queryClient.invalidateQueries({
          queryKey: connectionKeys.list(activeOrg.id, projectId),
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

  const envConfig = envBadgeStyles[project.environment] || {
    label: project.environment || "Dev",
    className: "border-muted bg-muted text-muted-foreground",
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
    <div className="space-y-6">
      {/* Back Link & Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="group text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Projects Studio</span>
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "px-2.5 py-0.5 font-mono text-xs",
              envConfig.className
            )}
          >
            {envConfig.label} Environment
          </Badge>
        </div>
      </div>

      {/* Main Studio Header Banner */}
      <div className="border-border/80 bg-card relative overflow-hidden rounded-2xl border p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="border-primary/20 bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl border">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold tracking-tight">
                  {project.name}
                </h1>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-muted-foreground font-mono text-xs">
                    slug: {project.slug}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formattedDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {project.description && (
              <p className="text-muted-foreground max-w-2xl text-xs">
                {project.description}
              </p>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
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

        {/* Quick Metrics Strip */}
        <div className="border-border/60 mt-6 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
          <div className="border-border/60 bg-muted/20 rounded-xl border p-3">
            <span className="text-muted-foreground text-[11px] font-medium">
              Total Databases
            </span>
            <p className="text-foreground mt-1 font-mono text-lg font-bold">
              {connections.length}
            </p>
          </div>

          <div className="border-border/60 bg-muted/20 rounded-xl border p-3">
            <span className="text-info text-[11px] font-medium">
              Source DBs (Inbound)
            </span>
            <p className="text-info mt-1 font-mono text-lg font-bold">
              {sourceConnections.length}
            </p>
          </div>

          <div className="border-border/60 bg-muted/20 rounded-xl border p-3">
            <span className="text-success text-[11px] font-medium">
              Target DBs (Outbound)
            </span>
            <p className="text-success mt-1 font-mono text-lg font-bold">
              {targetConnections.length}
            </p>
          </div>

          <div className="border-border/60 bg-muted/20 rounded-xl border p-3">
            <span className="text-muted-foreground text-[11px] font-medium">
              Project Status
            </span>
            <div className="text-success mt-1 flex items-center gap-1.5 font-mono text-xs font-semibold">
              <span className="bg-success h-2 w-2 animate-pulse rounded-full" />
              <span>Active Studio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="border-border/60 flex items-center justify-between border-b pb-3">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="connections" className="gap-2">
              <Database className="h-4 w-4" />
              <span>Database Connections ({connections.length})</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span>Project Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Database Connections Studio */}
        <TabsContent value="connections" className="space-y-8 pt-2">
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
                        `/editor?projectId=${c.project_id}&connId=${c.id}`
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
                        `/editor?projectId=${c.project_id}&connId=${c.id}`
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
        </TabsContent>

        {/* Tab 2: Project Settings */}
        <TabsContent value="settings">
          <ProjectSettingsTab
            project={project}
            connectionsCount={connections.length}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
