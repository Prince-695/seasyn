import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Organization, OrgRole } from "@/types/org"

export interface ActiveProjectMeta {
  id: string
  slug?: string
  name?: string
  environment?: string
}

export interface WorkspaceState {
  activeOrg: Organization | null
  currentRole: OrgRole | null
  activeProjectId: string | null
  activeProjectSlug: string | null
  activeProjectName: string | null
  activeProjectEnv: string | null
  setActiveOrg: (org: Organization, role: OrgRole) => void
  setActiveProjectId: (projectId: string | null) => void
  setActiveProject: (project: ActiveProjectMeta | null) => void
  clearActiveProject: () => void
  clearWorkspace: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeOrg: null,
      currentRole: null,
      activeProjectId: null,
      activeProjectSlug: null,
      activeProjectName: null,
      activeProjectEnv: null,
      setActiveOrg: (org, role) => set({ activeOrg: org, currentRole: role }),
      setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
      setActiveProject: (project) =>
        set({
          activeProjectId: project?.id ?? null,
          activeProjectSlug: project?.slug ?? null,
          activeProjectName: project?.name ?? null,
          activeProjectEnv: project?.environment ?? null,
        }),
      clearActiveProject: () =>
        set({
          activeProjectId: null,
          activeProjectSlug: null,
          activeProjectName: null,
          activeProjectEnv: null,
        }),
      clearWorkspace: () =>
        set({
          activeOrg: null,
          currentRole: null,
          activeProjectId: null,
          activeProjectSlug: null,
          activeProjectName: null,
          activeProjectEnv: null,
        }),
    }),
    {
      name: "seasyn_workspace",
    }
  )
)
