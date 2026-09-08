import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { userApi } from "@/api/auth"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { User } from "@/types"

export function OAuthSuccess() {
  const { provider } = useParams<{ provider: string }>()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuth = async () => {
      if (!provider) {
        setError("Missing OAuth provider in callback URL.")
        return
      }

      try {
        const user = await fetchAuthenticatedUser()

        if (!user) {
          throw new Error(
            `Failed to retrieve authenticated profile for provider "${provider}"`
          )
        }

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { type: "OAUTH_SUCCESS", user },
            window.location.origin
          )
          window.close()
        } else {
          setAuth(user)
          navigate(getSafeRedirectTarget(), { replace: true })
        }
      } catch (err) {
        console.error("OAuth callback failed:", err)
        setError(
          err instanceof Error
            ? err.message
            : "Failed to complete sign-in. Please try again."
        )
      }
    }

    handleAuth()
  }, [provider, navigate, setAuth])

  if (error) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-destructive mb-4 text-2xl font-bold">
          Authentication Error
        </h1>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button
          onClick={() => navigate("/sign-in")}
          className="cursor-pointer font-semibold transition-colors"
        >
          Back to Sign In
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="text-primary mb-4 h-10 w-10 animate-spin" />
      <p className="text-muted-foreground text-lg font-medium">
        Completing sign-in with{" "}
        <span className="text-foreground capitalize">{provider}</span>...
      </p>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Fetches the authenticated user's profile.
 * Returns null if the profile genuinely can't be retrieved — callers
 * must treat that as a hard failure, not synthesize a placeholder user.
 */
async function fetchAuthenticatedUser(): Promise<User | null> {
  try {
    const profileRes = await userApi.getMyProfile()
    if (!profileRes.data) return null

    return {
      ...profileRes.data,
      is_verified: profileRes.data.is_verified ?? false, // fail closed
    }
  } catch (err) {
    console.error("Failed to fetch user profile:", err)
    return null
  }
}

/**
 * Reads and validates the stored post-login redirect target.
 * Only allows same-origin relative paths to avoid an open-redirect
 * if sessionStorage is ever tampered with or written by other code.
 */
function getSafeRedirectTarget(): string {
  const target = sessionStorage.getItem("oauth_redirect")
  sessionStorage.removeItem("oauth_redirect")

  if (target && target.startsWith("/") && !target.startsWith("//")) {
    return target
  }
  return "/dashboard"
}

export default OAuthSuccess
