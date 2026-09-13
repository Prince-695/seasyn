import { useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  FolderKanban,
  Loader2,
  AlertTriangle,
  Server,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProjectSettingsTab } from "@/components/projects/ProjectSettingsTab"
import { projectKeys, connectionKeys } from "@/lib/queryKeys"
import { projectsApi } from "@/api/projects"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { cn } from "@/lib/utils"
import { ENVIRONMENT_CONFIG } from "@/lib/constants/environments"

export function ProjectSettingsPage() {
  const navigate = useNavigate()
  const params = useParams<{ projectSlug?: string; projectId?: string }>()
  const projectSlugOrId = params.projectSlug || params.projectId || ""
  const { activeOrg, setActiveProjectId, setActiveProject } =
    useWorkspaceStore()

  // 1. Fetch organization projects to resolve slug to ID
  const { data: orgProjects = [], isLoading: isOrgProjectsLoading } = useQuery({
    queryKey: projectKeys.list(activeOrg?.id || "none"),
    queryFn: async () => {
      if (!activeOrg?.id) return []
      const res = await projectsApi.list(activeOrg.id)
      return res.data || []
    },
    enabled: !!activeOrg?.id,
  })

  const matchedProjectFromList = useMemo(() => {
    if (!projectSlugOrId) return null
    return (
      orgProjects.find(
        (p) => p.slug === projectSlugOrId || p.id === projectSlugOrId
      ) || null
    )
  }, [orgProjects, projectSlugOrId])

  const actualProjectId = matchedProjectFromList?.id || projectSlugOrId || ""

  useEffect(() => {
    if (actualProjectId) {
      setActiveProjectId(actualProjectId)
    }
  }, [actualProjectId, setActiveProjectId])

  // Fetch Project Details
  const {
    data: projectDetail,
    isLoading: isProjectDetailLoading,
    isError: isProjectDetailError,
  } = useQuery({
    queryKey: projectKeys.detail(activeOrg?.id || "", actualProjectId),
    queryFn: async () => {
      if (!activeOrg?.id || !actualProjectId) return null
      try {
        const res = await projectsApi.get(activeOrg.id, actualProjectId)
        return res.data
      } catch (err) {
        if (matchedProjectFromList) return matchedProjectFromList
        throw err
      }
    },
    enabled: !!activeOrg?.id && !!actualProjectId,
  })

  const project = projectDetail || matchedProjectFromList
  const isProjectLoading =
    (isOrgProjectsLoading && !project) || (isProjectDetailLoading && !project)
  const isProjectError = isProjectDetailError && !project

  // Sync full project metadata into workspace store
  useEffect(() => {
    if (project) {
      setActiveProject({
        id: project.id,
        slug: project.slug,
        name: project.name,
        environment: project.environment,
      })
    }
  }, [project, setActiveProject])

  // Fetch Database Connections count for settings tab
  const { data: connections = [] } = useQuery({
    queryKey: connectionKeys.list(activeOrg?.id || "", actualProjectId),
    queryFn: async () => {
      if (!activeOrg?.id || !actualProjectId) return []
      const res = await projectsApi.listConnections(
        activeOrg.id,
        actualProjectId
      )
      return res.data || []
    },
    enabled: !!activeOrg?.id && !!actualProjectId,
  })

  if (isProjectLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">
          Loading project settings...
        </p>
      </div>
    )
  }

  if (isProjectError || !project) {
    return (
      <div className="border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center rounded-2xl border p-12 text-center">
        <AlertTriangle className="text-destructive h-10 w-10" />
        <h3 className="text-foreground mt-3 text-base font-semibold">
          Project Not Found
        </h3>
        <p className="text-muted-foreground mt-1 max-w-md text-xs">
          This project could not be found. It may have been renamed, deleted, or
          you may lack access permissions.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/projects")}
          className="mt-4 text-xs font-semibold"
        >
          Return to Projects
        </Button>
      </div>
    )
  }

  const envConfig = (project?.environment &&
    ENVIRONMENT_CONFIG[project.environment]) || {
    label: project?.environment || "Dev",
    className: "border-muted bg-muted text-muted-foreground",
  }

  return (
    <div className="space-y-8">
      {/* Plain Page Header (Matching Image 1) */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                {project.name} Settings
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "px-2 py-0.5 font-mono text-xs",
                  envConfig.className
                )}
              >
                {envConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {project.description ||
                "Manage project preferences, environment configuration, and settings."}
            </p>
          </div>
        </div>

        {/* Right Action: Quick return to studio */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/projects/${project.slug || project.id}`)}
          className="gap-2 self-start text-xs font-semibold shadow-2xs sm:self-auto"
        >
          <Server className="text-primary h-3.5 w-3.5" />
          <span>Databases & Studio</span>
          <ArrowRight className="text-muted-foreground h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Dedicated Project Settings Content */}
      <ProjectSettingsTab
        project={project}
        connectionsCount={connections.length}
      />
    </div>
  )
}

export default ProjectSettingsPage
