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
import { getErrorMessage } from "@/lib/errors"
import { PermissionGuard } from "@/components/auth"
import { useHasPermission } from "@/hooks/useHasPermission"
import { RoleBadge } from "@/components/orgs/RoleBadge"

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
      if (!activeOrg?.id) {
        throw new Error(
          "No organization is currently active. Please select an organization and try again."
        )
      }
      return orgsApi.updateOrg(activeOrg.id, data)
    },
    onSuccess: (res) => {
      setGeneralSuccess("Organization details updated successfully.")
      setGeneralError(null)
      queryClient.invalidateQueries({ queryKey: orgKeys.list() })
      if (res.data && currentRole) {
        setActiveOrg(res.data, currentRole)
      }
      setTimeout(() => setGeneralSuccess(null), 4000)
    },
    onError: (err: unknown) => {
      setGeneralSuccess(null)
      setGeneralError(
        getErrorMessage(
          err,
          "Unable to update organization details. Please check the name and try again."
        )
      )
    },
  })

  // Delete org mutation
  const deleteOrgMutation = useMutation({
    mutationFn: async () => {
      if (!activeOrg?.id) {
        throw new Error(
          "No organization is currently active. Please select an organization first."
        )
      }
      return orgsApi.deleteOrg(activeOrg.id)
    },
    onSuccess: () => {
      clearWorkspace()
      queryClient.invalidateQueries({ queryKey: orgKeys.list() })
      setDeleteModalOpen(false)
      navigate("/dashboard", { replace: true })
    },
    onError: (err: unknown) => {
      setDeleteError(
        getErrorMessage(
          err,
          "Unable to delete this organization. Only organization owners have administrative permissions to delete an organization."
        )
      )
    },
  })

  if (!activeOrg) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="bg-muted text-muted-foreground flex h-14 w-14 items-center justify-center rounded-2xl">
          <Building2 className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">No Active Organization</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
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
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-semibold sm:text-3xl">
                Organization Settings
              </h1>
              {currentRole && <RoleBadge role={currentRole} />}
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Manage organization preferences, slug identifier, and
              administrative actions.
            </p>
          </div>
        </div>
      </div>

      {/* General Settings Card */}
      <Card className="border-border/70 bg-card shadow-xs">
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Basic details describing this organization workspace.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmitGeneral)}>
          <CardContent className="space-y-4">
            {generalSuccess && (
              <div
                role="status"
                className="border-success/20 bg-success/10 text-success flex items-center gap-2 rounded-lg border p-3 text-sm font-medium"
              >
                <Check className="h-4 w-4 shrink-0" />
                <span>{generalSuccess}</span>
              </div>
            )}

            {generalError && (
              <div
                role="alert"
                className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm font-medium"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-xs font-medium">
                Organization Name
              </Label>
              <Input
                id="org-name"
                disabled={!canEditGeneral || updateOrgMutation.isPending}
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-destructive text-xs font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-description" className="text-xs font-medium">
                Description
              </Label>
              <Textarea
                id="org-description"
                rows={3}
                disabled={!canEditGeneral || updateOrgMutation.isPending}
                placeholder="Describe your organization..."
                {...register("description")}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-destructive text-xs font-medium">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>

          {canEditGeneral && (
            <CardFooter className="border-border/60 bg-muted/20 flex justify-end border-t px-6 py-3.5">
              <Button
                type="submit"
                disabled={updateOrgMutation.isPending}
                size="sm"
              >
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
        <div className="border-destructive/25 bg-destructive/5 overflow-hidden rounded-lg border shadow-xs">
          <div className="border-destructive/15 flex flex-col gap-1 border-b p-6">
            <div className="text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-destructive text-base leading-none font-semibold">
                Danger Zone
              </h3>
            </div>
            <p className="text-destructive/80 mt-1 text-xs leading-relaxed">
              Irreversible and destructive actions restricted exclusively to the
              Organization Owner.
            </p>
          </div>

          <div className="divide-destructive/15 divide-y">
            {[
              {
                title: "Transfer Ownership",
                titleClass: "text-foreground",
                desc: "Transfer the owner role of this organization to another team member.",
                btnVariant: "outline" as const,
                btnClass:
                  "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 gap-1.5",
                icon: ArrowRightLeft,
                label: "Transfer Ownership",
                onClick: () => setTransferModalOpen(true),
              },
              {
                title: "Delete Organization",
                titleClass: "text-destructive",
                desc: "Permanently delete this organization, all attached projects, migrations, and connections.",
                btnVariant: "destructive" as const,
                btnClass: "shrink-0 gap-1.5 shadow-xs",
                icon: Trash2,
                label: "Delete Organization",
                onClick: () => {
                  setDeleteConfirmText("")
                  setDeleteError(null)
                  setDeleteModalOpen(true)
                },
              },
            ].map((action) => {
              const Icon = action.icon
              return (
                <div
                  key={action.title}
                  className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className={`text-sm font-semibold ${action.titleClass}`}>
                      {action.title}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {action.desc}
                    </p>
                  </div>
                  <Button
                    variant={action.btnVariant}
                    size="sm"
                    onClick={action.onClick}
                    className={action.btnClass}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{action.label}</span>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </PermissionGuard>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Delete Organization</DialogTitle>
            </div>
            <DialogDescription>
              This action cannot be undone. All projects, schemas, database
              credentials, and migrations under{" "}
              <span className="text-foreground font-semibold">
                {activeOrg.name}
              </span>{" "}
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {deleteError && (
              <div
                role="alert"
                className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm font-medium"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                To confirm, type{" "}
                <span className="text-destructive font-mono font-semibold select-all">
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
            <div className="text-primary flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              <DialogTitle>Transfer Ownership</DialogTitle>
            </div>
            <DialogDescription>
              To transfer ownership of{" "}
              <span className="text-foreground font-semibold">
                {activeOrg.name}
              </span>
              , please navigate to the{" "}
              <span className="text-foreground font-medium">Team Members</span>{" "}
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
