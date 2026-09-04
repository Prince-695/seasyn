import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { authApi } from "@/api/auth"
import { Loader2 } from "lucide-react"

// ─── Component ─────────────────────────────────────────────────────────────────
//
// This page is the frontend OAuth callback handler. It is mounted at:
//   /auth/:provider/callback
//
// Flow:
//   1. Backend handles the OAuth code exchange and sets HttpOnly cookies.
//   2. Backend redirects the browser (popup) to this page.
//   3. This page calls GET /auth/me — the browser auto-sends the cookies.
//   4a. If running inside a popup (window.opener exists):
//         → Send { type: "OAUTH_SUCCESS", user } to the parent via postMessage.
//         → Close the popup. OAuthButtons.tsx in the parent handles navigation.
//   4b. If running as a full-page redirect (no opener):
//         → Save user to the auth store and navigate to /dashboard directly.

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
        // By the time we land here, the backend has already:
        //   • exchanged the OAuth code for tokens
        //   • set HttpOnly access_token + refresh_token cookies
        // So a simple /auth/me call is all we need.
        const meRes = await authApi.me()
        const user = meRes.data ?? meRes.user

        if (!user?.id && !user?.email) {
          throw new Error(
            `GET /auth/me returned no valid user object for provider "${provider}"`
          )
        }

        if (window.opener && !window.opener.closed) {
          // ── Popup flow ──────────────────────────────────────────────────
          // Notify the parent window (OAuthButtons) that auth completed.
          // The parent already has the HttpOnly cookies (same origin), so it
          // can call /auth/me itself — but we pass the user to avoid a second
          // round-trip.
          window.opener.postMessage(
            { type: "OAUTH_SUCCESS", user },
            window.location.origin
          )
          window.close()
        } else {
          // ── Full-page redirect flow ─────────────────────────────────────
          // No popup opener — user was redirected through a full page navigation.
          setAuth(user as Parameters<typeof setAuth>[0])
          navigate("/dashboard", { replace: true })
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to complete sign-in. Please try again."
        )
      }
    }

    handleAuth()
    // provider is derived from the URL and won't change during this mount
  }, [provider, navigate, setAuth])

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-destructive mb-4 text-2xl font-bold">
          Authentication Error
        </h1>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <button
          onClick={() => navigate("/sign-in")}
          className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-lg px-6 py-2 font-semibold transition-colors"
        >
          Back to Sign In
        </button>
      </div>
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────────
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

export default OAuthSuccess
