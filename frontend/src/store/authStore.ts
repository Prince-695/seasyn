import { create } from "zustand"
import type { AuthState, User } from "@/types"
import { queryClient } from "@/lib/queryClient"

const getInitialUser = (): User | null => {
  try {
    const userStr = localStorage.getItem("user")
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

const initialUser = getInitialUser()

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  isInitialized: false,

  setAuth: (user) => {
    localStorage.setItem("user", JSON.stringify(user))
    localStorage.setItem("is_logged_in", "true")
    set({ user, isAuthenticated: true, isInitialized: true })
  },

  clearAuth: () => {
    localStorage.removeItem("user")
    localStorage.removeItem("is_logged_in")
    queryClient.clear()
    set({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
    })
  },

  setInitialized: (status) => set({ isInitialized: status }),
}))
