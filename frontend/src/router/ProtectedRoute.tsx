import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { Loader2 } from "lucide-react"
import type { ProtectedRouteProps } from "@/types"

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  // Still bootstrapping session from backend
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not logged in → redirect to sign-in, preserve intended destination
  if (!isAuthenticated || !user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  // Logged in but email not verified → redirect to verification gate
  if (!user.is_verified) {
    return <Navigate to="/verify-email" state={{ email: user.email }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default ProtectedRoute
