import { create } from "zustand"

interface User {
  id: string
  email: string
  name?: string
  // Add other fields according to your backend API
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setInitialized: (status: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token") || null, // Check local storage for existing token initially
  isAuthenticated: !!localStorage.getItem("token"),
  isInitialized: false, // Set to true after initial /me check finishes

  setAuth: (user, token) => {
    localStorage.setItem("token", token)
    set({ user, token, isAuthenticated: true, isInitialized: true })
  },

  clearAuth: () => {
    localStorage.removeItem("token")
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: true,
    })
  },

  setInitialized: (status) => set({ isInitialized: status }),
}))
