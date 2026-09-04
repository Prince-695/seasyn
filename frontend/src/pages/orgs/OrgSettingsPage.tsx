import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Settings,
  Building2,
  Trash2,
  AlertTriangle,
  Loader2,
  Check,
  AlertCircle,
  ShieldAlert,
  ArrowRightLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { updateOrgSchema, type UpdateOrgInput } from "@/lib/validators"
import { orgsApi } from "@/api/orgs"
import { orgKeys } from "@/lib/queryKeys"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { useHasPermission } from "@/hooks/useHasPermission"
import { RoleBadge } from "@/components/orgs/RoleBadge"

import axios from "axios"

export function OrgSettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeOrg, currentRole, setActiveOrg, clearWorkspace } =
    useWorkspaceStore()

  const canEditGeneral = useHasPermission(["owner", "admin"])

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [transferModalOpen, setTransferModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateOrgInput>({
    resolver: zodResolver(updateOrgSchema),
    defaultValues: {
      name: activeOrg?.name ?? "",
      description: activeOrg?.description ?? "",
    },
  })

  // Sync form defaults when activeOrg changes
  useEffect(() => {
    if (activeOrg) {
      reset({
        name: activeOrg.name,
        description: activeOrg.description ?? "",
      })
    }
  }, [activeOrg, reset])

  // Update org mutation
  const updateOrgMutation = useMutation({
    mutationFn: async (data: UpdateOrgInput) => {
      if (!activeOrg?.id) throw new Error("No active organization")
      return orgsApi.updateOrg(activeOrg.id, data)
    },
    onSuccess: (res) => {
      setGeneralSuccess("Organization details updated successfully.")
      setGeneralError(null)
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() })
      if (res.data && currentRole) {
        setActiveOrg(res.data, currentRole)
      }
      setTimeout(() => setGeneralSuccess(null), 4000)
    },
    onError: (err: unknown) => {
      setGeneralSuccess(null)
      if (axios.isAxiosError(err)) {
        setGeneralError(
          err.response?.data?.message ??
            err.response?.data?.error ??
            "Failed to update organization details."
        )
      } else {
        setGeneralError("An unexpected error occurred. Please try again.")
      }
    },
  })

  // Delete org mutation
  const deleteOrgMutation = useMutation({
    mutationFn: async () => {
      if (!activeOrg?.id) throw new Error("No active organization")
      return orgsApi.deleteOrg(activeOrg.id)
    },
    onSuccess: () => {
      clearWorkspace()
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() })
      setDeleteModalOpen(false)
      navigate("/dashboard", { replace: true })
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        setDeleteError(
          err.response?.data?.message ??
            err.response?.data?.error ??
            "Failed to delete organization. Please check permissions."
        )
      } else {
        setDeleteError("An unexpected error occurred. Please try again.")
      }
    },
  })

  if (!activeOrg) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Building2 className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">
            No Active Organization
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Please select or create an organization from the workspace switcher
            in the header.
          </p>
        </div>
      </div>
    )
  }

  const expectedDeletePhrase = `DELETE ${activeOrg.name}`
  const isDeleteConfirmed = deleteConfirmText.trim() === expectedDeletePhrase

  const onSubmitGeneral = (data: UpdateOrgInput) => {
    setGeneralSuccess(null)
    setGeneralError(null)
    updateOrgMutation.mutate(data)
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Organization Settings
              </h1>
              {currentRole && <RoleBadge role={currentRole} />}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage organization preferences, slug identifier, and
              administrative actions.
            </p>
          </div>
        </div>
      </div>

      {/* General Settings Card */}
      <Card className="border-border/60 bg-card/40 shadow-sm backdrop-blur-xs">
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Basic details describing this organization workspace.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmitGeneral)}>
          <CardContent className="space-y-5">
            {generalSuccess && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 p-3 text-sm font-medium text-success"
              >
                <Check className="h-4 w-4 shrink-0" />
                <span>{generalSuccess}</span>
              </div>
            )}

            {generalError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  disabled={!canEditGeneral || updateOrgMutation.isPending}
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-slug">Slug Identifier</Label>
                <Input
                  id="org-slug"
                  value={activeOrg.slug}
                  disabled
                  className="cursor-not-allowed bg-muted/50 font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Organization slug is immutable once established.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-description">Description</Label>
              <Textarea
                id="org-description"
                rows={3}
                disabled={!canEditGeneral || updateOrgMutation.isPending}
                placeholder="Describe your organization..."
                {...register("description")}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-xs font-medium text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>

          {canEditGeneral && (
            <CardFooter className="flex justify-end border-t border-border/40 px-6 py-4">
              <Button type="submit" disabled={updateOrgMutation.isPending}>
                {updateOrgMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>

      {/* Danger Zone Card (Owner Only) */}
      <PermissionGuard allowedRoles={["owner"]}>
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm backdrop-blur-xs">
          <CardHeader className="border-b border-destructive/10 pb-4">
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-destructive/80">
              Irreversible and destructive actions restricted exclusively to the
              Organization Owner.
            </CardDescription>
          </CardHeader>

          <CardContent className="divide-y divide-destructive/10 p-0">
            {/* Transfer Ownership */}
            <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Transfer Ownership
                </p>
                <p className="text-xs text-muted-foreground">
                  Transfer the owner role of this organization to another team
                  member.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTransferModalOpen(true)}
                className="shrink-0 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Transfer Ownership
              </Button>
            </div>

            {/* Delete Organization */}
            <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-destructive">
                  Delete Organization
                </p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete this organization, all attached projects,
                  migrations, and connections.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeleteConfirmText("")
                  setDeleteError(null)
                  setDeleteModalOpen(true)
                }}
                className="shrink-0 shadow-xs"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      </PermissionGuard>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Delete Organization</DialogTitle>
            </div>
            <DialogDescription>
              This action cannot be undone. All projects, schemas, database
              credentials, and migrations under{" "}
              <span className="font-semibold text-foreground">
                {activeOrg.name}
              </span>{" "}
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {deleteError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                To confirm, type{" "}
                <span className="font-mono font-bold text-destructive select-all">
                  {expectedDeletePhrase}
                </span>{" "}
                below:
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={expectedDeletePhrase}
                className="font-mono text-sm"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteOrgMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!isDeleteConfirmed || deleteOrgMutation.isPending}
                onClick={() => deleteOrgMutation.mutate()}
              >
                {deleteOrgMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete this Organization"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Notice Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <ArrowRightLeft className="h-5 w-5" />
              <DialogTitle>Transfer Ownership</DialogTitle>
            </div>
            <DialogDescription>
              To transfer ownership of{" "}
              <span className="font-semibold text-foreground">
                {activeOrg.name}
              </span>
              , please navigate to the{" "}
              <span className="font-medium text-foreground">Team Members</span>{" "}
              tab and promote an existing Admin to Owner. You will subsequently
              become an Admin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setTransferModalOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setTransferModalOpen(false)
                navigate("/org/members")
              }}
            >
              Go to Members
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrgSettingsPage
