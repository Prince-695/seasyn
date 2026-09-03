import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Users,
  Search,
  UserPlus,
  MoreVertical,
  Shield,
  Trash2,
  AlertCircle,
  Loader2,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { orgsApi } from "@/api/orgs"
import { orgKeys } from "@/lib/queryKeys"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { useAuthStore } from "@/store/authStore"
import { RoleBadge } from "@/components/orgs/RoleBadge"
import { InviteMemberModal } from "@/components/orgs/InviteMemberModal"
import { ChangeRoleDialog } from "@/components/orgs/ChangeRoleDialog"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { useHasPermission } from "@/hooks/useHasPermission"
import { formatDate } from "@/lib/formatters"

import type { OrgMemberDetail } from "@/types/org"
import axios from "axios"

export function MembersPage() {
  const queryClient = useQueryClient()
  const { activeOrg, currentRole } = useWorkspaceStore()
  const currentUser = useAuthStore((state) => state.user)

  const [searchQuery, setSearchQuery] = useState("")
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [roleChangeMember, setRoleChangeMember] =
    useState<OrgMemberDetail | null>(null)
  const [memberToRemove, setMemberToRemove] = useState<OrgMemberDetail | null>(
    null
  )
  const [removeError, setRemoveError] = useState<string | null>(null)

  const canManageMembers = useHasPermission(["owner", "admin"])

  const {
    data: membersRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: orgKeys.members(activeOrg?.id ?? ""),
    queryFn: async () => {
      if (!activeOrg?.id) return []
      const res = await orgsApi.getMembers(activeOrg.id)
      return res.data ?? []
    },
    enabled: !!activeOrg?.id,
  })

  const members: OrgMemberDetail[] = useMemo(
    () => membersRes ?? [],
    [membersRes]
  )

  // Filter members based on search input
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members
    const query = searchQuery.toLowerCase().trim()
    return members.filter(
      (m) =>
        m.email.toLowerCase().includes(query) ||
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(query) ||
        (m.username && m.username.toLowerCase().includes(query))
    )
  }, [members, searchQuery])

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: async (member: OrgMemberDetail) => {
      if (!activeOrg?.id) throw new Error("No active organization")
      return orgsApi.removeMember(activeOrg.id, member.user_id)
    },
    onSuccess: () => {
      if (activeOrg?.id) {
        queryClient.invalidateQueries({
          queryKey: orgKeys.members(activeOrg.id),
        })
      }
      setMemberToRemove(null)
      setRemoveError(null)
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        setRemoveError(
          err.response?.data?.message ??
            err.response?.data?.error ??
            "Failed to remove member. You may not have sufficient permissions."
        )
      } else {
        setRemoveError("An unexpected error occurred. Please try again.")
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Team Members
            </h1>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organization members, invite new teammates, and assign
            roles.
          </p>
        </div>

        {/* Invite Member Action */}
        <PermissionGuard
          allowedRoles={["owner", "admin"]}
          fallback={
            <Button
              disabled
              variant="outline"
              size="sm"
              title="Only Owners and Admins can invite team members"
              className="opacity-60"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          }
        >
          <Button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Member</span>
          </Button>
        </PermissionGuard>
      </div>

      {/* Search Bar & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or handle..."
            className="h-10 border-border/80 bg-card/40 pl-9"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/30 shadow-sm backdrop-blur-xs">
        {isLoading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading team members...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 p-8 text-center text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm font-semibold">Failed to load members</p>
            <p className="text-xs text-muted-foreground">
              Please check your connection or organization permissions.
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
            <Users className="h-10 w-10 stroke-1" />
            <p className="font-medium text-foreground">No members found</p>
            <p className="max-w-xs text-xs">
              {searchQuery
                ? `No members match "${searchQuery}". Try adjusting your search query.`
                : "No members currently belong to this organization."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  <th className="px-6 py-3.5">Member</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                  {canManageMembers && (
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredMembers.map((member) => {
                  const isCurrentUser = member.user_id === currentUser?.id
                  const isMemberOwner = member.role === "owner"
                  // Admins cannot edit or remove Owners
                  const canModifyThisMember =
                    currentRole === "owner" ||
                    (currentRole === "admin" && !isMemberOwner)

                  const displayName =
                    `${member.first_name} ${member.last_name}`.trim() ||
                    member.username ||
                    "Team Member"

                  const initials =
                    (member.first_name?.[0] || "") +
                      (member.last_name?.[0] || "") ||
                    member.email[0].toUpperCase()

                  return (
                    <tr
                      key={member.user_id}
                      className="transition-colors hover:bg-muted/25"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate font-medium text-foreground">
                                {displayName}
                              </span>
                              {isCurrentUser && (
                                <span className="py-0.2 rounded bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                                  You
                                </span>
                              )}
                            </div>
                            {member.username && (
                              <p className="truncate text-xs text-muted-foreground">
                                @{member.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {member.email}
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {formatDate(member.joined_at)}
                      </td>
                      {canManageMembers && (
                        <td className="px-6 py-4 text-right">
                          {canModifyThisMember && !isCurrentUser ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-muted"
                                    aria-label="Member actions"
                                  />
                                }
                              >
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={() => setRoleChangeMember(member)}
                                  className="cursor-pointer gap-2"
                                >
                                  <Shield className="h-4 w-4 text-muted-foreground" />
                                  <span>Change Role</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRemoveError(null)
                                    setMemberToRemove(member)
                                  }}
                                  variant="destructive"
                                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Remove Member</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 italic">
                              {isCurrentUser ? "Self" : "Protected"}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        orgId={activeOrg.id}
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
      />

      {/* Change Role Dialog */}
      <ChangeRoleDialog
        orgId={activeOrg.id}
        member={roleChangeMember}
        open={!!roleChangeMember}
        onOpenChange={(open) => !open && setRoleChangeMember(null)}
      />

      {/* Remove Member Confirmation Dialog */}
      <Dialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <DialogTitle>Remove Team Member</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {memberToRemove?.first_name} {memberToRemove?.last_name} (
                {memberToRemove?.email})
              </span>{" "}
              from{" "}
              <span className="font-semibold text-foreground">
                {activeOrg.name}
              </span>
              ? They will immediately lose access to all projects and databases.
            </DialogDescription>
          </DialogHeader>

          {removeError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{removeError}</span>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMemberToRemove(null)}
              disabled={removeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                memberToRemove && removeMutation.mutate(memberToRemove)
              }
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MembersPage
