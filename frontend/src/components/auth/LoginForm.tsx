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

  const from =
    location.state?.from?.pathname && location.state?.from?.pathname !== "/"
      ? location.state.from.pathname
      : "/dashboard"

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

      // Query profile and verification status
      let user: User
      try {
        const profileRes = await userApi.getMyProfile()
        const profile = profileRes.data
        const meRes = await authApi.me().catch(() => null)
        const isVerified =
          profile?.is_verified ??
          (meRes?.data as { is_verified?: boolean } | undefined)?.is_verified ??
          true

        user = {
          id: (profile as unknown as { id?: string })?.id ?? data.email,
          email: profile?.email || data.email,
          first_name: profile?.first_name || data.email.split("@")[0],
          last_name: profile?.last_name || "",
          username: profile?.username || "",
          is_verified: isVerified,
        }
      } catch {
        user = {
          id: "authenticated-user",
          email: data.email,
          first_name: data.email.split("@")[0],
          last_name: "",
          is_verified: true,
        }
      }

      setAuth(user)

      // If user account is not verified, dispatch OTP and route to /verify-email
      if (user.is_verified === false) {
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

      navigate(from, { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setServerError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Invalid credentials"
        )
      } else {
        setServerError("Something went wrong. Please check your credentials.")
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor={field.id}
              className="text-foreground/80 font-semibold"
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
              className={`border-muted/80 bg-muted/30 focus-visible:border-primary focus-visible:ring-primary/20 h-11 w-full transition-all duration-200 ${
                field.id === "password" ? "pr-10" : ""
              }`}
            />
            {field.id === "password" && (
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer focus:outline-hidden"
              >
                {showPassword ? (
                  <Eye className="h-4.5 w-4.5" />
                ) : (
                  <EyeOff className="h-4.5 w-4.5" />
                )}
              </button>
            )}
          </div>
          {errors[field.id] && (
            <p className="text-destructive flex items-center gap-1.5 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              {errors[field.id]?.message}
            </p>
          )}
        </div>
      ))}

      <Button
        type="submit"
        className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 mt-3 h-11 w-full font-semibold shadow-md transition-all"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Authenticating
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  )
}

export default LoginForm
