import { create } from "zustand"

interface User {
  id: string
  email: string
  name?: string
  // Add other fields according to backend API
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isInitialized: boolean
  setAuth: (user: User) => void
  clearAuth: () => void
  setInitialized: (status: boolean) => void
}

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
  isInitialized: true, // Loaded instantly on startup from localStorage

  setAuth: (user) => {
    localStorage.setItem("user", JSON.stringify(user))
    localStorage.setItem("is_logged_in", "true")
    set({ user, isAuthenticated: true, isInitialized: true })
  },

  clearAuth: () => {
    localStorage.removeItem("user")
    localStorage.removeItem("is_logged_in")
    set({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
    })
  },

  setInitialized: (status) => set({ isInitialized: status }),
}))
