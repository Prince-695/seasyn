import { useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"
import { FaGithub } from "react-icons/fa"
import { authApi } from "@/api/auth"

interface OAuthButtonsProps {
  onError: (error: string | null) => void
}

export function OAuthButtons({ onError }: OAuthButtonsProps) {
  const location = useLocation()

  const handleOAuthLogin = async (provider: "google" | "github") => {
    onError(null)

    try {
      const urlRes = await authApi.getOAuthUrl(provider)
      if (!urlRes.success || !urlRes.data?.auth_url) {
        onError("Failed to get authorization URL.")
        return
      }

      // Set a flag so the frontend knows to fetch the user profile upon return
      sessionStorage.setItem("oauth_pending", "true")

      const fromLocation = location.state?.from
      if (fromLocation?.pathname && fromLocation.pathname !== "/") {
        const dest = `${fromLocation.pathname}${fromLocation.search || ""}${fromLocation.hash || ""}`
        sessionStorage.setItem("oauth_redirect", dest)
      } else {
        sessionStorage.removeItem("oauth_redirect")
      }

      // Redirect the current window to the provider's login page
      window.location.href = urlRes.data.auth_url
    } catch {
      onError("An error occurred during OAuth initialization.")
    }
  }

  return (
    <div className="flex gap-2.5">
      <Button
        variant="outline"
        type="button"
        className="border-border/80 bg-background/60 hover:bg-muted h-10 flex-1 cursor-pointer text-xs font-medium sm:text-sm"
        onClick={() => handleOAuthLogin("google")}
      >
        <FcGoogle className="mr-2 h-4 w-4" />
        Google
      </Button>

      <Button
        variant="outline"
        type="button"
        className="border-border/80 bg-background/60 hover:bg-muted h-10 flex-1 cursor-pointer text-xs font-medium sm:text-sm"
        onClick={() => handleOAuthLogin("github")}
      >
        <FaGithub className="mr-2 h-4 w-4" />
        GitHub
      </Button>
    </div>
  )
}

export default OAuthButtons
