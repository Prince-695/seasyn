import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import {
  Building2,
  Users,
  Settings,
  Shield,
  Layers,
  ArrowRight,
  UserPlus,
  Calendar,
  CheckCircle2,
  Plus,
  Loader2,
  AtSign,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { RoleBadge } from "@/components/orgs/RoleBadge"
import { CreateOrgModal } from "@/components/orgs/CreateOrgModal"
import { orgsApi } from "@/api/orgs"
import { userApi } from "@/api/auth"
import { orgKeys } from "@/lib/queryKeys"
import { formatDate } from "@/lib/formatters"
import { Button, buttonVariants } from "@/components/ui/button"

export function Dashboard() {
  const { user } = useAuthStore()
  const { activeOrg, currentRole } = useWorkspaceStore()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Fetch real user profile from /users/me
  const { data: profileData } = useQuery({
    queryKey: ["userProfile", "me"],
    queryFn: async () => {
      const res = await userApi.getMyProfile()
      return res.data
    },
  })

  const currentProfile = profileData ?? user

  // Fetch real organizations for this user

  const { data: orgsRes, isLoading: isLoadingOrgs } = useQuery({
    queryKey: orgKeys.lists(),
    queryFn: async () => {
      const res = await orgsApi.getOrgs()
      return res.data ?? []
    },
  })

  // Fetch real members for active organization
  const { data: membersRes, isLoading: isLoadingMembers } = useQuery({
    queryKey: orgKeys.members(activeOrg?.id ?? ""),
    queryFn: async () => {
      if (!activeOrg?.id) return []
      const res = await orgsApi.getMembers(activeOrg.id)
      return res.data ?? []
    },
    enabled: !!activeOrg?.id,
  })

  const orgs = orgsRes ?? []
  const members = membersRes ?? []

  const canManage = currentRole === "owner" || currentRole === "admin"

  const greetingName = currentProfile?.username
    ? `@${currentProfile.username}`
    : currentProfile?.first_name ||
      currentProfile?.name ||
      (currentProfile?.email ? currentProfile.email.split("@")[0] : "User")

  return (
    <div className="space-y-8">
      {/* Top Banner & Greetings */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome back, {greetingName}!
            </h1>

            {currentProfile?.is_verified && (
              <span
                title="Verified Account"
                className="border-success/20 bg-success/10 text-success inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
              >
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {activeOrg
              ? `Managing workspace context for ${activeOrg.name}.`
              : "Select or create an organization to manage your database migrations."}
          </p>
        </div>

        {activeOrg && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Organization</span>
            </Button>
          </div>
        )}
      </div>

      {/* Subtle Prompt to claim unique handle if not claimed yet */}
      {!currentProfile?.username && (
        <div className="border-primary/20 bg-primary/5 flex flex-col gap-3 rounded-xl border p-3.5 px-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <AtSign className="text-primary h-4 w-4 shrink-0" />
            <span className="text-foreground text-xs font-medium">
              You haven't claimed your unique username handle yet.
            </span>
          </div>
          <Link
            to="/profile"
            className="text-primary inline-flex shrink-0 items-center gap-1 text-xs font-semibold hover:underline"
          >
            <span>Claim your username</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* When no organization exists or none is active */}

      {!activeOrg && (
        <div className="border-border/80 bg-card/30 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center shadow-xs">
          <div className="bg-primary/10 text-primary mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
            <Building2 className="h-7 w-7" />
          </div>
          <h3 className="text-foreground text-lg font-bold">
            No Workspace Selected
          </h3>
          <p className="text-muted-foreground mt-1 max-w-md text-sm">
            You currently have no active organization selected. Create your
            first organization or switch workspaces to collaborate with your
            team.
          </p>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="mt-6 gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Organization</span>
          </Button>
        </div>
      )}

      {/* Live Workspace Metrics Grid */}
      {activeOrg && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Active Workspace */}
          <div className="border-border/60 bg-card/40 flex flex-col justify-between rounded-xl border p-5 shadow-xs backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Workspace
              </span>
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <h4
                className="text-foreground truncate text-lg font-bold"
                title={activeOrg.name}
              >
                {activeOrg.name}
              </h4>
              <p className="text-muted-foreground truncate font-mono text-[11px]">
                {activeOrg.slug}
              </p>
            </div>
          </div>

          {/* Card 2: Your Role */}
          <div className="border-border/60 bg-card/40 flex flex-col justify-between rounded-xl border p-5 shadow-xs backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Your Access Tier
              </span>
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <Shield className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <h4 className="text-foreground text-lg font-bold capitalize">
                  {currentRole ?? "Member"}
                </h4>
                <p className="text-muted-foreground text-[11px]">
                  {currentRole === "owner"
                    ? "Full administrative control"
                    : currentRole === "admin"
                      ? "Organization manager"
                      : "Standard collaborator"}
                </p>
              </div>
              {currentRole && <RoleBadge role={currentRole} />}
            </div>
          </div>

          {/* Card 3: Team Members Count */}
          <div className="border-border/60 bg-card/40 flex flex-col justify-between rounded-xl border p-5 shadow-xs backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Team Size
              </span>
              <div className="bg-info/10 text-info flex h-8 w-8 items-center justify-center rounded-lg">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              {isLoadingMembers ? (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground text-xs">
                    Syncing...
                  </span>
                </div>
              ) : (
                <>
                  <div className="text-foreground text-2xl font-extrabold">
                    {members.length}
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    {members.length === 1
                      ? "Active member"
                      : "Active team members"}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Card 4: Total Organizations */}
          <div className="border-border/60 bg-card/40 flex flex-col justify-between rounded-xl border p-5 shadow-xs backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                All Workspaces
              </span>
              <div className="bg-success/10 text-success flex h-8 w-8 items-center justify-center rounded-lg">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              {isLoadingOrgs ? (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground text-xs">
                    Syncing...
                  </span>
                </div>
              ) : (
                <>
                  <div className="text-foreground text-2xl font-extrabold">
                    {orgs.length}
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    {orgs.length === 1
                      ? "Organization connected"
                      : "Organizations connected"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Details & Team Preview */}
      {activeOrg && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left 2 Cols: Workspace Details & Quick Actions */}
          <div className="space-y-6 lg:col-span-2">
            {/* Overview Card */}
            <div className="border-border/60 bg-card/40 space-y-4 rounded-xl border p-6 shadow-xs backdrop-blur-xs">
              <div className="border-border/40 flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-foreground text-base font-bold">
                    Workspace Overview
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Metadata and preferences for this workspace.
                  </p>
                </div>
                {activeOrg.created_at && (
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Created {formatDate(activeOrg.created_at)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs font-semibold">
                    Description
                  </span>
                  <p className="text-foreground mt-0.5">
                    {activeOrg.description || (
                      <span className="text-muted-foreground italic">
                        No description provided.
                      </span>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                  <div className="border-border/50 bg-muted/20 rounded-lg border p-3">
                    <span className="text-muted-foreground text-[11px] font-medium">
                      Unique Handle
                    </span>
                    <p className="text-foreground mt-0.5 font-mono text-xs font-semibold">
                      {activeOrg.slug}
                    </p>
                  </div>
                  <div className="border-border/50 bg-muted/20 rounded-lg border p-3">
                    <span className="text-muted-foreground text-[11px] font-medium">
                      Organization ID
                    </span>
                    <p
                      className="text-muted-foreground mt-0.5 truncate font-mono text-xs"
                      title={activeOrg.id}
                    >
                      {activeOrg.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="border-border/40 flex flex-wrap items-center gap-3 border-t pt-4">
                {canManage && (
                  <Link
                    to="/org/members"
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "gap-1.5",
                    })}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Invite Members</span>
                  </Link>
                )}
                <Link
                  to="/org/settings"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "gap-1.5",
                  })}
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Workspace Settings</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Col: Team Members Preview (Real Data) */}
          <div className="space-y-6">
            <div className="border-border/60 bg-card/40 space-y-4 rounded-xl border p-6 shadow-xs backdrop-blur-xs">
              <div className="border-border/40 flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-foreground text-base font-bold">
                    Team Roster
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Active collaborators in {activeOrg.name}
                  </p>
                </div>
                <Link
                  to="/org/members"
                  className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
                >
                  <span>View all</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {isLoadingMembers ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8">
                  <Loader2 className="text-primary h-5 w-5 animate-spin" />
                  <span className="text-xs">Loading team...</span>
                </div>
              ) : members.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-xs">
                  No other members found in this workspace.
                </p>
              ) : (
                <div className="space-y-3">
                  {members.slice(0, 5).map((member) => {
                    const initials =
                      (member.first_name?.[0] || "") +
                        (member.last_name?.[0] || "") ||
                      member.email[0].toUpperCase()

                    const displayName =
                      `${member.first_name} ${member.last_name}`.trim() ||
                      member.username ||
                      member.email.split("@")[0]

                    return (
                      <div
                        key={member.user_id}
                        className="border-border/40 bg-background/50 flex items-center justify-between gap-2 rounded-lg border p-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-foreground truncate text-xs font-medium">
                              {displayName}
                            </p>
                            <p className="text-muted-foreground truncate font-mono text-[10px]">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <RoleBadge
                          role={member.role}
                          className="shrink-0 scale-90"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      <CreateOrgModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  )
}

export default Dashboard
