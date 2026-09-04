import { Link, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MigrationWizard } from "@/components/migrations/MigrationWizard"
import { projectsApi } from "@/api/projects"
import { connectionKeys } from "@/lib/queryKeys"
import { useWorkspaceStore } from "@/store/workspaceStore"

export function NewMigrationPage() {
  const [searchParams] = useSearchParams()
  const { activeOrg, activeProjectId } = useWorkspaceStore()

  const orgId = activeOrg?.id || ""
  const projectId = activeProjectId || ""

  const initialSourceConn = searchParams.get("sourceConn") || ""
  const initialSourceTable = searchParams.get("sourceTable") || ""

  // Fetch registered project connections
  const { data: connections = [], isLoading } = useQuery({
    queryKey: connectionKeys.list(orgId, projectId),
    queryFn: async () => {
      if (!orgId || !projectId) return []
      const res = await projectsApi.listConnections(orgId, projectId)
      return res.data || []
    },
    enabled: !!orgId && !!projectId,
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Header & Navigation Back */}
      <div className="flex items-center gap-3">
        <Link to="/migration">
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-xl font-bold tracking-tight">
            Launch New Migration Pipeline
          </h1>
          <p className="text-muted-foreground text-xs">
            Configure an origin table, destination target, and streaming batch
            parameters.
          </p>
        </div>
      </div>

      {/* Check minimum connections requirement */}
      {isLoading ? (
        <Card className="border-border/70 bg-card/60 text-muted-foreground p-12 text-center text-xs">
          Loading project database connections...
        </Card>
      ) : connections.length < 2 ? (
        <Card className="border-border/70 bg-card/60 p-8 text-center backdrop-blur-xs">
          <div className="border-warning/20 bg-warning/10 text-warning mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-foreground mt-4 text-base font-semibold">
            At Least 2 Database Connections Required
          </h3>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-xs leading-relaxed">
            Cross-database migration requires an origin Source database and a
            destination Target database. You currently have{" "}
            <span className="text-foreground font-semibold">
              {connections.length}
            </span>{" "}
            connection registered.
          </p>
          <div className="mt-5">
            <Link to="/connections">
              <Button size="sm" className="gap-1.5 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5" />
                <span>Register Destination Connection</span>
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <MigrationWizard
          orgId={orgId}
          projectId={projectId}
          connections={connections}
          initialSourceConnId={initialSourceConn}
          initialSourceTable={initialSourceTable}
        />
      )}
    </div>
  )
}
