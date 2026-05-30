import { useState } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Loader2 } from "lucide-react"
import { loginSchema } from "@/lib/validators"
import type { LoginInput } from "@/lib/validators"
import { useAuthStore } from "@/store/authStore"
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
import { FaGithub } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import axios from "axios" // For error type checking

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [serverError, setServerError] = useState<string | null>(null)

  // Define where to redirect upon successful login
  const from = location.state?.from?.pathname || "/"

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      setServerError(null)
      /* Commenting out backend logic for now to see UI
      const response = await authApi.login(data);
      if (response.token && response.user) {
        setAuth(response.user, response.token);
        // Replace current entry in history to prevent back-button loops
        navigate(from, { replace: true });
      } else {
        throw new Error('Invalid response from server');
      }
      */

      // Mock success for UI testing
      console.log("Mock Login Success:", data)
      setTimeout(() => {
        setAuth({ id: "1", name: "Demo User", email: data.email }, "mock-token")
        navigate(from, { replace: true })
      }, 1000)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setServerError(err.response?.data?.message || "Something went wrong")
      } else {
        setServerError("Something went wrong")
      }
    }
  }

  const fields: Array<{
    id: keyof LoginInput
    label: string
    type: string
    placeholder: string
  }> = [
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
  ]

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-2xl shadow-primary-1/20">
        <CardHeader className="space-y-2 pb-6 text-center">
          {/* <div className="mb-2 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-1/10">
              <Waves className="h-6 w-6 text-primary-1" />
            </div>
          </div> */}
          <CardTitle className="text-3xl font-bold tracking-tight text-primary-1">
            Welcome back
          </CardTitle>
          <CardDescription className="font-medium text-muted-foreground">
            Enter your credentials to access your account
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
              <div key={field.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={field.id}
                    className="font-semibold text-foreground/80"
                  >
                    {field.label}
                  </Label>
                  {/* Optional 'forgot password' link space */}
                  {field.id === "password" && (
                    <span className="cursor-pointer text-xs font-medium text-primary-1 transition-colors hover:text-primary-1/80">
                      Forgot password?
                    </span>
                  )}
                </div>
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
              className="mt-3 h-11 w-full bg-primary-1 font-semibold text-white shadow-md shadow-primary-1/20 transition-all hover:bg-primary-1/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating
                </>
              ) : (
                "Sign In"
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

          <div className="mb-6 flex gap-1">
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
        <CardFooter className="mt-2 flex flex-col space-y-4 text-center">
          <div className="text-sm text-muted-foreground">
            Don&apos;t have an account yet?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary-1 transition-colors hover:text-primary-1/80"
            >
              Create one
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
