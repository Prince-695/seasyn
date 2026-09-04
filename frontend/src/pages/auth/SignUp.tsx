import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { AuthLayout } from "@/components/layout"
import { SignUpForm, OAuthButtons } from "@/components/auth"

import { AlertCircle } from "lucide-react"

export function SignUp() {
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
      title="Create an account"
      description="Join Seasyn to start managing your migrations"
    >
      {serverError && (
        <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <SignUpForm setServerError={setServerError} />

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
        Already have an account?{" "}
        <Link
          to="/sign-in"
          className="text-primary hover:text-primary/80 font-semibold transition-colors"
        >
          Sign In
        </Link>
      </div>
    </AuthLayout>
  )
}

export default SignUp
