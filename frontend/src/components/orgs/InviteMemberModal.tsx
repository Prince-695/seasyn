import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  UserPlus,
  Loader2,
  AlertCircle,
  Shield,
  Users,
  Eye,
} from "lucide-react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validators"
import { orgsApi } from "@/api/orgs"
import { orgKeys } from "@/lib/queryKeys"
import type { OrgRole } from "@/types/org"
import axios from "axios"

interface InviteMemberModalProps {
  orgId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roleOptions: Array<{
  role: "admin" | "member" | "viewer"
  label: string
  description: string
  icon: typeof Shield
}> = [
  {
    role: "admin",
    label: "Admin",
    description:
      "Can invite members, manage connections, and configure settings.",
    icon: Shield,
  },
  {
    role: "member",
    label: "Member",
    description: "Can view schemas, execute table edits, and run migrations.",
    icon: Users,
  },
  {
    role: "viewer",
    label: "Viewer",
    description:
      "Read-only access. Can view schemas and query data without editing.",
    icon: Eye,
  },
]

export function InviteMemberModal({
  orgId,
  open,
  onOpenChange,
}: InviteMemberModalProps) {
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<
    "admin" | "member" | "viewer"
  >("member")

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset()
      setServerError(null)
      setSelectedRole("member")
    }
    onOpenChange(nextOpen)
  }

  const inviteMutation = useMutation({
    mutationFn: (data: InviteMemberInput) =>
      orgsApi.inviteMember(orgId, { email: data.email, role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) })
      handleOpenChange(false)
    },

    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        setServerError(
          err.response?.data?.message ??
            err.response?.data?.error ??
            "Failed to invite member. Verify the email is registered."
        )
      } else {
        setServerError("An unexpected error occurred. Please try again.")
      }
    },
  })

  const onSubmit = (data: InviteMemberInput) => {
    setServerError(null)
    inviteMutation.mutate(data)
  }

  const handleRoleChange = (val: string) => {
    const role = val as OrgRole
    if (role === "admin" || role === "member" || role === "viewer") {
      setSelectedRole(role)
      setValue("role", role, { shouldValidate: true })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Invite a colleague to collaborate in this workspace.
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
            <Label htmlFor="invite-email">
              User Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-destructive text-xs font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Select Role</Label>
            <RadioGroup
              value={selectedRole}
              onValueChange={handleRoleChange}
              className="space-y-2"
            >
              {roleOptions.map((opt) => {
                const Icon = opt.icon
                const isChecked = selectedRole === opt.role
                return (
                  <label
                    key={opt.role}
                    htmlFor={`role-${opt.role}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      isChecked
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <RadioGroupItem
                      value={opt.role}
                      id={`role-${opt.role}`}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-0.5">
                      <div className="text-foreground flex items-center gap-1.5 text-sm font-medium">
                        <Icon className="text-muted-foreground h-4 w-4" />
                        <span>{opt.label}</span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                )
              })}
            </RadioGroup>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Invite...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default InviteMemberModal
