import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Shield, Loader2, AlertCircle, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { orgsApi } from "@/api/orgs"
import { orgKeys } from "@/lib/queryKeys"
import type { OrgMemberDetail } from "@/types/org"
import axios from "axios"

interface ChangeRoleDialogProps {
  orgId: string
  member: OrgMemberDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const editableRoles: Array<{
  role: "admin" | "member" | "viewer"
  label: string
  description: string
}> = [
  {
    role: "admin",
    label: "Admin",
    description:
      "Can manage team members, database connections, and workspace settings.",
  },
  {
    role: "member",
    label: "Member",
    description: "Can inspect schemas, edit tables, and execute migrations.",
  },
  {
    role: "viewer",
    label: "Viewer",
    description: "Read-only access. Cannot execute migrations or alter tables.",
  },
]

interface ChangeRoleContentProps {
  orgId: string
  member: OrgMemberDetail
  onClose: () => void
}

function ChangeRoleContent({ orgId, member, onClose }: ChangeRoleContentProps) {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<
    "admin" | "member" | "viewer"
  >(
    member.role !== "owner"
      ? (member.role as "admin" | "member" | "viewer")
      : "member"
  )
  const [serverError, setServerError] = useState<string | null>(null)

  const updateRoleMutation = useMutation({
    mutationFn: (role: "admin" | "member" | "viewer") =>
      orgsApi.updateMemberRole(orgId, member.user_id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) })
      onClose()
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        setServerError(
          err.response?.data?.message ??
            err.response?.data?.error ??
            "Failed to update role. Please verify your permissions."
        )
      } else {
        setServerError("An unexpected error occurred. Please try again.")
      }
    },
  })

  const handleSave = () => {
    setServerError(null)
    updateRoleMutation.mutate(selectedRole)
  }

  const isRoleUnchanged = member.role === selectedRole

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update access permissions for{" "}
              <span className="font-semibold text-foreground">
                {member.first_name} {member.last_name} ({member.email})
              </span>
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4 pt-2">
        {serverError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label>Select New Role</Label>
          <RadioGroup
            value={selectedRole}
            onValueChange={(val) =>
              setSelectedRole(val as "admin" | "member" | "viewer")
            }
            className="space-y-2"
          >
            {editableRoles.map((opt) => {
              const isChecked = selectedRole === opt.role
              return (
                <label
                  key={opt.role}
                  htmlFor={`changerole-${opt.role}`}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    isChecked
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <RadioGroupItem
                    value={opt.role}
                    id={`changerole-${opt.role}`}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {opt.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                </label>
              )
            })}
          </RadioGroup>
        </div>

        {selectedRole !== member.role && (
          <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Changing this user&apos;s role will immediately adjust what they
              can see, edit, or configure in this organization.
            </span>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={updateRoleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isRoleUnchanged || updateRoleMutation.isPending}
          >
            {updateRoleMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Confirm Role Change"
            )}
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  )
}

export function ChangeRoleDialog({
  orgId,
  member,
  open,
  onOpenChange,
}: ChangeRoleDialogProps) {
  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ChangeRoleContent
        key={member.user_id}
        orgId={orgId}
        member={member}
        onClose={() => onOpenChange(false)}
      />
    </Dialog>
  )
}

export default ChangeRoleDialog
