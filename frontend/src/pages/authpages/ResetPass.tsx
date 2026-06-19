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
import { motion } from "framer-motion"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import axios from "axios"

export default function ResetPass() {
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
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="w-full shadow-2xl shadow-primary/20">
          <CardHeader className="space-y-2 p-6 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-primary">
              Reset Password
            </CardTitle>
            <CardDescription className="font-medium text-muted-foreground">
              Enter the OTP sent to your email and your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {serverError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
                  {serverError}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2.5">
                <Label
                  htmlFor="email"
                  className="font-semibold text-foreground/80"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <span className="absolute top-3 left-3 h-5 w-5 text-muted-foreground">
                    <Mail className="h-5 w-5" />
                  </span>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@example.com"
                    {...register("email")}
                    aria-invalid={!!errors.email}
                    className="h-11 bg-background/50 pl-10 transition-all duration-200 focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email?.message}
                  </p>
                )}
              </div>

              {/* OTP Field */}
              <div className="space-y-2.5">
                <Label
                  htmlFor="otp"
                  className="font-semibold text-foreground/80"
                >
                  Verification Code (OTP)
                </Label>
                <div className="relative">
                  <span className="absolute top-3 left-3 h-5 w-5 text-muted-foreground">
                    <Key className="h-5 w-5" />
                  </span>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    {...register("otp")}
                    aria-invalid={!!errors.otp}
                    className="h-11 bg-background/50 pl-10 font-mono tracking-widest transition-all duration-200 focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                </div>
                {errors.otp && (
                  <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {errors.otp?.message}
                  </p>
                )}
              </div>

              {/* New Password Field */}
              <div className="space-y-2.5">
                <Label
                  htmlFor="password"
                  className="font-semibold text-foreground/80"
                >
                  New Password
                </Label>
                <div className="relative">
                  <span className="absolute top-3 left-3 h-5 w-5 text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </span>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    aria-invalid={!!errors.password}
                    className="h-11 w-full bg-background/50 pr-10 pl-10 transition-all duration-200 focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                  <button
                    type="button"
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

              {/* Confirm Password Field */}
              <div className="space-y-2.5">
                <Label
                  htmlFor="confirmPassword"
                  className="font-semibold text-foreground/80"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <span className="absolute top-3 left-3 h-5 w-5 text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </span>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    aria-invalid={!!errors.confirmPassword}
                    className="h-11 w-full bg-background/50 pr-10 pl-10 transition-all duration-200 focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                  <button
                    type="button"
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
                    Resetting Password
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="mt-2 flex flex-col space-y-4 text-center">
            <div className="flex items-center justify-center">
              <Link
                to="/forgot-password"
                className="flex items-center justify-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Forgot Password
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      <Dialog open={isSuccessOpen}>
        <DialogContent className="space-y-5 py-6 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-500/10 p-4 dark:bg-emerald-500/20">
              <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            </div>
          </div>
          <DialogHeader className="space-y-2 text-center sm:text-center">
            <DialogTitle className="text-center text-2xl font-bold tracking-tight text-primary">
              Password Updated!
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              Your password has been changed successfully.
              <br />
              You can now sign in with your new password.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => navigate("/sign-in")}
            className="mt-2 h-11 w-full bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/80"
          >
            Go to Sign In
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
