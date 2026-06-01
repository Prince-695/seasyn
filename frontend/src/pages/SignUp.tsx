import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, AlertCircle } from "lucide-react"
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

export default function SignUp() {
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
      <Card className="border-primary/10 w-full max-w-md py-8 shadow-xl">
        <CardHeader className="space-y-2 p-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-primary-1">
            Create an account
          </CardTitle>
          <CardDescription className="font-medium text-muted-foreground">
            Join Seasyn to start managing your migrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
                {serverError}
              </div>
            )}

            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
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
              className="mt-2 h-11 w-full bg-primary-1 font-semibold text-white shadow-md shadow-primary-1/20 transition-all hover:bg-primary-1/90"
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

          <div className="relative m-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 font-semibold text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="mb-3 flex gap-1">
            <Button
              variant="outline"
              className="h-11 w-1/2 bg-background font-medium hover:bg-muted"
            >
              <FcGoogle className="mr-2 h-5 w-5" />
              Google
            </Button>
            <Button
              variant="outline"
              className="h-11 w-1/2 bg-background font-medium hover:bg-muted"
            >
              <FaGithub className="mr-2 h-5 w-5" />
              GitHub
            </Button>
          </div>
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
