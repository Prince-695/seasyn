import { useState } from "react"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Building2, Loader2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createOrgSchema, type CreateOrgInput } from "@/lib/validators"
import { orgsApi } from "@/api/orgs"
import { orgKeys } from "@/lib/queryKeys"
import { useWorkspaceStore } from "@/store/workspaceStore"
import axios from "axios"

interface CreateOrgModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50)
}

export function CreateOrgModal({ open, onOpenChange }: CreateOrgModalProps) {
  const queryClient = useQueryClient()
  const setActiveOrg = useWorkspaceStore((state) => state.setActiveOrg)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset()
      setServerError(null)
      setIsSlugManuallyEdited(false)
    }
    onOpenChange(nextOpen)
  }

  const createOrgMutation = useMutation({
    mutationFn: (data: CreateOrgInput) => orgsApi.createOrg(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() })
      if (res.data) {
        // Creator is the owner of the newly created organization
        setActiveOrg(res.data, "owner")
      }
      handleOpenChange(false)
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        setServerError(
          err.response?.data?.message ??
            err.response?.data?.error ??
            "Failed to create organization. The slug might already be taken."
        )
      } else {
        setServerError("An unexpected error occurred. Please try again.")
      }
    },
  })

  const onSubmit = (data: CreateOrgInput) => {
    setServerError(null)
    createOrgMutation.mutate(data)
  }

  const nameRegister = register("name")

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Set up a new workspace for your team and projects.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {serverError && (
            <div
              role="alert"
              className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm font-medium"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="org-name">
              Organization Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="org-name"
              placeholder="e.g. Acme Corp"
              {...nameRegister}
              onChange={(e) => {
                nameRegister.onChange(e)
                if (!isSlugManuallyEdited) {
                  setValue("slug", generateSlug(e.target.value), {
                    shouldValidate: true,
                  })
                }
              }}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-destructive text-xs font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-slug">
              Slug / Identifier <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="org-slug"
                placeholder="acme-corp"
                {...register("slug")}
                onChange={(e) => {
                  setIsSlugManuallyEdited(true)
                  setValue("slug", e.target.value, { shouldValidate: true })
                }}
                aria-invalid={!!errors.slug}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Unique URL-friendly handle for your workspace.
            </p>
            {errors.slug && (
              <p className="text-destructive text-xs font-medium">
                {errors.slug.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-desc">Description</Label>
            <Textarea
              id="org-desc"
              rows={3}
              placeholder="What does your team or workspace do?"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-destructive text-xs font-medium">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createOrgMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createOrgMutation.isPending}>
              {createOrgMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Organization"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateOrgModal
