import { useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"
import { FaGithub } from "react-icons/fa"
import { useAuthStore } from "@/store/authStore"
import { authApi } from "@/api/auth"
import { setTokenCookie } from "@/lib/utils"

interface OAuthButtonsProps {
  onError: (error: string | null) => void
}

export function OAuthButtons({ onError }: OAuthButtonsProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const from =
    location.state?.from?.pathname && location.state?.from?.pathname !== "/"
      ? location.state.from.pathname
      : "/dashboard"

  const handleOAuthLogin = async (provider: "google" | "github") => {
    onError(null)
    try {
      const response = await authApi.getOAuthUrl(provider)
      if (!response.success || !response.data?.auth_url) {
        onError("Failed to get authorization URL.")
        return
      }
      const authUrl = response.data.auth_url

      const width = 600
      const height = 650
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      // Open the popup/new tab
      const popup = window.open(
        authUrl,
        "OAuth Login",
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      )

      if (!popup) {
        onError("Popup blocked. Please allow popups for this site.")
        return
      }

      // Start the DOM Scraping Poller
      pollIntervalRef.current = setInterval(async () => {
        try {
          if (popup.closed) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            onError("Authentication window was closed.")
            return
          }

          // Attempt to read the text content of the popup window
          const popupText = popup.document.body.innerText

          // If we successfully read the text, and it looks like our JSON response
          if (popupText && popupText.includes("access_token")) {
            // 1. Stop polling
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)

            // 2. Parse the JSON text into a usable object
            const responseData = JSON.parse(popupText)

            if (responseData.success && responseData.access_token) {
              // 3. Save the token exactly as you were doing before
              setTokenCookie(responseData.access_token)

              // 4. Close the ugly JSON tab automatically
              popup.close()

              // 5. Fetch the profile with the new token to complete the login
              const profileRes = await authApi.getProfile()
              const user = profileRes?.data?.user ||
                profileRes?.data ||
                profileRes || {
                  id: "oauth-user",
                  name: "User",
                  email: "OAuth Login",
                }

              setAuth(user)
              navigate(from, { replace: true })
            }
          }
        } catch {
          // CORS error expected while popup is on provider's domain
        }
      }, 1000)
    } catch (err) {
      console.error(err)
      onError("An error occurred during OAuth initialization.")
    }
  }

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        type="button"
        className="h-11 flex-1 border-muted/80 bg-muted/20 font-medium hover:bg-muted"
        onClick={() => handleOAuthLogin("google")}
      >
        <FcGoogle className="mr-2 h-5 w-5" />
        Google
      </Button>
      <Button
        variant="outline"
        type="button"
        className="h-11 flex-1 border-muted/80 bg-muted/20 font-medium hover:bg-muted"
        onClick={() => handleOAuthLogin("github")}
      >
        <FaGithub className="mr-2 h-5 w-5" />
        GitHub
      </Button>
    </div>
  )
}
export default OAuthButtons
