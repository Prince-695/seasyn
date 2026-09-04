import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  User as UserIcon,
  ShieldCheck,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Check,
  AtSign,
  Calendar,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { userApi } from "@/api/auth"
import { formatDate } from "@/lib/formatters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { User } from "@/types"
import axios from "axios"

// ─── Sub-Component: Personal Information Card ─────────────────────────────────
// Keyed by profile id/email so state resets naturally without setState-in-effect
function PersonalInformationCard({
  profile,
}: {
  profile: User | null | undefined
}) {
  const queryClient = useQueryClient()
  const { user, setAuth } = useAuthStore()

  const [firstName, setFirstName] = useState(profile?.first_name || "")
  const [lastName, setLastName] = useState(profile?.last_name || "")
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(
    null
  )
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null)

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      setProfileErrorMsg(null)
      setProfileSuccessMsg(null)
      const res = await userApi.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      })
      return res.data
    },
    onSuccess: (updated) => {
      setProfileSuccessMsg("Profile updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
      if (user && updated) {
        setAuth({
          ...user,
          first_name: updated.first_name,
          last_name: updated.last_name,
          name: `${updated.first_name} ${updated.last_name}`.trim(),
        })
      }
      setTimeout(() => setProfileSuccessMsg(null), 4000)
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        setProfileErrorMsg(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to update profile."
        )
      } else {
        setProfileErrorMsg("An unexpected error occurred.")
      }
    },
  })

  const initials =
    (profile?.first_name?.[0] || "") + (profile?.last_name?.[0] || "") ||
    profile?.username?.[0]?.toUpperCase() ||
    profile?.email?.[0]?.toUpperCase() ||
    "U"

  return (
    <div className="border-border/70 bg-card/40 space-y-6 rounded-xl border p-6 shadow-xs backdrop-blur-xs">
      <div className="border-border/40 border-b pb-4">
        <h3 className="text-foreground flex items-center gap-2 text-base font-bold">
          <UserIcon className="text-primary h-4 w-4" />
          <span>Personal Information</span>
        </h3>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Update your display name and view account details.
        </p>
      </div>

      {/* Avatar Row */}
      <div className="flex items-center gap-4">
        <div className="font-heading bg-primary/10 text-primary ring-border/80 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-extrabold ring-1">
          {initials}
        </div>
        <div>
          <p className="text-foreground text-sm font-semibold">
            {profile?.first_name
              ? `${profile.first_name} ${profile.last_name || ""}`
              : profile?.email}
          </p>
          <p className="text-muted-foreground font-mono text-xs">
            {profile?.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-xs font-medium">
            First Name
          </Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-xs font-medium">
            Last Name
          </Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
        </div>
      </div>

      {/* Email Address (Immutable) */}
      <div className="max-w-md space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="email" className="text-xs font-medium">
            Email Address
          </Label>
          {profile?.is_verified && (
            <span className="text-success flex items-center gap-1 text-[11px] font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </span>
          )}
        </div>
        <Input
          id="email"
          value={profile?.email || ""}
          disabled
          className="bg-muted/40 text-muted-foreground cursor-not-allowed font-mono text-xs"
        />
        <p className="text-muted-foreground text-[11px]">
          Email address is tied to your login credentials and cannot be changed
          directly.
        </p>
      </div>

      {profileErrorMsg && (
        <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{profileErrorMsg}</span>
        </div>
      )}

      {profileSuccessMsg && (
        <div className="border-success/20 bg-success/10 text-success flex items-center gap-2 rounded-lg border p-3 text-xs">
          <Check className="h-4 w-4 shrink-0" />
          <span>{profileSuccessMsg}</span>
        </div>
      )}

      <div className="border-border/40 border-t pt-4">
        <Button
          onClick={() => updateProfileMutation.mutate()}
          disabled={
            updateProfileMutation.isPending ||
            (firstName.trim() === (profile?.first_name || "") &&
              lastName.trim() === (profile?.last_name || ""))
          }
          className="gap-2 shadow-xs"
        >
          {updateProfileMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <span>Save Changes</span>
        </Button>
      </div>
    </div>
  )
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export function ProfilePage() {
  const queryClient = useQueryClient()
  const { user, setAuth } = useAuthStore()

  // Fetch latest profile directly from /users/me
  const { data: profileRes, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["userProfile", "me"],
    queryFn: async () => {
      const res = await userApi.getMyProfile()
      return res.data
    },
  })

  const currentProfile = profileRes ?? user

  // ─── Username Claim State ───────────────────────────────────────────────────
  const [usernameInput, setUsernameInput] = useState("")
  const [debouncedUsername, setDebouncedUsername] = useState("")
  const [usernameErrorMsg, setUsernameErrorMsg] = useState<string | null>(null)
  const [usernameSuccessMsg, setUsernameSuccessMsg] = useState<string | null>(
    null
  )

  // Debounce username input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(usernameInput.toLowerCase().trim())
    }, 400)
    return () => clearTimeout(timer)
  }, [usernameInput])

  // Regex validation: 3-20 lowercase alphanumeric + underscores
  const isValidFormat = /^[a-z0-9_]{3,20}$/.test(debouncedUsername)

  // Availability Query
  const { data: availabilityRes, isFetching: isCheckingAvailability } =
    useQuery({
      queryKey: ["checkUsername", debouncedUsername],
      queryFn: async () => {
        if (!isValidFormat) return null
        const res = await userApi.checkUsername(debouncedUsername)
        return res.data
      },
      enabled: isValidFormat && !currentProfile?.username,
      staleTime: 10_000,
    })

  const isAvailable = availabilityRes?.available ?? null

  // Claim Username Mutation
  const setUsernameMutation = useMutation({
    mutationFn: async () => {
      setUsernameErrorMsg(null)
      setUsernameSuccessMsg(null)
      await userApi.setUsername(debouncedUsername)
    },
    onSuccess: () => {
      setUsernameSuccessMsg(`@${debouncedUsername} successfully claimed!`)
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
      if (user) {
        setAuth({
          ...user,
          username: debouncedUsername,
        })
      }
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        setUsernameErrorMsg(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to claim username."
        )
      } else {
        setUsernameErrorMsg("An unexpected error occurred.")
      }
    },
  })

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your personal details, unique username handle, and account
          security.
        </p>
      </div>

      {isLoadingProfile ? (
        <div className="text-muted-foreground flex items-center justify-center gap-3 py-16">
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
          <span className="text-sm">Loading your profile...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Card 1: Unique Username Handle */}
          <div className="border-border/70 bg-card/40 space-y-6 rounded-xl border p-6 shadow-xs backdrop-blur-xs">
            <div className="border-border/40 flex items-start justify-between border-b pb-4">
              <div>
                <h3 className="text-foreground flex items-center gap-2 text-base font-bold">
                  <AtSign className="text-primary h-4 w-4" />
                  <span>Unique Username Handle</span>
                </h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Your username uniquely identifies your account across all
                  multi-tenant workspaces.
                </p>
              </div>

              {currentProfile?.username && (
                <div className="border-primary/20 bg-primary/10 text-primary flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold">
                  <Lock className="h-3 w-3" />
                  <span>Permanent Handle</span>
                </div>
              )}
            </div>

            {currentProfile?.username ? (
              /* Already Set (Permanent & Immutable) */
              <div className="border-border/60 bg-muted/20 space-y-2 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    Active Username:
                  </span>
                  <span className="text-primary font-mono text-base font-bold">
                    @{currentProfile.username}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Your username is permanent and cannot be modified. It is used
                  for workspace invites and collaboration.
                </p>
              </div>
            ) : (
              /* Not Set Yet (Claim Workflow) */
              <div className="space-y-4">
                <div className="border-warning/30 bg-warning/10 text-warning flex items-start gap-2.5 rounded-lg border p-3.5 text-xs">
                  <AlertCircle className="text-warning mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <span className="font-semibold">Important Notice:</span> You
                    can only choose your username once. Once claimed, it is
                    permanently locked to your account.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-medium">
                    Choose Your Username
                  </Label>
                  <div className="relative max-w-md">
                    <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm">
                      @
                    </span>
                    <Input
                      id="username"
                      type="text"
                      placeholder="username"
                      value={usernameInput}
                      onChange={(e) => {
                        setUsernameInput(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, "")
                        )
                        setUsernameErrorMsg(null)
                      }}
                      maxLength={20}
                      className="pl-7 font-mono text-sm"
                    />
                  </div>

                  {/* Availability & Validation Feedback */}
                  <div className="h-5 text-xs">
                    {debouncedUsername.length > 0 && !isValidFormat && (
                      <span className="text-warning flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Must be 3–20 lowercase letters, numbers, or underscores.
                      </span>
                    )}

                    {isValidFormat && isCheckingAvailability && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Checking availability...
                      </span>
                    )}

                    {isValidFormat &&
                      !isCheckingAvailability &&
                      isAvailable === true && (
                        <span className="text-success flex items-center gap-1 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />@
                          {debouncedUsername} is available!
                        </span>
                      )}

                    {isValidFormat &&
                      !isCheckingAvailability &&
                      isAvailable === false && (
                        <span className="text-destructive flex items-center gap-1 font-medium">
                          <XCircle className="h-3.5 w-3.5" />@
                          {debouncedUsername} is already taken.
                        </span>
                      )}
                  </div>
                </div>

                {usernameErrorMsg && (
                  <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{usernameErrorMsg}</span>
                  </div>
                )}

                {usernameSuccessMsg && (
                  <div className="border-success/20 bg-success/10 text-success flex items-center gap-2 rounded-lg border p-3 text-xs">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>{usernameSuccessMsg}</span>
                  </div>
                )}

                <Button
                  onClick={() => setUsernameMutation.mutate()}
                  disabled={
                    !isValidFormat ||
                    !isAvailable ||
                    isCheckingAvailability ||
                    setUsernameMutation.isPending
                  }
                  className="gap-2 shadow-xs"
                >
                  {setUsernameMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>Claim Username</span>
                </Button>
              </div>
            )}
          </div>

          {/* Card 2: Personal Profile Info */}
          <PersonalInformationCard
            key={currentProfile?.updated_at || currentProfile?.email}
            profile={currentProfile}
          />

          {/* Card 3: Account Metadata */}
          {currentProfile?.created_at && (
            <div className="border-border/60 bg-card/20 text-muted-foreground flex items-center gap-2 rounded-xl border p-4 text-xs">
              <Calendar className="text-primary h-4 w-4" />
              <span>
                Account registered on {formatDate(currentProfile.created_at)}.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProfilePage
