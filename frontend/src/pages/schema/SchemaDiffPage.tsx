import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  RefreshCw,
  Server,
  Plus,
  Layers,
  FolderKanban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SchemaDiffViewer } from "@/components/schema"
import { schemaApi } from "@/api/schema"
import { projectsApi } from "@/api/projects"
import { schemaKeys, projectKeys, connectionKeys } from "@/lib/queryKeys"
import { useWorkspaceStore } from "@/store/workspaceStore"

export function SchemaDiffPage() {
  const { activeOrg, activeProjectId } = useWorkspaceStore()
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProjectId || ""
  )
  const [sourceConnId, setSourceConnId] = useState<string>("")
  const [targetConnId, setTargetConnId] = useState<string>("")

  // Fetch Projects
  const { data: projects = [] } = useQuery({
    queryKey: projectKeys.list(activeOrg?.id || ""),
    queryFn: async () => {
      if (!activeOrg?.id) return []
      const res = await projectsApi.list(activeOrg.id)
      return res.data || []
    },
    enabled: !!activeOrg?.id,
  })

  const effectiveProjectId = selectedProjectId || projects[0]?.id || ""

  // Fetch Connections for selected project
  const { data: connections = [] } = useQuery({
    queryKey: connectionKeys.list(activeOrg?.id || "", effectiveProjectId),
    queryFn: async () => {
      if (!activeOrg?.id || !effectiveProjectId) return []
      const res = await projectsApi.listConnections(
        activeOrg.id,
        effectiveProjectId
      )
      return res.data || []
    },
    enabled: !!activeOrg?.id && !!effectiveProjectId,
  })

  // Auto-assign source and target defaults
  const sourceConnections = connections.filter((c) => c.is_source)
  const targetConnections = connections.filter((c) => !c.is_source)

  const effectiveSourceConnId =
    sourceConnId && connections.some((c) => c.id === sourceConnId)
      ? sourceConnId
      : sourceConnections[0]?.id || connections[0]?.id || ""

  const effectiveTargetConnId =
    targetConnId && connections.some((c) => c.id === targetConnId)
      ? targetConnId
      : targetConnections[0]?.id ||
        connections.find((c) => c.id !== effectiveSourceConnId)?.id ||
        connections[1]?.id ||
        ""

  const sourceConn = useMemo(
    () => connections.find((c) => c.id === effectiveSourceConnId) || null,
    [connections, effectiveSourceConnId]
  )
  const targetConn = useMemo(
    () => connections.find((c) => c.id === effectiveTargetConnId) || null,
    [connections, effectiveTargetConnId]
  )

  // Fetch Schema Diff
  const {
    data: diff,
    isLoading: isDiffLoading,
    refetch: refetchDiff,
  } = useQuery({
    queryKey: schemaKeys.diff(
      activeOrg?.id || "",
      effectiveProjectId,
      effectiveSourceConnId,
      effectiveTargetConnId
    ),
    queryFn: async () => {
      if (
        !activeOrg?.id ||
        !effectiveProjectId ||
        !effectiveSourceConnId ||
        !effectiveTargetConnId
      )
        return null
      const res = await schemaApi.generateDiff(
        activeOrg.id,
        effectiveProjectId,
        effectiveSourceConnId,
        effectiveTargetConnId
      )
      return res.data || null
    },
    enabled:
      !!activeOrg?.id &&
      !!effectiveProjectId &&
      !!effectiveSourceConnId &&
      !!effectiveTargetConnId,
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-xl font-bold">
              Schema Diff Comparator
            </h1>
            <span className="border-primary/20 bg-primary/10 text-primary rounded-md border px-2 py-0.5 text-[10px] font-semibold">
              Heterogeneous Engine
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Compare schemas across PostgreSQL, MySQL, MongoDB, and SQLite to
            detect discrepancies before migration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5">
              <FolderKanban className="text-muted-foreground h-3.5 w-3.5" />
              <select
                value={effectiveProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value)
                  setSourceConnId("")
                  setTargetConnId("")
                }}
                className="border-input bg-background text-foreground h-8 rounded-lg border px-2 text-xs font-medium shadow-xs"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link to="/editor">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5" />
              <span>Schema Studio</span>
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => refetchDiff()}
            disabled={
              isDiffLoading || !effectiveSourceConnId || !effectiveTargetConnId
            }
            className="gap-1.5 text-xs font-semibold shadow-xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isDiffLoading ? "animate-spin" : ""}`}
            />
            <span>Compare Schemas</span>
          </Button>
        </div>
      </div>

      {/* Dual Connection Picker Strip */}
      <div className="border-border/70 bg-card rounded-xl border p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center">
          {/* Source Picker */}
          <div className="space-y-1.5 md:col-span-5">
            <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
              Source Database (Baseline)
            </span>
            <div className="relative">
              <select
                value={effectiveSourceConnId}
                onChange={(e) => setSourceConnId(e.target.value)}
                className="border-input bg-background text-foreground h-9 w-full rounded-lg border px-3 font-mono text-xs font-medium shadow-xs"
              >
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.db_type}) {c.is_source ? "[Source]" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Direction Indicator */}
          <div className="flex items-center justify-center md:col-span-2">
            <div className="border-border/60 bg-muted/40 text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full border">
              <ArrowRight className="text-primary h-4 w-4" />
            </div>
          </div>

          {/* Target Picker */}
          <div className="space-y-1.5 md:col-span-5">
            <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
              Target Database (Comparison)
            </span>
            <div className="relative">
              <select
                value={effectiveTargetConnId}
                onChange={(e) => setTargetConnId(e.target.value)}
                className="border-input bg-background text-foreground h-9 w-full rounded-lg border px-3 font-mono text-xs font-medium shadow-xs"
              >
                {connections.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    disabled={c.id === effectiveSourceConnId}
                  >
                    {c.name} ({c.db_type}) {!c.is_source ? "[Target]" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison View Area */}
      {connections.length < 2 ? (
        <div className="border-border/70 bg-card rounded-2xl border p-12 text-center shadow-xs">
          <Server className="text-muted-foreground/50 mx-auto mb-3 h-10 w-10" />
          <h3 className="text-foreground text-sm font-semibold">
            Two Database Connections Required
          </h3>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
            To generate a cross-database schema diff, register at least one
            source and one target database connection.
          </p>
          <Link to="/connections" className="mt-4 inline-block">
            <Button
              size="sm"
              className="gap-1.5 text-xs font-semibold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Configure Connections</span>
            </Button>
          </Link>
        </div>
      ) : isDiffLoading ? (
        <div className="border-border/70 bg-card flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border">
          <RefreshCw className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-xs font-medium">
            Introspecting relations and computing schema differences...
          </p>
        </div>
      ) : diff ? (
        <SchemaDiffViewer
          diff={diff}
          sourceDbName={sourceConn?.name || "Source DB"}
          targetDbName={targetConn?.name || "Target DB"}
        />
      ) : (
        <div className="border-border/70 bg-card text-muted-foreground rounded-2xl border p-12 text-center text-xs">
          Select two distinct database connections above and click &apos;Compare
          Schemas&apos;.
        </div>
      )}
    </div>
  )
}
