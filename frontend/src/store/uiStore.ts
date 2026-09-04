import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface UIState {
  sidebarOpen: boolean
  mobileSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
  toggleMobileSidebar: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      mobileSidebarOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      toggleMobileSidebar: () =>
        set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
    }),
    {
      name: "seasyn_ui",
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
    }
  )
)

export default useUIStore
