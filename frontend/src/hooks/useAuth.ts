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

  const { data, isSuccess, isError, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const response = await authApi.me()
      return response.user || response.data?.user || response.data || response
    },
    // Only fire when localStorage has a user OR if we just returned from OAuth.
    enabled: hasLocalUser || hasPendingOAuth,
    // staleTime: 0 forces a fresh /auth/me on every mount (page refresh).
    // This prevents a stale TanStack Query cache from keeping isSuccess=true
    // after tokens have been invalidated server-side.
    staleTime: 0,
    retry: false, // Don't retry on 401 — the Axios interceptor handles token refresh → retry
  })

  // Sync TanStack Query result into Zustand for global UI consumption
  useEffect(() => {
    // Clear the pending OAuth flag once the query completes
    if (isSuccess || isError) {
      sessionStorage.removeItem("oauth_pending")
    }

    if (isSuccess && data) {
      setAuth(data)
      setInitialized(true)
    } else if (isError) {
      // /auth/me failed AND the Axios interceptor's refresh attempt also failed.
      // Clear everything so the user is redirected to /sign-in.
      clearAuth()
      setInitialized(true)
    } else if (!hasLocalUser && !hasPendingOAuth) {
      // No localStorage user AND no pending OAuth → unauthenticated, no network call needed.
      setInitialized(true)
    }
  }, [isSuccess, isError, data, setAuth, clearAuth, setInitialized, hasLocalUser, hasPendingOAuth])

  return { user, isAuthenticated, isInitialized, isLoading }
}

export default useAuth
