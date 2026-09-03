import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { AuthLayout } from "@/components/layout"
import { LoginForm, OAuthButtons } from "@/components/auth"

import { AlertCircle } from "lucide-react"

export function SignIn() {
  const navigate = useNavigate()
  const { isAuthenticated, isInitialized } = useAuthStore()
  const [serverError, setServerError] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate("/dashboard", { replace: true })
    }
  }, [isAuthenticated, isInitialized, navigate])

  return (
    <AuthLayout
      title="Welcome back"
      description="Enter your credentials to access your account"
    >
      {serverError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <LoginForm setServerError={setServerError} />

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 font-semibold text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <OAuthButtons onError={setServerError} />

      <div className="pt-2 text-center text-sm text-muted-foreground">
        Don&apos;t have an account yet?{" "}
        <Link
          to="/sign-up"
          className="font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Sign Up
        </Link>
      </div>
    </AuthLayout>
  )
}

export default SignIn
