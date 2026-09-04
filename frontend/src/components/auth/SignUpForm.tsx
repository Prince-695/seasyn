import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { registerSchema } from "@/lib/validators"
import type { RegisterInput } from "@/lib/validators"
import { authApi } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"
import type { SignupPayload, User } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import axios from "axios"

interface SignUpFormProps {
  setServerError: (error: string | null) => void
}

export function SignUpForm({ setServerError }: SignUpFormProps) {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    try {
      setServerError(null)

      const signupPayload: SignupPayload = {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      }

      const response = await authApi.register(signupPayload)

      // The backend sets session cookies upon registration.
      const registeredUser: User = response.data ??
        response.user ?? {
          id: "registered-user",
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          is_verified: false,
        }
      setAuth(registeredUser)

      // Dispatch the OTP verification email via POST /v1/auth/otp/send
      try {
        await authApi.sendOtp()
      } catch {
        // Non-blocking: user can trigger resend on the /verify-email screen
      }

      // Navigate to email verification screen
      navigate("/verify-email", {
        replace: true,
        state: { email: data.email },
      })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setServerError(
          err.response?.data?.message ??
            err.response?.data?.error ??
            "Registration failed. Please try again."
        )
      } else {
        setServerError("Something went wrong during registration.")
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* First Name & Last Name inputs in a single row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="firstName"
            className="font-semibold text-foreground/80"
          >
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Jane"
            {...register("firstName")}
            aria-invalid={!!errors.firstName}
            className="h-11 w-full border-muted/80 bg-muted/30 transition-all duration-200 focus-visible:border-primary focus-visible:ring-primary/20"
          />
          {errors.firstName && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4" />
              {errors.firstName?.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="lastName"
            className="font-semibold text-foreground/80"
          >
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            {...register("lastName")}
            aria-invalid={!!errors.lastName}
            className="h-11 w-full border-muted/80 bg-muted/30 transition-all duration-200 focus-visible:border-primary focus-visible:ring-primary/20"
          />
          {errors.lastName && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4" />
              {errors.lastName?.message}
            </p>
          )}
        </div>
      </div>

      {/* Email Address */}
      <div className="space-y-2">
        <Label htmlFor="email" className="font-semibold text-foreground/80">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="jane@example.com"
          {...register("email")}
          aria-invalid={!!errors.email}
          className="h-11 w-full border-muted/80 bg-muted/30 transition-all duration-200 focus-visible:border-primary focus-visible:ring-primary/20"
        />
        {errors.email && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.email?.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="font-semibold text-foreground/80">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("password")}
            aria-invalid={!!errors.password}
            className="h-11 w-full border-muted/80 bg-muted/30 pr-10 transition-all duration-200 focus-visible:border-primary focus-visible:ring-primary/20"
          />
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
        </div>
        {errors.password && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.password?.message}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label
          htmlFor="confirmPassword"
          className="font-semibold text-foreground/80"
        >
          Confirm Password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
            className="h-11 w-full border-muted/80 bg-muted/30 pr-10 transition-all duration-200 focus-visible:border-primary focus-visible:ring-primary/20"
          />
          <button
            type="button"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground focus:outline-hidden"
          >
            {showConfirmPassword ? (
              <Eye className="h-4.5 w-4.5" />
            ) : (
              <EyeOff className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.confirmPassword?.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="mt-3 h-11 w-full bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Creating Account
          </>
        ) : (
          "Sign Up"
        )}
      </Button>
    </form>
  )
}
export default SignUpForm
