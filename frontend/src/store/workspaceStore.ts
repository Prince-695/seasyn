import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Organization, OrgRole } from "@/types/org"

export interface WorkspaceState {
  activeOrg: Organization | null
  currentRole: OrgRole | null
  activeProjectId: string | null
  setActiveOrg: (org: Organization, role: OrgRole) => void
  setActiveProjectId: (projectId: string | null) => void
  clearWorkspace: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeOrg: null,
      currentRole: null,
      activeProjectId: null,
      setActiveOrg: (org, role) => set({ activeOrg: org, currentRole: role }),
      setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
      clearWorkspace: () =>
        set({ activeOrg: null, currentRole: null, activeProjectId: null }),
    }),
    {
      name: "seasyn_workspace",
    }
  )
)
