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
import { PermissionGuard } from "@/components/auth"
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
        <div className="bg-muted text-muted-foreground flex h-14 w-14 items-center justify-center rounded-2xl">
          <Building2 className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">
            No Active Organization
          </h2>
          <p className="text-muted-foreground max-w-sm text-sm">
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
            <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Team Members
            </h1>
            <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
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
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or handle..."
            className="border-border/80 bg-card/40 h-10 pl-9"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="border-border/60 bg-card/30 overflow-hidden rounded-xl border shadow-sm backdrop-blur-xs">
        {isLoading ? (
          <div className="text-muted-foreground flex min-h-75 flex-col items-center justify-center gap-3 py-12 text-center">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <p className="text-sm">Loading team members...</p>
          </div>
        ) : error ? (
          <div className="text-destructive flex min-h-50 flex-col items-center justify-center gap-2 p-8 text-center">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm font-semibold">Failed to load members</p>
            <p className="text-muted-foreground text-xs">
              Please check your connection or organization permissions.
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-muted-foreground flex min-h-62.5 flex-col items-center justify-center gap-3 p-8 text-center">
            <Users className="h-10 w-10 stroke-1" />
            <p className="text-foreground font-medium">No members found</p>
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
                <tr className="border-border/60 bg-muted/40 text-muted-foreground border-b text-xs font-semibold tracking-wider uppercase">
                  <th className="px-6 py-3.5">Member</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                  {canManageMembers && (
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-border/40 divide-y">
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
                      className="hover:bg-muted/25 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-foreground truncate font-medium">
                                {displayName}
                              </span>
                              {isCurrentUser && (
                                <span className="py-0.2 bg-muted text-muted-foreground rounded px-1.5 text-[10px] font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            {member.username && (
                              <p className="text-muted-foreground truncate text-xs">
                                @{member.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-muted-foreground px-6 py-4 font-mono text-xs">
                        {member.email}
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="text-muted-foreground px-6 py-4 text-xs">
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
                                    className="hover:bg-muted h-8 w-8"
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
                                  <Shield className="text-muted-foreground h-4 w-4" />
                                  <span>Change Role</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRemoveError(null)
                                    setMemberToRemove(member)
                                  }}
                                  variant="destructive"
                                  className="text-destructive focus:text-destructive cursor-pointer gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Remove Member</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-muted-foreground/60 text-xs italic">
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
            <div className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <DialogTitle>Remove Team Member</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="text-foreground font-semibold">
                {memberToRemove?.first_name} {memberToRemove?.last_name} (
                {memberToRemove?.email})
              </span>{" "}
              from{" "}
              <span className="text-foreground font-semibold">
                {activeOrg.name}
              </span>
              ? They will immediately lose access to all projects and databases.
            </DialogDescription>
          </DialogHeader>

          {removeError && (
            <div
              role="alert"
              className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm font-medium"
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
