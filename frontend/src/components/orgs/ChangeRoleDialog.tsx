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
import { getErrorMessage } from "@/lib/errors"

interface ChangeRoleDialogProps {
  orgId: string
  member: OrgMemberDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

import { EDITABLE_ROLES, type EditableOrgRole } from "@/lib/constants/roles"

interface ChangeRoleContentProps {
  orgId: string
  member: OrgMemberDetail
  onClose: () => void
}

function ChangeRoleContent({ orgId, member, onClose }: ChangeRoleContentProps) {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<EditableOrgRole>(
    member.role !== "owner" ? (member.role as EditableOrgRole) : "member"
  )
  const [serverError, setServerError] = useState<string | null>(null)

  const updateRoleMutation = useMutation({
    mutationFn: (role: EditableOrgRole) =>
      orgsApi.updateMemberRole(orgId, member.user_id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) })
      onClose()
    },
    onError: (err: unknown) => {
      setServerError(
        getErrorMessage(
          err,
          "Unable to update member role. Please ensure you have administrator privileges and try again."
        )
      )
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
          <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update access permissions for{" "}
              <span className="text-foreground font-medium">
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
            className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm font-medium"
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
            {EDITABLE_ROLES.map((opt) => {
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
                    <p className="text-foreground text-sm font-medium">
                      {opt.label}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {opt.description}
                    </p>
                  </div>
                </label>
              )
            })}
          </RadioGroup>
        </div>

        {selectedRole !== member.role && (
          <div className="border-warning/30 bg-warning/10 text-warning flex items-start gap-2.5 rounded-lg border p-3 text-xs">
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
