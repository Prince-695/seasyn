import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { AuthLayout } from "@/components/layout"
import { LoginForm, OAuthButtons } from "@/components/auth"

import { AlertCircle } from "lucide-react"

export function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isInitialized } = useAuthStore()
  const [serverError, setServerError] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate(getSafeRedirectTarget(location.state?.from), { replace: true })
    }
  }, [isAuthenticated, isInitialized, navigate, location.state])

  return (
    <AuthLayout
      title="Welcome back"
      description="Enter your credentials to access your account"
    >
      {serverError && (
        <div className="border-destructive/20 bg-destructive/10 text-destructive mb-2 flex items-center gap-2 rounded-lg border p-2 text-xs font-medium">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <LoginForm setServerError={setServerError} />

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <span className="border-border/70 w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-muted/60 dark:bg-muted/40 text-muted-foreground rounded-full px-2.5 font-medium">
            Or continue with
          </span>
        </div>
      </div>

      <OAuthButtons onError={setServerError} />

      <div className="text-muted-foreground pt-3 text-center text-sm">
        Don&apos;t have an account yet?{" "}
        <Link
          to="/sign-up"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </AuthLayout>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Validates and returns a safe same-origin redirect target.
 */
function getSafeRedirectTarget(fromLocation?: {
  pathname?: string
  search?: string
  hash?: string
}): string {
  if (fromLocation?.pathname && fromLocation.pathname !== "/") {
    const dest = `${fromLocation.pathname}${fromLocation.search || ""}${fromLocation.hash || ""}`
    if (dest.startsWith("/") && !dest.startsWith("//")) {
      return dest
    }
  }
  return "/dashboard"
}

export default SignIn
