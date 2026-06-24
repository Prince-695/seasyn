import { useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import { authApi } from "@/api/auth"
// import { getCookie } from "@/lib/utils"

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

  console.log("[useAuth] Hook rendered. Current auth state:", {
    user,
    isAuthenticated,
    isInitialized,
  })

  useEffect(() => {
    console.log("[useAuth] Raw document.cookie:", document.cookie)
    const hasUser = !!localStorage.getItem("user")
    console.log("[useAuth] LocalStorage user present:", hasUser)

    const verifySession = async () => {
      console.log("[useAuth] Starting verifySession() API call...")
      try {
        const response = await authApi.getProfile()
        console.log("[useAuth] verifySession() response received:", response)
        const userData = response.data?.user || response.data || response
        console.log("[useAuth] Parsed user data:", userData)
        if (userData) {
          console.log("[useAuth] User data is valid. Updating store auth.")
          setAuth(userData)
        } else {
          console.warn(
            "[useAuth] No user data found in response, but keeping session active."
          )
        }
      } catch (err) {
        console.error(
          "[useAuth] Auth session verification API call failed. Not logging out as user details are on hold.",
          err
        )
      } finally {
        setInitialized(true)
      }
    }

    // Verify session if user data exists in localStorage
    if (hasUser) {
      console.log("[useAuth] User exists. Calling verifySession().")
      verifySession()
    } else {
      console.log(
        "[useAuth] No user found on load. Triggering clearAuth() & initializing as true."
      )
      clearAuth()
      setInitialized(true)
    }
  }, [setAuth, clearAuth, setInitialized])

  return { user, isAuthenticated, isInitialized }
}
export default useAuth
