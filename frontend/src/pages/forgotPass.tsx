import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { OtpPopup, SuccessPopup } from "@/components/popUp"

// ─── Reusable field layout ─────────────────────────────────────────────────────
function FormField({
  id,
  label,
  icon,
  children,
}: {
  id: string
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="font-semibold text-foreground/80">
        {label}
      </Label>
      <div className="relative">
        <span className="absolute top-3 left-3 h-5 w-5 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ForgotPass() {
  // Step 1: Email, Step 2: OTP (Popup), Step 3: New Passwords, Step 4: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Integrate backend API to send OTP to email
    console.log("Sending OTP to:", email)
    setStep(2)
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Integrate backend API to verify OTP
    console.log("Verifying OTP:", otp)
    setStep(3)
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Integrate backend API to securely update password
    console.log("Updating password with new criteria")
    setStep(4)
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md rounded-xl border border-border bg-background shadow-2xl shadow-primary-1/20"
      >
        <div className="flex flex-col space-y-2 p-6 text-center">
          <h3 className="text-3xl font-bold tracking-tight text-primary-1">
            {step === 3 ? "Reset Password" : "Forgot Password"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {step === 3
              ? "Enter your new password below."
              : "Enter your email and we'll send you an OTP to reset your password."}
          </p>
        </div>

        <div className="px-6 pb-6">
          {/* Step 1 & 2: Email entry */}
          {(step === 1 || step === 2) && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <FormField id="email" label="Email Address" icon={<Mail />}>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  className="h-11 bg-background/50 pl-10 transition-all duration-200 focus-visible:border-primary-1 focus-visible:ring-primary-1/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormField>
              <Button
                type="submit"
                className="mt-2 h-11 w-full bg-primary-1 font-semibold text-primary-foreground shadow-md shadow-primary-1/20 transition-all hover:bg-primary-1/90"
              >
                Submit
              </Button>
            </form>
          )}

          {/* Step 3: New password entry */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                id="new-password"
                type="password"
                placeholder="• • • • • • • •"
                className="h-11 bg-background/50 pl-5 transition-all duration-200 focus-visible:border-primary-1 focus-visible:ring-primary-1/20"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />

              <Input
                id="confirm-password"
                type="password"
                placeholder="• • • • • • • •"
                className="h-11 bg-background/50 pl-5 transition-all duration-200 focus-visible:border-primary-1 focus-visible:ring-primary-1/20"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              <Button
                type="submit"
                className="mt-2 h-11 w-full bg-primary-1 font-semibold text-primary-foreground shadow-md shadow-primary-1/20 transition-all hover:bg-primary-1/90"
              >
                Submit
              </Button>
            </form>
          )}
        </div>

        {step !== 4 && (
          <div className="flex items-center justify-center pb-6">
            <Link
              to="/sign-in"
              className="flex w-1/2 items-center justify-center border-t border-border p-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        )}
      </motion.div>

      <OtpPopup
        isOpen={step === 2}
        email={email}
        otp={otp}
        onOtpChange={setOtp}
        onSubmit={handleVerifyOtp}
        onResend={() => console.log("Resend OTP to:", email)}
        onClose={() => setStep(1)}
      />

      <SuccessPopup isOpen={step === 4} />
    </div>
  )
}
