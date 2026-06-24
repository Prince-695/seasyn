import { create } from "zustand"
import type { AuthState, User } from "@/types"

console.log(
  "[AuthStore] Initializing store. User localStorage:",
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
    // Clear the JS-accessible localStorage entry so the store doesn't
    // re-hydrate a stale user on the next page load.
    // NOTE: HttpOnly cookies (access_token, refresh_token) can only be
    // cleared by the backend via Set-Cookie — call /auth/logout for that.
    localStorage.removeItem("user")
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
