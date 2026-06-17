import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Mail, Loader2, AlertCircle } from "lucide-react"
import { forgotPasswordSchema } from "@/lib/validators"
import type { ForgotPasswordInput } from "@/lib/validators"
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
import axios from "axios"

export default function ForgotPass() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      setServerError(null)
      await authApi.forgotPassword(data)
      // On success, redirect to Reset Password page, passing the email
      navigate("/reset-password", { state: { email: data.email } })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setServerError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Something went wrong"
        )
      } else {
        setServerError("Something went wrong. Please try again.")
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
              Forgot Password
            </CardTitle>
            <CardDescription className="font-medium text-muted-foreground">
              Enter your email and we'll send you an OTP code to reset your
              password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {serverError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
                  {serverError}
                </div>
              )}

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

              <Button
                type="submit"
                className="mt-3 h-11 w-full bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending OTP
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="mt-2 flex flex-col space-y-4 text-center">
            <div className="flex items-center justify-center">
              <Link
                to="/sign-in"
                className="flex items-center justify-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
