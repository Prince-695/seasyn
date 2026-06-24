import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { loginSchema } from "@/lib/validators"
import type { LoginInput } from "@/lib/validators"
import { useAuthStore } from "@/store/authStore"
import { authApi } from "@/api/auth"
import { setCookie } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
      const response = await authApi.login(data)
      console.log("[LoginForm] login API response:", response)

      if (response?.access_token) {
        setCookie("access_token", response.access_token)
      }

      if (response?.refresh_token) {
        setCookie("refresh_token", response.refresh_token)
      }

      // Fallback to email credentials if the backend does not return user details in JSON
      const user = response.user || {
        id: "authenticated-user",
        email: data.email,
        name: data.email.split("@")[0],
      }

      setAuth(user)
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
              className="font-semibold text-foreground/80"
            >
              {field.label}
            </Label>
            {field.id === "password" && (
              <Link
                to="/forgot-password"
                className="cursor-pointer text-xs font-medium text-primary transition-colors hover:text-primary/80"
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
              className={`h-11 w-full border-muted/80 bg-muted/30 transition-all duration-200 focus-visible:border-primary focus-visible:ring-primary/20 ${
                field.id === "password" ? "pr-10" : ""
              }`}
            />
            {field.id === "password" && (
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground focus:outline-hidden"
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
            <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4" />
              {errors[field.id]?.message}
            </p>
          )}
        </div>
      ))}

      <Button
        type="submit"
        className="mt-3 h-11 w-full bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
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
