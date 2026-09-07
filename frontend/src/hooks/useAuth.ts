import { useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import { authApi, userApi } from "@/api/auth"
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
  const pathname = window.location.pathname
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/auth/")
  const isProtected = !isPublic

  const { data, isSuccess, isError, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const authRes = await authApi.me()
      const authData = authRes.data as { is_verified?: boolean } | undefined

      try {
        const profileRes = await userApi.getMyProfile()
        const profile = profileRes.data
        if (profile) {
          return {
            ...profile,
            id: (profile as unknown as { id?: string }).id ?? profile.email,
            is_verified: profile.is_verified ?? authData?.is_verified ?? true,
          }
        }
      } catch {
        // If /users/me fails but /auth/me succeeded
      }

      return authData
        ? {
            id: "authenticated-user",
            email: "",
            first_name: "",
            last_name: "",
            is_verified: authData.is_verified ?? true,
          }
        : null
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
    const onProtected = !(
      currentPathname === "/" ||
      currentPathname.startsWith("/sign-in") ||
      currentPathname.startsWith("/sign-up") ||
      currentPathname.startsWith("/forgot-password") ||
      currentPathname.startsWith("/reset-password") ||
      currentPathname.startsWith("/verify-email") ||
      currentPathname.startsWith("/auth/")
    )

    if (
      isSuccess &&
      data &&
      (currentHasLocal || currentHasOAuth || onProtected)
    ) {
      setAuth(data)
      setInitialized(true)
    } else if (isError) {
      // /auth/me failed AND the Axios interceptor's refresh attempt also failed.
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
