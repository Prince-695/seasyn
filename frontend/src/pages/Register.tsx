import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Sparkles, AlertCircle } from "lucide-react"
import { registerSchema } from "@/lib/validators"
import type { RegisterInput } from "@/lib/validators"
// import { useAuthStore } from '@/store/authStore';

import { FcGoogle } from "react-icons/fc"
import { FaGithub } from "react-icons/fa"
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

export default function Register() {
  const navigate = useNavigate()
  //   const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null)

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
      /* Commenting out backend logic for now to see UI
      const response = await authApi.register(data);
      if (response.token && response.user) {
        setAuth(response.user, response.token);
        navigate('/');
      } else {
        navigate('/login');
      }
      */

      // Mock success for UI testing
      console.log("Mock Registration Success:", data)
      setTimeout(() => {
        navigate("/login")
      }, 1000)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setServerError(
          err.response?.data?.message ||
            "Registration failed. Please try again."
        )
      } else {
        setServerError("Registration failed. Please try again.")
      }
    }
  }

  const fields: Array<{
    id: keyof RegisterInput
    label: string
    type: string
    placeholder: string
  }> = [
    { id: "name", label: "Full Name", type: "text", placeholder: "Jane Doe" },
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
    {
      id: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      placeholder: "••••••••",
    },
  ]

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <Card className="border-primary/10 w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 pb-6 text-center">
          <div className="mb-2 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-1/10">
              <Sparkles className="h-6 w-6 text-primary-1" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary-1">
            Create an account
          </CardTitle>
          <CardDescription className="font-medium text-muted-foreground">
            Join Seasyn to start managing your migrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4">
            <Button
              variant="outline"
              className="h-11 w-full bg-background font-medium hover:bg-muted"
            >
              <FcGoogle className="mr-2 h-5 w-5" />
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full bg-background font-medium hover:bg-muted"
            >
              <FaGithub className="mr-2 h-5 w-5" />
              Continue with GitHub
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 font-semibold text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
                {serverError}
              </div>
            )}

            {fields.map((field) => (
              <div key={field.id} className="space-y-2.5">
                <Label
                  htmlFor={field.id}
                  className="font-semibold text-foreground/80"
                >
                  {field.label}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  {...register(field.id)}
                  aria-invalid={!!errors[field.id]}
                  className="h-11 bg-background/50 transition-all duration-200 focus-visible:border-primary-1 focus-visible:ring-primary-1/20"
                />
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
              className="mt-6 h-11 w-full bg-primary-1 font-semibold text-white shadow-md shadow-primary-1/20 transition-all hover:bg-primary-1/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="mt-2 flex flex-col text-center">
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary-1 transition-colors hover:text-primary-1/80"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
