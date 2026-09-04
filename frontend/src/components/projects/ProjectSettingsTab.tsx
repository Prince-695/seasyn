import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash2, Save, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { updateProjectSchema } from "@/lib/validators"
import { projectKeys } from "@/lib/queryKeys"
import { projectsApi } from "@/api/projects"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { cn } from "@/lib/utils"
import type { Environment, ProjectDetail, UpdateProjectPayload } from "@/types"

interface ProjectSettingsTabProps {
  project: ProjectDetail
  connectionsCount: number
}

export function ProjectSettingsTab({
  project,
  connectionsCount,
}: ProjectSettingsTabProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeOrg, setActiveProjectId } = useWorkspaceStore()
  const [overrideEnv, setOverrideEnv] = useState<Environment | null>(null)
  const selectedEnv = overrideEnv ?? (project?.environment || "development")

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
      if (!activeOrg?.id || !project.id) throw new Error("Missing parameters")
      const res = await projectsApi.update(activeOrg.id, project.id, payload)
      return res.data
    },
    onSuccess: (updated) => {
      if (activeOrg?.id && project.id) {
        queryClient.invalidateQueries({
          queryKey: projectKeys.detail(activeOrg.id, project.id),
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
      if (!activeOrg?.id || !project.id) throw new Error("Missing parameters")
      await projectsApi.delete(activeOrg.id, project.id)
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

  return (
    <div className="space-y-6 pt-2">
      {/* General Metadata Form */}
      <div className="border-border/80 bg-card rounded-2xl border p-6 shadow-xs">
        <h3 className="text-foreground text-base font-semibold">
          General Project Settings
        </h3>
        <p className="text-muted-foreground text-xs">
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
              <p className="text-destructive text-xs">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projectDescription" className="text-xs font-medium">
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
              <p className="text-destructive text-xs">
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
                    ? "border-info bg-info/10 text-foreground ring-info ring-1"
                    : "border-border/80 bg-card hover:bg-muted/30"
                )}
              >
                <RadioGroupItem
                  value="development"
                  id="env-dev"
                  className="sr-only"
                />
                <span className="text-info font-mono text-xs font-semibold">
                  Development
                </span>
                <span className="text-muted-foreground mt-1 text-[10px]">
                  Local / Dev Sandbox
                </span>
              </label>

              <label
                htmlFor="env-staging"
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-between rounded-xl border p-3 text-center transition-all",
                  selectedEnv === "staging"
                    ? "border-warning bg-warning/10 text-foreground ring-warning ring-1"
                    : "border-border/80 bg-card hover:bg-muted/30"
                )}
              >
                <RadioGroupItem
                  value="staging"
                  id="env-staging"
                  className="sr-only"
                />
                <span className="text-warning font-mono text-xs font-semibold">
                  Staging
                </span>
                <span className="text-muted-foreground mt-1 text-[10px]">
                  Pre-prod Validation
                </span>
              </label>

              <label
                htmlFor="env-prod"
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-between rounded-xl border p-3 text-center transition-all",
                  selectedEnv === "production"
                    ? "border-success bg-success/10 text-foreground ring-success ring-1"
                    : "border-border/80 bg-card hover:bg-muted/30"
                )}
              >
                <RadioGroupItem
                  value="production"
                  id="env-prod"
                  className="sr-only"
                />
                <span className="text-success font-mono text-xs font-semibold">
                  Production
                </span>
                <span className="text-muted-foreground mt-1 text-[10px]">
                  Live Production
                </span>
              </label>
            </RadioGroup>
          </div>

          {updateMutation.isSuccess && (
            <div className="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-lg border p-2.5 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Project settings updated successfully.</span>
            </div>
          )}

          {updateMutation.isError && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border p-2.5 text-xs">
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
        <div className="border-destructive/30 bg-destructive/5 rounded-2xl border p-6">
          <h3 className="text-destructive text-base font-semibold">
            Danger Zone
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Permanently delete this project and all its associated database
            connections and migration pipelines. This action cannot be undone.
          </p>

          <div className="mt-4">
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
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
                    <span className="text-foreground font-semibold">
                      "{project.name}"
                    </span>
                    ? All {connectionsCount} database connections and configured
                    pipelines under this project will be permanently deleted.
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
    </div>
  )
}
