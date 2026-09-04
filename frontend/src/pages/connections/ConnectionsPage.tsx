import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import {
  Database,
  Plus,
  Search,
  Server,
  FolderKanban,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConnectionCard } from "@/components/connections/ConnectionCard"
import { ConnectionWizardModal } from "@/components/connections/ConnectionWizardModal"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { projectKeys, connectionKeys } from "@/lib/queryKeys"
import { projectsApi } from "@/api/projects"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { cn } from "@/lib/utils"
import type { DBType, PublicDatabaseConnection } from "@/types"

type EngineFilter = "all" | DBType
type RoleFilter = "all" | "source" | "target"

export function ConnectionsPage() {
  const queryClient = useQueryClient()
  const { activeOrg } = useWorkspaceStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [selectedEngine, setSelectedEngine] = useState<EngineFilter>("all")
  const [selectedRole, setSelectedRole] = useState<RoleFilter>("all")

  // Fetch all projects in active organization
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: projectKeys.list(activeOrg?.id || ""),
    queryFn: async () => {
      if (!activeOrg?.id) return []
      const res = await projectsApi.list(activeOrg.id)
      return res.data || []
    },
    enabled: !!activeOrg?.id,
  })

  // Fetch connections for all projects
  const { data: allProjectConnections = [], isLoading: isConnectionsLoading } =
    useQuery({
      queryKey: ["allConnections", activeOrg?.id, projects.map((p) => p.id)],
      queryFn: async () => {
        if (!activeOrg?.id || projects.length === 0) return []
        const results = await Promise.all(
          projects.map(async (project) => {
            try {
              const res = await projectsApi.listConnections(
                activeOrg.id,
                project.id
              )
              return (res.data || []).map((conn) => ({
                ...conn,
                projectName: project.name,
                projectSlug: project.slug,
                projectEnvironment: project.environment,
              }))
            } catch {
              return []
            }
          })
        )
        return results.flat()
      },
      enabled: !!activeOrg?.id && projects.length > 0,
    })

  // Delete Connection Mutation
  const deleteConnectionMutation = useMutation({
    mutationFn: async ({
      projectId,
      connId,
    }: {
      projectId: string
      connId: string
    }) => {
      if (!activeOrg?.id) throw new Error("Missing organization")
      await projectsApi.deleteConnection(activeOrg.id, projectId, connId)
    },
    onSuccess: (_, variables) => {
      if (activeOrg?.id) {
        queryClient.invalidateQueries({
          queryKey: connectionKeys.list(activeOrg.id, variables.projectId),
        })
        queryClient.invalidateQueries({
          queryKey: ["allConnections", activeOrg.id],
        })
      }
    },
  })

  const handleDeleteConnection = (conn: PublicDatabaseConnection) => {
    deleteConnectionMutation.mutate({
      projectId: conn.project_id,
      connId: conn.id,
    })
  }

  // Filtered connections list
  const filteredConnections = useMemo(() => {
    return allProjectConnections.filter((conn) => {
      // Project filter
      if (
        selectedProjectId !== "all" &&
        conn.project_id !== selectedProjectId
      ) {
        return false
      }

      // Engine filter
      if (selectedEngine !== "all" && conn.db_type !== selectedEngine) {
        return false
      }

      // Role filter
      if (selectedRole === "source" && !conn.is_source) return false
      if (selectedRole === "target" && conn.is_source) return false

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = conn.name.toLowerCase().includes(query)
        const matchesHost = conn.host?.toLowerCase().includes(query) || false
        const matchesDb = conn.database?.toLowerCase().includes(query) || false
        const matchesProject =
          conn.projectName?.toLowerCase().includes(query) || false
        return matchesName || matchesHost || matchesDb || matchesProject
      }

      return true
    })
  }, [
    allProjectConnections,
    selectedProjectId,
    selectedEngine,
    selectedRole,
    searchQuery,
  ])

  const isLoading = isProjectsLoading || isConnectionsLoading

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Database Connections
              </h1>
              <p className="text-xs text-muted-foreground">
                Catalog and live diagnostics of all source and destination
                database adapters.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Button (if project exists) */}
        {projects.length > 0 && (
          <PermissionGuard allowedRoles={["owner", "admin"]}>
            <ConnectionWizardModal
              projectId={
                selectedProjectId !== "all"
                  ? selectedProjectId
                  : projects[0]?.id || ""
              }
              trigger={
                <Button className="gap-2 font-semibold shadow-xs">
                  <Plus className="h-4 w-4" />
                  <span>Add Connection</span>
                </Button>
              }
            />
          </PermissionGuard>
        )}
      </div>

      {/* Control Strip: Search & Filter Tabs */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search connections by name, host, database, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Dropdown Selector */}
          {projects.length > 1 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              aria-label="Filter by project"
              className="h-9 rounded-lg border border-border/80 bg-background px-3 text-xs font-medium text-foreground transition-colors outline-none hover:bg-muted/40 focus:border-primary"
            >
              <option value="all">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Engine Filter */}
          <div className="flex rounded-lg border border-border/80 bg-muted/30 p-0.5 text-xs">
            {(
              [
                { label: "All Engines", value: "all" },
                { label: "Postgres", value: "postgres" },
                { label: "MySQL", value: "mysql" },
                { label: "MongoDB", value: "mongodb" },
                { label: "SQLite", value: "sqlite" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedEngine(opt.value)}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  selectedEngine === opt.value
                    ? "bg-background font-semibold text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Role Filter */}
          <div className="flex rounded-lg border border-border/80 bg-muted/30 p-0.5 text-xs">
            {(
              [
                { label: "All Roles", value: "all" },
                { label: "Sources", value: "source" },
                { label: "Targets", value: "target" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedRole(opt.value)}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  selectedRole === opt.value
                    ? "bg-background font-semibold text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Connection Cards */}
      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-medium text-muted-foreground">
            Loading database connections...
          </p>
        </div>
      ) : filteredConnections.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredConnections.map((conn) => (
            <div key={conn.id} className="relative">
              <ConnectionCard
                connection={conn}
                onDelete={handleDeleteConnection}
              />
              {/* Parent Project Tag */}
              {conn.projectName && (
                <div className="mt-1 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FolderKanban className="h-3 w-3" />
                    <span>Project:</span>
                    <Link
                      to={`/projects/${conn.project_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {conn.projectName}
                    </Link>
                  </span>
                  <span className="font-mono text-[10px] uppercase">
                    {conn.projectEnvironment}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-muted/40">
            <Server className="h-7 w-7 text-muted-foreground" />
          </div>

          <h3 className="mt-4 text-base font-semibold text-foreground">
            {searchQuery || selectedEngine !== "all" || selectedRole !== "all"
              ? "No matching connections found"
              : "No database connections configured"}
          </h3>

          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            {searchQuery || selectedEngine !== "all" || selectedRole !== "all"
              ? "Try adjusting your search terms or filter criteria."
              : "Register PostgreSQL, MySQL, MongoDB, or SQLite database adapters within a project to start migrations."}
          </p>

          {projects.length === 0 ? (
            <div className="mt-5">
              <Link to="/projects">
                <Button size="sm" className="gap-2">
                  <FolderKanban className="h-4 w-4" />
                  <span>Create a Project First</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-5">
              <PermissionGuard allowedRoles={["owner", "admin"]}>
                <ConnectionWizardModal
                  projectId={projects[0]?.id || ""}
                  trigger={
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Configure First Database</span>
                    </Button>
                  }
                />
              </PermissionGuard>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
