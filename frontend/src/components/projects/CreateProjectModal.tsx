import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createProjectSchema } from "@/lib/validators"
import { projectKeys } from "@/lib/queryKeys"
import { projectsApi } from "@/api/projects"
import { useWorkspaceStore } from "@/store/workspaceStore"
import type { CreateProjectPayload, Environment, Project } from "@/types"
import { getErrorMessage } from "@/lib/errors"

interface CreateProjectModalProps {
  onProjectCreated?: (project: Project) => void
  trigger?: React.ReactNode
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50)

  if (base.length >= 2) return base
  return base
    ? `${base}-${Math.floor(1000 + Math.random() * 9000)}`
    : `proj-${Math.floor(1000 + Math.random() * 9000)}`
}

export function CreateProjectModal({
  onProjectCreated,
  trigger,
}: CreateProjectModalProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { activeOrg, setActiveProjectId } = useWorkspaceStore()
  const [selectedEnv, setSelectedEnv] = useState<Environment>("development")

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateProjectPayload>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      environment: "development",
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectPayload) => {
      if (!activeOrg?.id) {
        throw new Error(
          "Please select an active organization before creating a project."
        )
      }
      const slug = generateSlug(data.name)
      const payload: CreateProjectPayload = {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || undefined,
        environment: data.environment,
      }
      const res = await projectsApi.create(activeOrg.id, payload)
      return res.data
    },
    onSuccess: (newProject) => {
      if (activeOrg?.id) {
        queryClient.invalidateQueries({
          queryKey: projectKeys.byOrg(activeOrg.id),
        })
      }
      if (newProject?.id) {
        setActiveProjectId(newProject.id)
      }
      setOpen(false)
      reset()
      setSelectedEnv("development")
      if (newProject) {
        onProjectCreated?.(newProject)
      }
    },
  })

  const onSubmit = (data: CreateProjectPayload) => {
    createMutation.mutate(data)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          reset()
          setSelectedEnv("development")
          createMutation.reset()
        }
      }}
    >
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button className="gap-2 font-semibold shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Create Project</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="h-4 w-4" />
            <span>Database Workspace</span>
          </div>
          <DialogTitle className="text-xl">Create New Project</DialogTitle>
          <DialogDescription>
            Group database connections, schemas, and migration pipelines under a
            dedicated project workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Project Name */}
          <div className="space-y-1.5">
            <Label htmlFor="projectName" className="text-xs font-semibold">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="projectName"
              placeholder="e.g. Core Production DB"
              {...register("name")}
              disabled={createMutation.isPending}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            )}
          </div>

          {/* Environment Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Environment</Label>
            <RadioGroup
              value={selectedEnv}
              onValueChange={(val) => {
                const env = val as Environment
                setSelectedEnv(env)
                setValue("environment", env, { shouldValidate: true })
              }}
              className="grid grid-cols-3 gap-2 pt-1"
            >
              <div>
                <RadioGroupItem
                  value="development"
                  id="env-dev"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="env-dev"
                  className="border-border/80 bg-card peer-data-checked:border-info peer-data-checked:bg-info/10 peer-data-checked:text-info hover:bg-muted/50 flex cursor-pointer flex-col items-center justify-center rounded-lg border p-2.5 text-center text-xs font-medium transition-all"
                >
                  <span className="font-semibold">Dev</span>
                  <span className="text-muted-foreground text-[10px]">
                    Sandbox
                  </span>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="staging"
                  id="env-staging"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="env-staging"
                  className="border-border/80 bg-card peer-data-checked:border-warning peer-data-checked:bg-warning/10 peer-data-checked:text-warning hover:bg-muted/50 flex cursor-pointer flex-col items-center justify-center rounded-lg border p-2.5 text-center text-xs font-medium transition-all"
                >
                  <span className="font-semibold">Staging</span>
                  <span className="text-muted-foreground text-[10px]">
                    Pre-prod
                  </span>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="production"
                  id="env-prod"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="env-prod"
                  className="border-border/80 bg-card peer-data-checked:border-success peer-data-checked:bg-success/10 peer-data-checked:text-success hover:bg-muted/50 flex cursor-pointer flex-col items-center justify-center rounded-lg border p-2.5 text-center text-xs font-medium transition-all"
                >
                  <span className="font-semibold">Prod</span>
                  <span className="text-muted-foreground text-[10px]">
                    Live
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="projectDesc" className="text-xs font-semibold">
              Description (Optional)
            </Label>
            <Textarea
              id="projectDesc"
              placeholder="Brief description of the database workloads and sync frequency..."
              {...register("description")}
              rows={3}
              disabled={createMutation.isPending}
            />
            {errors.description && (
              <p className="text-destructive text-xs">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Server Error Display */}
          {createMutation.isError && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border p-3 text-xs">
              {getErrorMessage(
                createMutation.error,
                "Unable to create project workspace. Please ensure the project name or slug is unique in this organization."
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="gap-2"
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>Create Project</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateProjectModal
