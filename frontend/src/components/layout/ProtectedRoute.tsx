import { Navigate, Outlet, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuthStore } from "@/store/authStore"

interface ProtectedRouteProps {
  children?: ReactNode
}

/**
 * ProtectedRoute
 *
 * Secures routes that require authentication. Redirects unauthorized users
 * to the login page. Works as both a layout component (Outlet) and a wrapper.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  // Optionally render a loading spinner while checking auth status (e.g. validating token with /me endpoint)
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
