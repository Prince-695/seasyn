import { useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import { authApi } from "@/api/auth"
import { useQuery } from "@tanstack/react-query"
import { getCookie } from "@/lib/utils"

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isInitialized,
    setAuth,
    clearAuth,
    setInitialized,
  } = useAuthStore()

  const hasLocalUser = !!localStorage.getItem("user")
  const hasTokenCookie = !!getCookie("access_token")

  // Early-exit: localStorage has a stale user but the token cookies are gone
  // (e.g. manually deleted). Don't even attempt a network call — clear immediately.
  useEffect(() => {
    if (hasLocalUser && !hasTokenCookie) {
      console.warn(
        "[useAuth] Stale localStorage user detected with no token cookie. Clearing auth."
      )
      clearAuth()
      setInitialized(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount only

  // Only query the backend when BOTH localStorage user AND a token cookie exist.
  // This prevents a stale TanStack Query cache from keeping isSuccess=true
  // even after tokens have been deleted.
  const { data, isSuccess, isError, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const response = await authApi.me()
      return response.user || response.data?.user || response.data || response
    },
    enabled: hasLocalUser && hasTokenCookie,
    retry: false, // Don't retry on 401 — the Axios interceptor handles token refresh
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  // Sync TanStack Query result into Zustand for global UI consumption
  useEffect(() => {
    if (isSuccess && data) {
      setAuth(data)
      setInitialized(true)
    } else if (isError) {
      // API call failed (e.g. 401 + refresh also failed).
      // Axios interceptor already called clearAuth(), but we guard here too.
      clearAuth()
      setInitialized(true)
    } else if (!hasLocalUser) {
      // No user in localStorage → definitely not logged in.
      setInitialized(true)
    }
  }, [
    isSuccess,
    isError,
    data,
    setAuth,
    clearAuth,
    setInitialized,
    hasLocalUser,
  ])

  return { user, isAuthenticated, isInitialized, isLoading }
}

export default useAuth
