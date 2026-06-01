import React, { useState } from "react"
import { createPortal } from "react-dom"
import { X, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// ─── Base PopUp ────────────────────────────────────────────────────────────────

interface PopUpProps {
  isOpen: boolean
  onClose?: () => void
  children: React.ReactNode
}

const PopUp = ({ isOpen, onClose, children }: PopUpProps) => {
  const [mounted] = useState(true) // Set to true for SSR compatibility

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 p-4 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
            className="relative w-full max-w-lg rounded-xl border border-border bg-background p-8 shadow-2xl"
          >
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default PopUp

// ─── OTP Popup ─────────────────────────────────────────────────────────────────

interface OtpPopupProps {
  isOpen: boolean
  email: string
  otp: string
  onOtpChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onResend: () => void
  onClose: () => void
}

export function OtpPopup({
  isOpen,
  email,
  otp,
  onOtpChange,
  onSubmit,
  onResend,
  onClose,
}: OtpPopupProps) {
  return (
    <PopUp isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6 py-2 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-primary-1">
            Enter OTP
          </h2>
          <p className="text-sm text-muted-foreground">
            We've sent a 6-digit code to <br />
            <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col items-center space-y-4"
        >
          <Input
            id="otp"
            type="text"
            maxLength={6}
            placeholder="0 0 0 0 0 0"
            className="h-16 w-full bg-background/50 text-center font-mono text-3xl tracking-[0.5em] transition-all duration-200 focus-visible:border-primary-1 focus-visible:ring-primary-1/20"
            value={otp}
            onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ""))}
            required
          />
          <Button
            type="submit"
            className="mt-2 h-11 w-full bg-primary-1 font-semibold text-primary-foreground shadow-md shadow-primary-1/20 transition-all hover:bg-primary-1/90"
          >
            Verify OTP
          </Button>

          <div className="mt-4 w-1/2 border-t border-border text-center text-sm">
            <span className="text-muted-foreground">
              Didn't receive the code?{" "}
            </span>
            <button
              type="button"
              className="cursor-pointer font-medium text-primary-1 hover:text-primary-2"
              onClick={onResend}
            >
              Resend
            </button>
          </div>
        </form>
      </div>
    </PopUp>
  )
}

// ─── Success Popup ─────────────────────────────────────────────────────────────

interface SuccessPopupProps {
  isOpen: boolean
}

export function SuccessPopup({ isOpen }: SuccessPopupProps) {
  const navigate = useNavigate()

  return (
    <PopUp isOpen={isOpen}>
      <div className="space-y-5 py-4 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-chart-2/10 p-4">
            <CheckCircle2 className="h-14 w-14 text-chart-2" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-primary-1">
            Password Updated!
          </h2>
          <p className="text-sm text-muted-foreground">
            Your password has been changed successfully.
            <br />
            You can now sign in with your new password.
          </p>
        </div>
        <Button
          onClick={() => navigate("/sign-in")}
          className="mt-2 h-11 w-full bg-primary-1 font-semibold text-primary-foreground shadow-md shadow-primary-1/20 transition-all hover:bg-primary-1/80"
        >
          Go to Sign In
        </Button>
      </div>
    </PopUp>
  )
}
