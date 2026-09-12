import { useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import { userApi } from "@/api/auth"
import { useQuery } from "@tanstack/react-query"

export const isPublicRoute = (pathname: string): boolean => {
  return (
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/auth/")
  )
}

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isInitialized,
    setAuth,
    clearAuth,
    setInitialized,
  } = useAuthStore()

  // localStorage["user"] is the primary JS-visible auth signal.
  // HttpOnly cookies (access_token, refresh_token) are invisible to document.cookie —
  // the browser attaches them automatically on every request without JS touching them.
  const hasLocalUser = !!localStorage.getItem("user")
  const hasPendingOAuth = !!sessionStorage.getItem("oauth_pending")
  const pathname = window.location.pathname
  const isPublic = isPublicRoute(pathname)
  const isProtected = !isPublic

  const { data, isSuccess, isError, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      try {
        const profileRes = await userApi.getMyProfile()
        if (!profileRes.data) return null

        return {
          ...profileRes.data,
          is_verified: profileRes.data.is_verified ?? false, // fail closed
        }
      } catch {
        return null
      }
    },

    // Fire when localStorage has a user, or returning from OAuth, or landing on any protected route
    enabled: hasLocalUser || hasPendingOAuth || isProtected,
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
    const currentPathname = window.location.pathname
    const onProtected = !isPublicRoute(currentPathname)

    if (
      isSuccess &&
      data &&
      (currentHasLocal || currentHasOAuth || onProtected)
    ) {
      setAuth(data)
      setInitialized(true)
    } else if (isError || (isSuccess && !data && onProtected)) {
      // /users/me failed AND refresh attempt failed, or empty profile on protected route.
      // Clear everything so the user is redirected to /sign-in.
      clearAuth()
      setInitialized(true)
    } else if (!currentHasLocal && !currentHasOAuth && !onProtected) {
      // No localStorage user, no pending OAuth, on a public route → unauthenticated
      setInitialized(true)
    }
  }, [isSuccess, isError, data, setAuth, clearAuth, setInitialized])

  return { user, isAuthenticated, isInitialized, isLoading }
}

export default useAuth
