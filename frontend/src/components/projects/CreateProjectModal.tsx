import { useState, useEffect } from "react"
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

interface CreateProjectModalProps {
  onProjectCreated?: (project: Project) => void
  trigger?: React.ReactNode
}

export function CreateProjectModal({
  onProjectCreated,
  trigger,
}: CreateProjectModalProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { activeOrg, setActiveProjectId } = useWorkspaceStore()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateProjectPayload>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      environment: "development",
    },
  })

  const projectName = watch("name")
  const selectedEnv = watch("environment") as Environment

  // Auto-generate slug from name if slug hasn't been manually diverged
  const [slugTouched, setSlugTouched] = useState(false)
  useEffect(() => {
    if (!slugTouched && projectName) {
      const generated = projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
      setValue("slug", generated, { shouldValidate: true })
    }
  }, [projectName, slugTouched, setValue])

  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectPayload) => {
      if (!activeOrg?.id) {
        throw new Error("No active organization selected.")
      }
      const res = await projectsApi.create(activeOrg.id, data)
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
      setSlugTouched(false)
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
          setSlugTouched(false)
          createMutation.reset()
        }
      }}
    >
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button className="gap-2 font-semibold">
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
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
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Project Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="projectSlug" className="text-xs font-semibold">
                Project Slug
              </Label>
              <span className="font-mono text-[11px] text-muted-foreground">
                Unique identifier
              </span>
            </div>
            <Input
              id="projectSlug"
              placeholder="core-production-db"
              {...register("slug")}
              onChange={(e) => {
                setSlugTouched(true)
                register("slug").onChange(e)
              }}
              disabled={createMutation.isPending}
            />
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug.message}</p>
            )}
          </div>

          {/* Environment Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Environment</Label>
            <RadioGroup
              value={selectedEnv}
              onValueChange={(val) =>
                setValue("environment", val as Environment)
              }
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
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-border/80 bg-card p-2.5 text-center text-xs font-medium transition-all peer-data-checked:border-info peer-data-checked:bg-info/10 peer-data-checked:text-info hover:bg-muted/50"
                >
                  <span className="font-semibold">Dev</span>
                  <span className="text-[10px] text-muted-foreground">
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
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-border/80 bg-card p-2.5 text-center text-xs font-medium transition-all peer-data-checked:border-warning peer-data-checked:bg-warning/10 peer-data-checked:text-warning hover:bg-muted/50"
                >
                  <span className="font-semibold">Staging</span>
                  <span className="text-[10px] text-muted-foreground">
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
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-border/80 bg-card p-2.5 text-center text-xs font-medium transition-all peer-data-checked:border-success peer-data-checked:bg-success/10 peer-data-checked:text-success hover:bg-muted/50"
                >
                  <span className="font-semibold">Prod</span>
                  <span className="text-[10px] text-muted-foreground">
                    Live data
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="projectDesc" className="text-xs font-semibold">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (Optional)
              </span>
            </Label>
            <Textarea
              id="projectDesc"
              rows={3}
              placeholder="Primary databases and replication target for service..."
              {...register("description")}
              disabled={createMutation.isPending}
            />
          </div>

          {/* Server Error Alert */}
          {createMutation.isError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create project. Please check organization permissions."}
            </div>
          )}

          <DialogFooter className="pt-3">
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
