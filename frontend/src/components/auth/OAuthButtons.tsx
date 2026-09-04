import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"
import { FaGithub } from "react-icons/fa"
import { authApi } from "@/api/auth"

interface OAuthButtonsProps {
  onError: (error: string | null) => void
}

export function OAuthButtons({ onError }: OAuthButtonsProps) {
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

      // Redirect the current window to the provider's login page
      window.location.href = urlRes.data.auth_url
    } catch {
      onError("An error occurred during OAuth initialization.")
    }
  }

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        type="button"
        className="border-muted/80 bg-muted/20 hover:bg-muted h-11 flex-1 font-medium"
        onClick={() => handleOAuthLogin("google")}
      >
        <FcGoogle className="mr-2 h-5 w-5" />
        Google
      </Button>

      <Button
        variant="outline"
        type="button"
        className="border-muted/80 bg-muted/20 hover:bg-muted h-11 flex-1 font-medium"
        onClick={() => handleOAuthLogin("github")}
      >
        <FaGithub className="mr-2 h-5 w-5" />
        GitHub
      </Button>
    </div>
  )
}

export default OAuthButtons
