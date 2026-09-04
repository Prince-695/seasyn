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
        <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <LoginForm setServerError={setServerError} />

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="border-border w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2 font-semibold">
            Or continue with
          </span>
        </div>
      </div>

      <OAuthButtons onError={setServerError} />

      <div className="text-muted-foreground pt-2 text-center text-sm">
        Don&apos;t have an account yet?{" "}
        <Link
          to="/sign-up"
          className="text-primary hover:text-primary/80 font-semibold transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </AuthLayout>
  )
}

export default SignIn
