import { useEffect, useState } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { authApi } from "@/api/auth"
import { Loader2 } from "lucide-react"
import { setTokenCookie } from "@/lib/utils"
import axios from "axios"

export function OAuthSuccess() {
  const { provider } = useParams<{ provider: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const code = searchParams.get("code")
  const urlToken = searchParams.get("access_token") || searchParams.get("token")

  useEffect(() => {
    const handleAuth = async () => {
      // Scenario 1: Token is directly in the URL search parameters (redirected from backend)
      if (urlToken) {
        try {
          setTokenCookie(urlToken)
          const profileRes = await authApi.getProfile()
          const user = profileRes.data?.user || profileRes.data || profileRes
          setAuth(user)

          if (window.opener) {
            window.close()
          } else {
            navigate("/dashboard", { replace: true })
          }
          return
        } catch (err) {
          console.error("Profile fetch with URL token failed:", err)
          setError("Failed to fetch user profile with URL token.")
          return
        }
      }

      // Scenario 2: Code exchange required (redirected directly to frontend callback)
      if (!provider || !code) {
        setError("Invalid OAuth callback parameters.")
        return
      }

      try {
        // Exchange the code for a token/session on the backend in the background
        const response = await authApi.handleOAuthCallback(provider, code)

        if (response.success || response.access_token || response.token) {
          // Extract the token and set the cookie
          const token = response.access_token || response.token
          if (token) {
            setTokenCookie(token)
          }

          // Retrieve the user profile using the set token cookie
          try {
            const profileRes = await authApi.getProfile()
            const user = profileRes.data?.user ||
              profileRes.data || {
                id: `${provider}-user`,
                email: `${provider}-user@example.com`,
                name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
              }
            setAuth(user)

            if (window.opener) {
              window.close()
            } else {
              navigate("/dashboard", { replace: true })
            }
          } catch (profileErr) {
            console.error(
              "Profile exchange failed, using fallback:",
              profileErr
            )
            // Fallback user if profile endpoint fails but exchange succeeded
            const fallbackUser = {
              id: `${provider}-user`,
              email: `${provider}-user@example.com`,
              name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
            }
            setAuth(fallbackUser)

            if (window.opener) {
              window.close()
            } else {
              navigate("/dashboard", { replace: true })
            }
          }
        } else {
          setError(response.message || "Failed to log in with OAuth.")
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              "An error occurred during authentication."
          )
        } else if (err instanceof Error) {
          setError(err.message || "An error occurred during authentication.")
        } else {
          setError("An error occurred during authentication.")
        }
      }
    }

    handleAuth()
  }, [provider, code, urlToken, navigate, setAuth])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="mb-4 text-2xl font-bold text-destructive">
          Authentication Error
        </h1>
        <p className="mb-6 text-muted-foreground">{error}</p>
        <button
          onClick={() => navigate("/sign-in")}
          className="cursor-pointer rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
      <p className="text-lg font-medium text-muted-foreground">
        Completing sign-in with {provider}...
      </p>
    </div>
  )
}

export default OAuthSuccess
