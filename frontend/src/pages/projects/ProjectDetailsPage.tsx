import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  Database,
  Server,
  Settings,
  Plus,
  Trash2,
  Calendar,
  Save,
  Loader2,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ConnectionCard } from "@/components/connections/ConnectionCard"
import { ConnectionWizardModal } from "@/components/connections/ConnectionWizardModal"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { updateProjectSchema } from "@/lib/validators"
import { projectKeys, connectionKeys } from "@/lib/queryKeys"
import { projectsApi } from "@/api/projects"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { cn } from "@/lib/utils"
import type {
  Environment,
  PublicDatabaseConnection,
  UpdateProjectPayload,
} from "@/types"

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
  const [wizardOpenKey, setWizardOpenKey] = useState(0)

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

  const [overrideEnv, setOverrideEnv] = useState<Environment | null>(null)
  const selectedEnv = overrideEnv ?? (project?.environment || "development")

  // Form for Project Settings
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProjectPayload>({
    resolver: zodResolver(updateProjectSchema),
    values: project
      ? {
          name: project.name,
          description: project.description || "",
          environment: project.environment,
        }
      : undefined,
  })

  // Update Project Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateProjectPayload) => {
      if (!activeOrg?.id || !projectId) throw new Error("Missing parameters")
      const res = await projectsApi.update(activeOrg.id, projectId, payload)
      return res.data
    },
    onSuccess: (updated) => {
      if (activeOrg?.id && projectId) {
        queryClient.invalidateQueries({
          queryKey: projectKeys.detail(activeOrg.id, projectId),
        })
        queryClient.invalidateQueries({
          queryKey: projectKeys.list(activeOrg.id),
        })
      }
      setOverrideEnv(null)
      if (updated) {
        reset({
          name: updated.name,
          description: updated.description || "",
          environment: updated.environment,
        })
      }
    },
  })

  // Delete Project Mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      if (!activeOrg?.id || !projectId) throw new Error("Missing parameters")
      await projectsApi.delete(activeOrg.id, projectId)
    },
    onSuccess: () => {
      if (activeOrg?.id) {
        queryClient.invalidateQueries({
          queryKey: projectKeys.list(activeOrg.id),
        })
      }
      setActiveProjectId(null)
      navigate("/projects")
    },
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
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
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects</span>
        </Link>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-12 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <h3 className="mt-3 text-base font-semibold text-foreground">
            Project Not Found
          </h3>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
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

  const handleOpenSourceWizard = () => {
    setWizardOpenKey((k) => k + 1)
  }

  const handleOpenTargetWizard = () => {
    setWizardOpenKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      {/* Back Link & Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="group inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
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
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {project.name}
                </h1>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    slug: {project.slug}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formattedDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {project.description && (
              <p className="max-w-2xl text-xs text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <PermissionGuard allowedRoles={["owner", "admin"]}>
              <ConnectionWizardModal
                key={`source-btn-${wizardOpenKey}`}
                projectId={project.id}
                defaultIsSource={true}
                trigger={
                  <Button
                    size="sm"
                    className="gap-2 font-semibold shadow-xs"
                    onClick={handleOpenSourceWizard}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Database</span>
                  </Button>
                }
              />
            </PermissionGuard>
          </div>
        </div>

        {/* Quick Metrics Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <span className="text-[11px] font-medium text-muted-foreground">
              Total Databases
            </span>
            <p className="mt-1 font-mono text-lg font-bold text-foreground">
              {connections.length}
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <span className="text-[11px] font-medium text-info">
              Source DBs (Inbound)
            </span>
            <p className="mt-1 font-mono text-lg font-bold text-info">
              {sourceConnections.length}
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <span className="text-[11px] font-medium text-success">
              Target DBs (Outbound)
            </span>
            <p className="mt-1 font-mono text-lg font-bold text-success">
              {targetConnections.length}
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <span className="text-[11px] font-medium text-muted-foreground">
              Project Status
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-xs font-semibold text-success">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
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
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
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
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-info/30 bg-info/10 text-info">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Source Databases ({sourceConnections.length})
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Databases read by SEASYN for schema extraction and data
                    introspection.
                  </p>
                </div>
              </div>

              <PermissionGuard allowedRoles={["owner", "admin"]}>
                <ConnectionWizardModal
                  key={`src-add-${wizardOpenKey}`}
                  projectId={project.id}
                  defaultIsSource={true}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs font-medium"
                      onClick={handleOpenSourceWizard}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Source DB</span>
                    </Button>
                  }
                />
              </PermissionGuard>
            </div>

            {isConnectionsLoading ? (
              <div className="flex h-32 items-center justify-center rounded-xl border border-border/60 bg-muted/10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : sourceConnections.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sourceConnections.map((conn) => (
                  <ConnectionCard
                    key={conn.id}
                    connection={conn}
                    onDelete={handleDeleteConnection}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 p-8 text-center">
                <Database className="h-8 w-8 text-muted-foreground/60" />
                <h4 className="mt-2 text-xs font-semibold text-foreground">
                  No Source Databases Configured
                </h4>
                <p className="mt-1 max-w-sm text-[11px] text-muted-foreground">
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
          <div className="space-y-4 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-success/30 bg-success/10 text-success">
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Target Databases ({targetConnections.length})
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Destination databases to receive converted schemas and
                    synchronized records.
                  </p>
                </div>
              </div>

              <PermissionGuard allowedRoles={["owner", "admin"]}>
                <ConnectionWizardModal
                  key={`tgt-add-${wizardOpenKey}`}
                  projectId={project.id}
                  defaultIsSource={false}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs font-medium"
                      onClick={handleOpenTargetWizard}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Target DB</span>
                    </Button>
                  }
                />
              </PermissionGuard>
            </div>

            {isConnectionsLoading ? (
              <div className="flex h-32 items-center justify-center rounded-xl border border-border/60 bg-muted/10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : targetConnections.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {targetConnections.map((conn) => (
                  <ConnectionCard
                    key={conn.id}
                    connection={conn}
                    onDelete={handleDeleteConnection}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 p-8 text-center">
                <Server className="h-8 w-8 text-muted-foreground/60" />
                <h4 className="mt-2 text-xs font-semibold text-foreground">
                  No Target Databases Configured
                </h4>
                <p className="mt-1 max-w-sm text-[11px] text-muted-foreground">
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
        <TabsContent value="settings" className="space-y-6 pt-2">
          {/* General Metadata Form */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
            <h3 className="text-base font-semibold text-foreground">
              General Project Settings
            </h3>
            <p className="text-xs text-muted-foreground">
              Update project details and deployment environment tagging.
            </p>

            <form
              onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
              className="mt-6 max-w-xl space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="projectName" className="text-xs font-medium">
                  Project Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="projectName"
                  placeholder="e.g. Core Billing Platform"
                  {...register("name")}
                  disabled={updateMutation.isPending}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="projectDescription"
                  className="text-xs font-medium"
                >
                  Description
                </Label>
                <Textarea
                  id="projectDescription"
                  placeholder="Describe the scope and purpose of this project..."
                  {...register("description")}
                  rows={3}
                  disabled={updateMutation.isPending}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <Label className="text-xs font-medium">
                  Environment Tier <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={selectedEnv}
                  onValueChange={(val) => {
                    const env = val as Environment
                    setOverrideEnv(env)
                    setValue("environment", env, {
                      shouldDirty: true,
                    })
                  }}
                  className="grid grid-cols-3 gap-3"
                  disabled={updateMutation.isPending}
                >
                  <label
                    htmlFor="env-dev"
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-between rounded-xl border p-3 text-center transition-all",
                      selectedEnv === "development"
                        ? "border-info bg-info/10 text-foreground ring-1 ring-info"
                        : "border-border/80 bg-card hover:bg-muted/30"
                    )}
                  >
                    <RadioGroupItem
                      value="development"
                      id="env-dev"
                      className="sr-only"
                    />
                    <span className="font-mono text-xs font-semibold text-info">
                      Development
                    </span>
                    <span className="mt-1 text-[10px] text-muted-foreground">
                      Local / Dev Sandbox
                    </span>
                  </label>

                  <label
                    htmlFor="env-staging"
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-between rounded-xl border p-3 text-center transition-all",
                      selectedEnv === "staging"
                        ? "border-warning bg-warning/10 text-foreground ring-1 ring-warning"
                        : "border-border/80 bg-card hover:bg-muted/30"
                    )}
                  >
                    <RadioGroupItem
                      value="staging"
                      id="env-staging"
                      className="sr-only"
                    />
                    <span className="font-mono text-xs font-semibold text-warning">
                      Staging
                    </span>
                    <span className="mt-1 text-[10px] text-muted-foreground">
                      Pre-prod Validation
                    </span>
                  </label>

                  <label
                    htmlFor="env-prod"
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-between rounded-xl border p-3 text-center transition-all",
                      selectedEnv === "production"
                        ? "border-success bg-success/10 text-foreground ring-1 ring-success"
                        : "border-border/80 bg-card hover:bg-muted/30"
                    )}
                  >
                    <RadioGroupItem
                      value="production"
                      id="env-prod"
                      className="sr-only"
                    />
                    <span className="font-mono text-xs font-semibold text-success">
                      Production
                    </span>
                    <span className="mt-1 text-[10px] text-muted-foreground">
                      Live Production
                    </span>
                  </label>
                </RadioGroup>
              </div>

              {updateMutation.isSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-2.5 text-xs text-success">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Project settings updated successfully.</span>
                </div>
              )}

              {updateMutation.isError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                  {updateMutation.error instanceof Error
                    ? updateMutation.error.message
                    : "Failed to update project settings."}
                </div>
              )}

              <PermissionGuard allowedRoles={["owner", "admin"]}>
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={!isDirty || updateMutation.isPending}
                    className="gap-2"
                    size="sm"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>Save Changes</span>
                  </Button>
                </div>
              </PermissionGuard>
            </form>
          </div>

          {/* Danger Zone */}
          <PermissionGuard allowedRoles={["owner", "admin"]}>
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
              <h3 className="text-base font-semibold text-destructive">
                Danger Zone
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Permanently delete this project and all its associated database
                connections and migration pipelines. This action cannot be
                undone.
              </p>

              <div className="mt-4">
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      />
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Project</span>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">
                        Delete Project Permanently?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-foreground">
                          "{project.name}"
                        </span>
                        ? All {connections.length} database connections and
                        configured pipelines under this project will be
                        permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteProjectMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteProjectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Yes, Delete Project"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </PermissionGuard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
