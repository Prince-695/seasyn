import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { loginSchema } from "@/lib/validators"
import type { LoginInput } from "@/lib/validators"
import { useAuthStore } from "@/store/authStore"
import { authApi, userApi } from "@/api/auth"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { User } from "@/types"
import axios from "axios"

interface LoginFormProps {
  setServerError: (error: string | null) => void
}

export function LoginForm({ setServerError }: LoginFormProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      setServerError(null)
      await authApi.login(data)

      // Query authenticated user profile
      const profileRes = await userApi.getMyProfile()
      if (!profileRes.data) {
        throw new Error("Unable to retrieve user profile after login.")
      }

      const user: User = {
        ...profileRes.data,
        is_verified: profileRes.data.is_verified ?? false, // fail closed
      }

      setAuth(user)

      // If user account is not verified, dispatch OTP and route to /verify-email
      if (!user.is_verified) {
        try {
          await authApi.sendOtp()
        } catch {
          // Non-blocking: user can manually trigger resend on /verify-email
        }
        navigate("/verify-email", {
          replace: true,
          state: { email: user.email },
        })
        return
      }

      navigate(getSafeRedirectTarget(location.state?.from), { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setServerError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Invalid credentials"
        )
      } else {
        setServerError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please check your credentials."
        )
      }
    }
  }

  const fields: Array<{
    id: keyof LoginInput
    label: string
    type: string
    placeholder: string
  }> = [
    {
      id: "email",
      label: "Email Address",
      type: "email",
      placeholder: "jane@example.com",
    },
    {
      id: "password",
      label: "Password",
      type: "password",
      placeholder: "••••••••",
    },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      {fields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor={field.id}
              className="text-foreground text-sm font-medium"
            >
              {field.label}
            </Label>
            {field.id === "password" && (
              <Link
                to="/forgot-password"
                className="text-primary hover:text-primary/80 cursor-pointer text-xs font-medium transition-colors"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <Input
              id={field.id}
              type={
                field.id === "password" && showPassword ? "text" : field.type
              }
              placeholder={field.placeholder}
              {...register(field.id)}
              aria-invalid={!!errors[field.id]}
              className={`border-border/80 bg-background/60 focus-visible:border-primary focus-visible:ring-primary/20 h-10 w-full text-sm transition-all duration-200 ${
                field.id === "password" ? "pr-10" : ""
              }`}
            />
            {field.id === "password" && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 h-auto w-auto -translate-y-1/2 cursor-pointer p-1 focus:outline-hidden"
              >
                {showPassword ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          {errors[field.id] && (
            <p className="text-destructive flex items-center gap-1 text-xs font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors[field.id]?.message}
            </p>
          )}
        </div>
      ))}

      <Button
        type="submit"
        className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 mt-2 h-10 w-full cursor-pointer text-sm font-semibold shadow-xs transition-all"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Authenticating
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
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

export default LoginForm
