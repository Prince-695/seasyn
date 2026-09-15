import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { registerSchema } from "@/lib/validators"
import type { RegisterInput } from "@/lib/validators"
import { authApi, userApi } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"
import type { SignupPayload, User } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/errors"

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

      await authApi.register(signupPayload)

      // Fetch newly created user profile
      let registeredUser: User
      try {
        const profileRes = await userApi.getMyProfile()
        if (profileRes.data) {
          registeredUser = {
            ...profileRes.data,
            is_verified: false,
          }
        } else {
          throw new Error("Unable to retrieve user profile after registration.")
        }
      } catch {
        registeredUser = {
          id: data.email,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          is_verified: false,
        }
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
      setServerError(
        getErrorMessage(
          err,
          "Unable to create your account. Please check that your email is not already registered and try again."
        )
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
      {/* First Name & Last Name inputs in a single row */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <Label
            htmlFor="firstName"
            className="text-foreground text-xs font-semibold sm:text-[13px] sm:font-medium"
          >
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Jane"
            {...register("firstName")}
            aria-invalid={!!errors.firstName}
            className="border-border/80 bg-background/60 focus-visible:border-primary focus-visible:ring-primary/20 h-9.5 w-full text-sm transition-all duration-200"
          />
          {errors.firstName && (
            <p className="text-destructive flex items-center gap-1 text-xs font-medium">
              <AlertCircle className="h-3 w-3" />
              {errors.firstName?.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="lastName"
            className="text-foreground text-xs font-semibold sm:text-[13px] sm:font-medium"
          >
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            {...register("lastName")}
            aria-invalid={!!errors.lastName}
            className="border-border/80 bg-background/60 focus-visible:border-primary focus-visible:ring-primary/20 h-9.5 w-full text-sm transition-all duration-200"
          />
          {errors.lastName && (
            <p className="text-destructive flex items-center gap-1 text-xs font-medium">
              <AlertCircle className="h-3 w-3" />
              {errors.lastName?.message}
            </p>
          )}
        </div>
      </div>

      {/* Email Address */}
      <div className="space-y-1">
        <Label
          htmlFor="email"
          className="text-foreground text-xs font-semibold sm:text-[13px] sm:font-medium"
        >
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="jane@example.com"
          {...register("email")}
          aria-invalid={!!errors.email}
          className="border-border/80 bg-background/60 focus-visible:border-primary focus-visible:ring-primary/20 h-9.5 w-full text-sm transition-all duration-200"
        />
        {errors.email && (
          <p className="text-destructive flex items-center gap-1 text-xs font-medium">
            <AlertCircle className="h-3 w-3" />
            {errors.email?.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1">
        <Label
          htmlFor="password"
          className="text-foreground text-xs font-semibold sm:text-[13px] sm:font-medium"
        >
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("password")}
            aria-invalid={!!errors.password}
            className="border-border/80 bg-background/60 focus-visible:border-primary focus-visible:ring-primary/20 h-9.5 w-full pr-9 text-sm transition-all duration-200"
          />
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
        </div>
        {errors.password && (
          <p className="text-destructive flex items-center gap-1 text-xs font-medium">
            <AlertCircle className="h-3 w-3" />
            {errors.password?.message}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1">
        <Label
          htmlFor="confirmPassword"
          className="text-foreground text-xs font-semibold sm:text-[13px] sm:font-medium"
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
            className="border-border/80 bg-background/60 focus-visible:border-primary focus-visible:ring-primary/20 h-9.5 w-full pr-9 text-sm transition-all duration-200"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 h-auto w-auto -translate-y-1/2 cursor-pointer p-1 focus:outline-hidden"
          >
            {showConfirmPassword ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-destructive flex items-center gap-1 text-xs font-medium">
            <AlertCircle className="h-3 w-3" />
            {errors.confirmPassword?.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 mt-1 h-10 w-full cursor-pointer text-sm font-semibold shadow-xs transition-all"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account
          </>
        ) : (
          "Sign Up"
        )}
      </Button>

      <p className="text-muted-foreground mt-2 text-center text-xs">
        By creating an account, you agree to our{" "}
        <Link
          to="/terms-and-conditions"
          className="text-foreground hover:text-primary underline transition-colors"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          to="/privacy-policy"
          className="text-foreground hover:text-primary underline transition-colors"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  )
}
export default SignUpForm
