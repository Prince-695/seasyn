import { create } from "zustand"
import { getCookie, deleteCookie } from "@/lib/utils"
import type { AuthState, User } from "@/types"


console.log(
  "[AuthStore] Initializing store. Access token cookie present:",
  !!getCookie("access_token"),
  "User localStorage:",
  localStorage.getItem("user")
)

const getInitialUser = (): User | null => {
  try {
    const userStr = localStorage.getItem("user")
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isAuthenticated: !!getInitialUser(),
  isInitialized: false, // Will be set to true by useAuth hook after verifying with backend

  setAuth: (user) => {
    console.log("[AuthStore] setAuth called with user:", user)
    localStorage.setItem("user", JSON.stringify(user))
    set({ user, isAuthenticated: true, isInitialized: true })
  },

  clearAuth: () => {
    console.warn("[AuthStore] clearAuth triggered! Stack trace:")
    console.trace()
    // Removed manual cookie deletion since backend handles cookie lifecycle.
    // A proper logout should call a backend endpoint to invalidate the HttpOnly cookies.
    deleteCookie("access_token") 
    deleteCookie("refresh_token") 
    deleteCookie("user")
    set({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
    })
  },

  setInitialized: (status) => {
    console.log("[AuthStore] setInitialized called with status:", status)
    set({ isInitialized: status })
  },
}))
