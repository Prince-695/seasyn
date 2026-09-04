import { useState, useEffect, useCallback } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle,
  Loader2,
  MailCheck,
  ArrowLeft,
  RefreshCw,
} from "lucide-react"
import { authApi } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"
import { AuthLayout } from "@/components/layout"
import { Button } from "@/components/ui/button"

import { OtpInput } from "@/components/auth/OtpInput"
import axios from "axios"

const RESEND_COOLDOWN = 60 // seconds

export function VerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth, user, isAuthenticated, isInitialized } = useAuthStore()

  // Redirect to dashboard immediately if user is already verified
  useEffect(() => {
    if (isInitialized && isAuthenticated && user?.is_verified) {
      navigate("/dashboard", { replace: true })
    }
  }, [isInitialized, isAuthenticated, user?.is_verified, navigate])

  // Email can come from router state (signup redirect) or from the auth store
  const emailFromState = location.state?.email as string | undefined
  const emailFromStore = user?.email
  const email = emailFromState ?? emailFromStore ?? ""

  const [otp, setOtp] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN)
  const [resendLoading, setResendLoading] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  const handleVerify = useCallback(
    async (codeToVerify?: string) => {
      const code = codeToVerify ?? otp
      if (code.length !== 6) return
      if (!email) {
        setServerError("Email address not found. Please sign up again.")
        return
      }

      setIsSubmitting(true)
      setServerError(null)

      try {
        await authApi.verifyEmail({ otp: code })

        // Fetch freshly verified user profile
        try {
          const meRes = await authApi.me()
          const verifiedUser = meRes.data ?? meRes.user
          if (verifiedUser) setAuth(verifiedUser)
        } catch {
          if (user) setAuth({ ...user, is_verified: true })
        }

        navigate("/dashboard", { replace: true })
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setServerError(
            err.response?.data?.message ??
              err.response?.data?.error ??
              "Invalid or expired code. Please try again."
          )
        } else {
          setServerError("Something went wrong. Please try again.")
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [otp, email, user, setAuth, navigate]
  )

  const handleResend = async () => {
    if (resendTimer > 0) return
    setResendLoading(true)
    setServerError(null)
    try {
      await authApi.sendOtp()
      setResendTimer(RESEND_COOLDOWN)
      setOtp("")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setServerError(
          err.response?.data?.message ??
            "Failed to resend code. Please try again."
        )
      } else {
        setServerError("Failed to resend code. Please try again.")
      }
    } finally {
      setResendLoading(false)
    }
  }

  // Prevent flashing OTP form if user is already verified
  if (isInitialized && isAuthenticated && user?.is_verified) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <AuthLayout
      title="Check your email"
      description={
        email
          ? `We sent a 6-digit code to ${email}`
          : "We sent a 6-digit verification code to your email"
      }
    >
      <div className="space-y-6">
        {/* Mail icon with animation */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center"
        >
          <div className="bg-primary/10 rounded-full p-4">
            <MailCheck className="text-primary h-10 w-10" />
          </div>
        </motion.div>

        {/* Error message */}
        <AnimatePresence mode="wait">
          {serverError && (
            <motion.div
              key={serverError}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-2.5 rounded-lg border p-3 text-sm font-medium"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OTP Input */}
        <div className="space-y-3">
          <OtpInput
            value={otp}
            onChange={setOtp}
            onComplete={(code) => handleVerify(code)}
            disabled={isSubmitting}
            hasError={!!serverError}
            autoFocus
          />

          <p className="text-muted-foreground text-center text-xs">
            Enter the 6-digit code from your email. It expires in 10 minutes.
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="button"
          className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 h-11 w-full font-semibold shadow-md transition-all"
          disabled={isSubmitting || otp.length < 6}
          onClick={() => handleVerify()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Email"
          )}
        </Button>

        {/* Resend + navigation */}
        <div className="space-y-3 text-center">
          <div className="text-muted-foreground text-sm">
            {"Didn't receive it? "}
            <button
              type="button"
              disabled={resendTimer > 0 || resendLoading || !email}
              onClick={handleResend}
              className="text-primary hover:text-primary/80 inline-flex items-center gap-1 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending...
                </>
              ) : resendTimer > 0 ? (
                <span className="text-muted-foreground">
                  Resend in{" "}
                  <span className="text-foreground tabular-nums">
                    {String(Math.floor(resendTimer / 60)).padStart(2, "0")}:
                    {String(resendTimer % 60).padStart(2, "0")}
                  </span>
                </span>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Resend code
                </>
              )}
            </button>
          </div>

          <Link
            to="/sign-in"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default VerifyEmail
