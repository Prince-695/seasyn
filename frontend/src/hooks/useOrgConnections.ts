import { useQuery } from "@tanstack/react-query"
import { projectsApi } from "@/api/projects"
import { projectKeys, connectionKeys } from "@/lib/queryKeys"
import type { Project, Environment, PublicDatabaseConnection } from "@/types"

export interface OrgConnection extends PublicDatabaseConnection {
  projectName?: string
  projectSlug?: string
  projectEnvironment?: Environment
}

export interface UseOrgConnectionsResult {
  projects: Project[]
  connections: OrgConnection[]
  isLoading: boolean
  isProjectsLoading: boolean
  isConnectionsLoading: boolean
  refetch: () => void
}

/**
 * Custom hook to fetch all projects in the active organization,
 * and aggregate their database connections with project metadata.
 */
export function useOrgConnections(
  orgId: string | undefined | null
): UseOrgConnectionsResult {
  // 1. Fetch all projects in active organization
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: projectKeys.list(orgId || ""),
    queryFn: async () => {
      if (!orgId) return []
      const res = await projectsApi.list(orgId)
      return res.data || []
    },
    enabled: !!orgId,
  })

  // 2. Fetch and aggregate connections across all projects
  const projectIds = projects.map((p) => p.id)
  const {
    data: connections = [],
    isLoading: isConnectionsLoading,
    refetch,
  } = useQuery({
    queryKey: connectionKeys.byOrg(orgId || "", projectIds),
    queryFn: async () => {
      if (!orgId || projects.length === 0) return []
      const results = await Promise.all(
        projects.map(async (project) => {
          try {
            const res = await projectsApi.listConnections(orgId, project.id)
            return (res.data || []).map(
              (conn): OrgConnection => ({
                ...conn,
                projectName: project.name,
                projectSlug: project.slug,
                projectEnvironment: project.environment,
              })
            )
          } catch {
            return []
          }
        })
      )
      return results.flat()
    },
    enabled: !!orgId && projects.length > 0,
  })

  return {
    projects,
    connections,
    isLoading:
      isProjectsLoading || (projects.length > 0 && isConnectionsLoading),
    isProjectsLoading,
    isConnectionsLoading,
    refetch,
  }
}

export default useOrgConnections
