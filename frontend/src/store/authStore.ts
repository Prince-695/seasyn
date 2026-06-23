import { create } from "zustand"
import { deleteTokenCookie } from "@/lib/utils"
import type { User, AuthState } from "@/types"

const getInitialUser = (): User | null => {
  try {
    const stored = localStorage.getItem("user")
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isAuthenticated: localStorage.getItem("is_logged_in") === "true",
  isInitialized: false, // Will be set to true by useAuth hook after verifying with backend

  setAuth: (user) => {
    localStorage.setItem("user", JSON.stringify(user))
    localStorage.setItem("is_logged_in", "true")
    set({ user, isAuthenticated: true, isInitialized: true })
  },

  clearAuth: () => {
    localStorage.removeItem("user")
    localStorage.removeItem("is_logged_in")
    // Delete authentication cookie using the centralized utility
    deleteTokenCookie()
    set({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
    })
  },

  setInitialized: (status) => set({ isInitialized: status }),
}))
