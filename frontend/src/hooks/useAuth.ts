import { useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import { authApi } from "@/api/auth"

/**
 * useAuth hook
 *
 * Verifies the user session with the backend on initial application mount.
 * Prevents UI flicker and unauthorized access by validating the session cookie.
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isInitialized,
    setAuth,
    clearAuth,
    setInitialized,
  } = useAuthStore()

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await authApi.getProfile()
        const userData = response.data?.user || response.data || response
        if (userData) {
          setAuth(userData)
        } else {
          clearAuth()
        }
      } catch (err) {
        console.error("Auth session verification failed:", err)
        clearAuth()
      } finally {
        setInitialized(true)
      }
    }

    // Verify session if localStorage indicates user is logged in
    if (localStorage.getItem("is_logged_in") === "true") {
      verifySession()
    } else {
      clearAuth()
      setInitialized(true)
    }
  }, [setAuth, clearAuth, setInitialized])

  return { user, isAuthenticated, isInitialized }
}
export default useAuth
