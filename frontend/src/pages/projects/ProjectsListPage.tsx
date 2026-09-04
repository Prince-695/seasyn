import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FolderKanban, Search, Plus, Loader2, Layers } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { CreateProjectModal } from "@/components/projects/CreateProjectModal"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { projectsApi } from "@/api/projects"
import { projectKeys } from "@/lib/queryKeys"
import { useWorkspaceStore } from "@/store/workspaceStore"
import type { Project, Environment } from "@/types/project"

type EnvFilter = "all" | Environment

export function ProjectsListPage() {
  const queryClient = useQueryClient()
  const { activeOrg } = useWorkspaceStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [envFilter, setEnvFilter] = useState<EnvFilter>("all")
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  // Fetch projects under active organization
  const {
    data: projects = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: projectKeys.lists(activeOrg?.id || "none"),
    queryFn: async () => {
      if (!activeOrg?.id) return []
      const res = await projectsApi.list(activeOrg.id)
      return res.data || []
    },
    enabled: !!activeOrg?.id,
  })

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!activeOrg?.id) throw new Error("No active organization")
      await projectsApi.delete(activeOrg.id, projectId)
    },
    onSuccess: () => {
      if (activeOrg?.id) {
        queryClient.invalidateQueries({
          queryKey: projectKeys.byOrg(activeOrg.id),
        })
      }
      setProjectToDelete(null)
    },
  })

  // Filter projects by search query and environment
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.slug && p.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.description &&
          p.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesEnv = envFilter === "all" || p.environment === envFilter

      return matchesSearch && matchesEnv
    })
  }, [projects, searchQuery, envFilter])

  // Count statistics
  const stats = useMemo(() => {
    const dev = projects.filter((p) => p.environment === "development").length
    const staging = projects.filter((p) => p.environment === "staging").length
    const prod = projects.filter((p) => p.environment === "production").length
    return { total: projects.length, dev, staging, prod }
  }, [projects])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
            <Layers className="h-3.5 w-3.5" />
            <span>Workspace Management</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your database projects and environments within{" "}
            <span className="font-semibold text-foreground">
              {activeOrg?.name || "your organization"}
            </span>
            .
          </p>
        </div>

        <PermissionGuard allowedRoles={["owner", "admin"]}>
          <CreateProjectModal />
        </PermissionGuard>
      </div>

      {/* Control Bar: Search & Environment Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Environment Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/80 bg-muted/30 p-1 text-xs">
          <button
            onClick={() => setEnvFilter("all")}
            className={`rounded-md px-3 py-1.5 font-medium transition-all ${
              envFilter === "all"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setEnvFilter("development")}
            className={`rounded-md px-3 py-1.5 font-medium transition-all ${
              envFilter === "development"
                ? "bg-card text-info shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Dev ({stats.dev})
          </button>
          <button
            onClick={() => setEnvFilter("staging")}
            className={`rounded-md px-3 py-1.5 font-medium transition-all ${
              envFilter === "staging"
                ? "bg-card text-warning shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Staging ({stats.staging})
          </button>
          <button
            onClick={() => setEnvFilter("production")}
            className={`rounded-md px-3 py-1.5 font-medium transition-all ${
              envFilter === "production"
                ? "bg-card text-success shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Prod ({stats.prod})
          </button>
        </div>
      </div>

      {/* Projects Grid / Loading / Empty States */}
      {isLoading ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 p-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading database projects...
          </p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-semibold text-destructive">
            Failed to load projects
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/80 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FolderKanban className="h-7 w-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {searchQuery || envFilter !== "all"
                ? "No matching projects found"
                : "No projects created yet"}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {searchQuery || envFilter !== "all"
                ? "Try adjusting your search criteria or switching environment filters."
                : "Create a project workspace to connect source and destination databases, run diagnostic latency pings, and orchestrate migrations."}
            </p>
          </div>

          <PermissionGuard allowedRoles={["owner", "admin"]}>
            <CreateProjectModal
              trigger={
                <Button className="gap-2 font-semibold">
                  <Plus className="h-4 w-4" />
                  <span>Create First Project</span>
                </Button>
              }
            />
          </PermissionGuard>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={(p) => setProjectToDelete(p)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                "{projectToDelete?.name}"
              </span>
              ? This action is permanent and will remove all associated database
              connections and pipeline configurations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (projectToDelete) {
                  deleteMutation.mutate(projectToDelete.id)
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
