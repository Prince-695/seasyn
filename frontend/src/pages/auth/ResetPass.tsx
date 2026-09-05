import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  Mail,
  Key,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react"
import { resetPasswordSchema } from "@/lib/validators"
import type { ResetPasswordInput } from "@/lib/validators"
import { authApi } from "@/api/auth"
import { AuthLayout } from "@/components/layout"
import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import axios from "axios"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export function ResetPass() {
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Retrieve email from navigation state if redirected from forgot-password page
  const initialEmail = location.state?.email || ""

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      otp: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setServerError(null)
      await authApi.resetPassword(data)
      setIsSuccessOpen(true)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setServerError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Something went wrong"
        )
      } else {
        setServerError("Failed to reset password. Please verify your OTP code.")
      }
    }
  }

  return (
    <>
      <AuthLayout
        title="Reset Password"
        description="Enter the OTP sent to your email and your new password."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground/80 font-semibold">
              Email Address
            </Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-3 left-3 h-5 w-5">
                <Mail className="h-5 w-5" />
              </span>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                {...register("email")}
                aria-invalid={!!errors.email}
                className="border-muted/80 bg-muted/30 focus-visible:border-primary focus-visible:ring-primary/20 h-11 pl-10 transition-all duration-200"
              />
            </div>
            {errors.email && (
              <p className="text-destructive flex items-center gap-1.5 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                {errors.email?.message}
              </p>
            )}
          </div>

          {/* OTP Field */}
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-foreground/80 font-semibold">
              Verification Code (OTP)
            </Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-3 left-3 h-5 w-5">
                <Key className="h-5 w-5" />
              </span>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                placeholder="123456"
                {...register("otp")}
                aria-invalid={!!errors.otp}
                className="border-muted/80 bg-muted/30 focus-visible:border-primary focus-visible:ring-primary/20 h-11 pl-10 font-mono tracking-widest transition-all duration-200"
              />
            </div>
            {errors.otp && (
              <p className="text-destructive flex items-center gap-1.5 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                {errors.otp?.message}
              </p>
            )}
          </div>

          {/* New Password Field */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-foreground/80 font-semibold"
            >
              New Password
            </Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-3 left-3 h-5 w-5">
                <Lock className="h-5 w-5" />
              </span>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                aria-invalid={!!errors.password}
                className="border-muted/80 bg-muted/30 focus-visible:border-primary focus-visible:ring-primary/20 h-11 w-full pr-10 pl-10 transition-all duration-200"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 h-auto w-auto -translate-y-1/2 cursor-pointer p-1 focus:outline-hidden"
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5" />
                ) : (
                  <Eye className="h-4.5 w-4.5" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-destructive flex items-center gap-1.5 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                {errors.password?.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-foreground/80 font-semibold"
            >
              Confirm New Password
            </Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-3 left-3 h-5 w-5">
                <Lock className="h-5 w-5" />
              </span>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
                className="border-muted/80 bg-muted/30 focus-visible:border-primary focus-visible:ring-primary/20 h-11 w-full pr-10 pl-10 transition-all duration-200"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 h-auto w-auto -translate-y-1/2 cursor-pointer p-1 focus:outline-hidden"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4.5 w-4.5" />
                ) : (
                  <Eye className="h-4.5 w-4.5" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-destructive flex items-center gap-1.5 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                {errors.confirmPassword?.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 mt-3 h-11 w-full font-semibold shadow-md transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Resetting Password
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>

        <div className="pt-2 text-center">
          <Link
            to="/forgot-password"
            className="text-muted-foreground hover:text-primary inline-flex items-center justify-center text-sm font-medium transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forgot Password
          </Link>
        </div>
      </AuthLayout>

      <Dialog open={isSuccessOpen}>
        <DialogContent className="space-y-5 py-6 text-center">
          <div className="flex justify-center">
            <div className="bg-success/10 rounded-full p-4">
              <CheckCircle2 className="text-success h-14 w-14" />
            </div>
          </div>

          <DialogHeader className="space-y-2 text-center sm:text-center">
            <DialogTitle className="text-primary text-center text-2xl font-bold tracking-tight">
              Password Updated!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-center text-sm">
              Your password has been changed successfully.
              <br />
              You can now sign in with your new password.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => navigate("/sign-in")}
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/80 mt-2 h-11 w-full font-semibold shadow-md transition-all"
          >
            Go to Sign In
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ResetPass
