import { useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import { authApi } from "@/api/auth"
import { useQuery } from "@tanstack/react-query"

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isInitialized,
    setAuth,
    clearAuth,
    setInitialized,
  } = useAuthStore()

  // localStorage["user"] is the only JS-visible auth signal.
  // HttpOnly cookies (access_token, refresh_token) are invisible to document.cookie —
  // the browser attaches them automatically on every request without JS touching them.
  const hasLocalUser = !!localStorage.getItem("user")
  const hasPendingOAuth = !!sessionStorage.getItem("oauth_pending")
  const isDashboard = window.location.pathname.startsWith("/dashboard")

  const { data, isSuccess, isError, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const response = await authApi.me()
      return response.data ?? response.user ?? null
    },

    // Fire when localStorage has a user, or returning from OAuth, or landing on /dashboard
    enabled: hasLocalUser || hasPendingOAuth || isDashboard,
    staleTime: 0,
    retry: false,
  })

  // Sync TanStack Query result into Zustand for global UI consumption
  useEffect(() => {
    // Clear the pending OAuth flag once the query completes
    if (isSuccess || isError) {
      sessionStorage.removeItem("oauth_pending")
    }

    const currentHasLocal = !!localStorage.getItem("user")
    const currentHasOAuth = !!sessionStorage.getItem("oauth_pending")
    const onDashboard = window.location.pathname.startsWith("/dashboard")

    if (
      isSuccess &&
      data &&
      (currentHasLocal || currentHasOAuth || onDashboard)
    ) {
      setAuth(data)
      setInitialized(true)
    } else if (isError) {
      // /auth/me failed AND the Axios interceptor's refresh attempt also failed.
      // Clear everything so the user is redirected to /sign-in.
      clearAuth()
      setInitialized(true)
    } else if (!currentHasLocal && !currentHasOAuth && !onDashboard) {
      // No localStorage user, no pending OAuth, not dashboard → unauthenticated
      setInitialized(true)
    }
  }, [isSuccess, isError, data, setAuth, clearAuth, setInitialized])

  return { user, isAuthenticated, isInitialized, isLoading }
}

export default useAuth
