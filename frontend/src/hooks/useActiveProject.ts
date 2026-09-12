import { useMemo, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { projectsApi } from "@/api/projects"
import { projectKeys } from "@/lib/queryKeys"
import { useWorkspaceStore } from "@/store/workspaceStore"
import type { Project } from "@/types"

interface UseActiveProjectResult {
  /** The resolved project object, or null while loading */
  resolvedProject: Project | null
  /** Resolved project ID — falls back to activeProjectId from store */
  projectId: string
  /** Slug if available, otherwise falls back to projectId */
  projectSlugOrId: string
  /** Active organization ID */
  orgId: string
  /** Full list of org projects (shared cache with rest of app) */
  projects: Project[]
  /** True while the project list is being fetched for the first time */
  isLoading: boolean
}

/**
 * Centralizes the project resolution pattern used across migration and schema pages:
 * 1. Fetches the org's project list (using shared React Query cache)
 * 2. Resolves the active project from a URL param, store, or first-project fallback
 * 3. Syncs the resolved project back into the workspace store
 *
 * @param projectParam - Raw identifier from URL (slug or ID). Can be undefined.
 */
export function useActiveProject(
  projectParam?: string
): UseActiveProjectResult {
  const { activeOrg, activeProjectId, setActiveProject } = useWorkspaceStore()
  const orgId = activeOrg?.id || ""

  const { data: projects = [], isLoading } = useQuery({
    queryKey: projectKeys.list(orgId),
    queryFn: async () => {
      if (!orgId) return []
      const res = await projectsApi.list(orgId)
      return res.data || []
    },
    enabled: !!orgId,
  })

  const resolvedProject = useMemo((): Project | null => {
    if (!projects.length) return null

    // 1. Match by explicit URL param (slug or ID)
    if (projectParam) {
      const match = projects.find(
        (p) => p.slug === projectParam || p.id === projectParam
      )
      if (match) return match
    }

    // 2. Fall back to workspace store's active project
    if (activeProjectId) {
      const match = projects.find((p) => p.id === activeProjectId)
      if (match) return match
    }

    // 3. Default to first available project
    return projects[0] ?? null
  }, [projects, projectParam, activeProjectId])

  // Sync resolved project metadata into workspace store
  useEffect(() => {
    if (resolvedProject) {
      setActiveProject({
        id: resolvedProject.id,
        slug: resolvedProject.slug,
        name: resolvedProject.name,
        environment: resolvedProject.environment,
      })
    }
  }, [resolvedProject, setActiveProject])

  const projectId = resolvedProject?.id || activeProjectId || ""
  const projectSlugOrId = resolvedProject?.slug || projectId

  return {
    resolvedProject,
    projectId,
    projectSlugOrId,
    orgId,
    projects,
    isLoading,
  }
}
