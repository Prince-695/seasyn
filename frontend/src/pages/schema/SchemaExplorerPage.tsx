import { useState, useEffect, useMemo } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Database,
  Table as TableIcon,
  Layers,
  ArrowRightLeft,
  RefreshCw,
  Server,
  FolderKanban,
  Plus,
  PanelLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  SchemaTree,
  TableStructureView,
  DatabaseDataViewer,
  SchemaDiffViewer,
} from "@/components/schema"
import { schemaApi } from "@/api/schema"
import { projectsApi } from "@/api/projects"
import { schemaKeys, projectKeys, connectionKeys } from "@/lib/queryKeys"
import { getDatabaseTerminology } from "@/lib/constants/databaseViewers"
import { useWorkspaceStore } from "@/store/workspaceStore"
import type { ColumnSchema, TableRowQueryParams } from "@/types/schema"
import { cn } from "@/lib/utils"

type StudioTab = "structure" | "data" | "diff"

export function SchemaExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { activeOrg, activeProjectId } = useWorkspaceStore()

  // Selected Connection & Table state from URL or fallback
  const initialConnId = searchParams.get("connId") || ""
  const initialProjectId =
    searchParams.get("projectId") || activeProjectId || ""
  const [selectedProjectId, setSelectedProjectId] =
    useState<string>(initialProjectId)
  const [selectedConnId, setSelectedConnId] = useState<string>(initialConnId)
  const [selectedTableName, setSelectedTableName] = useState<string | null>(
    null
  )
  const [activeTab, setActiveTab] = useState<StudioTab>("structure")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Query table rows params
  const [queryParams, setQueryParams] = useState<TableRowQueryParams>({
    page: 1,
    limit: 25,
  })

  // 1. Fetch Projects for active organization
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

  // 2. Fetch Connections for the selected project
  const { data: connections = [], isLoading: isConnectionsLoading } = useQuery({
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

  const effectiveConnId =
    selectedConnId && connections.some((c) => c.id === selectedConnId)
      ? selectedConnId
      : connections[0]?.id || ""

  // Sync to URL search params
  useEffect(() => {
    if (effectiveProjectId && effectiveConnId) {
      setSearchParams(
        { projectId: effectiveProjectId, connId: effectiveConnId },
        { replace: true }
      )
    }
  }, [effectiveProjectId, effectiveConnId, setSearchParams])

  const activeConnection = useMemo(() => {
    return connections.find((c) => c.id === effectiveConnId) || null
  }, [connections, effectiveConnId])

  const terminology = useMemo(() => {
    return getDatabaseTerminology(activeConnection?.db_type)
  }, [activeConnection?.db_type])

  // 3. Fetch Database Schema for selected connection
  const {
    data: databaseSchema,
    isLoading: isSchemaLoading,
    refetch: refetchSchema,
  } = useQuery({
    queryKey: schemaKeys.database(
      activeOrg?.id || "",
      effectiveProjectId,
      effectiveConnId
    ),
    queryFn: async () => {
      if (!activeOrg?.id || !effectiveProjectId || !effectiveConnId) return null
      const res = await schemaApi.getSchema(
        activeOrg.id,
        effectiveProjectId,
        effectiveConnId
      )
      return res.data || null
    },
    enabled: !!activeOrg?.id && !!effectiveProjectId && !!effectiveConnId,
  })

  const tables = useMemo(() => databaseSchema?.tables || [], [databaseSchema])

  const effectiveTableName =
    selectedTableName && tables.some((t) => t.name === selectedTableName)
      ? selectedTableName
      : tables[0]?.name || null

  const activeTable = useMemo(() => {
    return tables.find((t) => t.name === effectiveTableName) || null
  }, [tables, effectiveTableName])

  // 4. Fetch Table Rows for active table
  const {
    data: queryResult,
    isLoading: isRowsLoading,
    refetch: refetchRows,
  } = useQuery({
    queryKey: schemaKeys.rows(
      activeOrg?.id || "",
      effectiveProjectId,
      effectiveConnId,
      effectiveTableName || "",
      queryParams
    ),
    queryFn: async () => {
      if (
        !activeOrg?.id ||
        !effectiveProjectId ||
        !effectiveConnId ||
        !effectiveTableName
      )
        return null
      const res = await schemaApi.getTableRows(
        activeOrg.id,
        effectiveProjectId,
        effectiveConnId,
        effectiveTableName,
        queryParams
      )
      return res.data || null
    },
    enabled:
      activeTab === "data" &&
      !!activeOrg?.id &&
      !!effectiveProjectId &&
      !!effectiveConnId &&
      !!effectiveTableName,
  })

  // 5. Fetch Schema Diff (if tab is diff and another connection exists)
  const targetConnection = useMemo(() => {
    return connections.find((c) => c.id !== effectiveConnId) || null
  }, [connections, effectiveConnId])

  const { data: schemaDiff, isLoading: isDiffLoading } = useQuery({
    queryKey: schemaKeys.diff(
      activeOrg?.id || "",
      effectiveProjectId,
      effectiveConnId,
      targetConnection?.id || ""
    ),
    queryFn: async () => {
      if (
        !activeOrg?.id ||
        !effectiveProjectId ||
        !effectiveConnId ||
        !targetConnection?.id
      )
        return null
      const res = await schemaApi.generateDiff(
        activeOrg.id,
        effectiveProjectId,
        effectiveConnId,
        targetConnection.id
      )
      return res.data || null
    },
    enabled:
      activeTab === "diff" && !!effectiveConnId && !!targetConnection?.id,
  })

  // Mutations for Live Rows CRUD
  const updateCellMutation = useMutation({
    mutationFn: async ({
      row,
      col,
      newVal,
    }: {
      row: Record<string, unknown>
      col: ColumnSchema
      newVal: unknown
    }) => {
      if (
        !activeOrg?.id ||
        !effectiveProjectId ||
        !effectiveConnId ||
        !effectiveTableName
      )
        throw new Error("Missing parameters")
      const pkField =
        activeTable?.primary_keys[0] ||
        (terminology.paradigm === "document" ? "_id" : "id")
      const pkRecord = { [pkField]: row[pkField] }
      await schemaApi.updateRow(
        activeOrg.id,
        effectiveProjectId,
        effectiveConnId,
        effectiveTableName,
        { [col.name]: newVal },
        pkRecord
      )
    },
    onSuccess: () => {
      refetchRows()
    },
  })

  const updateRowMutation = useMutation({
    mutationFn: async ({
      row,
      updatedRow,
    }: {
      row: Record<string, unknown>
      updatedRow: Record<string, unknown>
    }) => {
      if (
        !activeOrg?.id ||
        !effectiveProjectId ||
        !effectiveConnId ||
        !effectiveTableName
      )
        throw new Error("Missing parameters")
      const pkField =
        activeTable?.primary_keys[0] ||
        (terminology.paradigm === "document" ? "_id" : "id")
      const pkRecord = { [pkField]: row[pkField] }
      await schemaApi.updateRow(
        activeOrg.id,
        effectiveProjectId,
        effectiveConnId,
        effectiveTableName,
        updatedRow,
        pkRecord
      )
    },
    onSuccess: () => {
      refetchRows()
    },
  })

  const deleteRowMutation = useMutation({
    mutationFn: async (pkValues: Record<string, unknown>) => {
      if (
        !activeOrg?.id ||
        !effectiveProjectId ||
        !effectiveConnId ||
        !effectiveTableName
      )
        throw new Error("Missing parameters")
      await schemaApi.deleteRow(
        activeOrg.id,
        effectiveProjectId,
        effectiveConnId,
        effectiveTableName,
        pkValues
      )
    },
    onSuccess: () => {
      refetchRows()
      refetchSchema()
    },
  })

  const insertRowMutation = useMutation({
    mutationFn: async (rowData: Record<string, unknown>) => {
      if (
        !activeOrg?.id ||
        !effectiveProjectId ||
        !effectiveConnId ||
        !effectiveTableName
      )
        throw new Error("Missing parameters")
      await schemaApi.insertRow(
        activeOrg.id,
        effectiveProjectId,
        effectiveConnId,
        effectiveTableName,
        rowData
      )
    },
    onSuccess: () => {
      refetchRows()
      refetchSchema()
    },
  })

  const handleRefreshAll = () => {
    refetchSchema()
    if (activeTab === "data") refetchRows()
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* ── Studio Top Toolbar ── */}
      <header className="border-border/70 bg-card/80 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
              title={
                isSidebarCollapsed ? "Show Schema Tree" : "Collapse Schema Tree"
              }
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <div className="border-primary/40 bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg border shadow-xs">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-foreground text-sm font-bold">
                  Schema Studio
                </h1>
                <Badge className="border-success/20 bg-success/10 text-success text-[10px] font-semibold">
                  Live
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Interactive Schema Visualizer & Live Data Grid
              </p>
            </div>
          </div>

          <div className="bg-border/60 hidden h-6 w-[1px] sm:block" />

          {/* Project & Connection Selectors */}
          <div className="flex items-center gap-2">
            {projects.length > 0 && (
              <div className="flex items-center gap-1.5">
                <FolderKanban className="text-muted-foreground h-3.5 w-3.5" />
                <select
                  value={effectiveProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value)
                    setSelectedConnId("")
                    setSelectedTableName(null)
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

            {connections.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Server className="text-muted-foreground h-3.5 w-3.5" />
                <select
                  value={effectiveConnId}
                  onChange={(e) => {
                    setSelectedConnId(e.target.value)
                    setSelectedTableName(null)
                  }}
                  className="border-input bg-background text-foreground h-8 rounded-lg border px-2 font-mono text-xs font-medium shadow-xs"
                >
                  {connections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.db_type})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Studio View Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="border-border/70 bg-muted/30 flex items-center gap-1 rounded-xl border p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("structure")}
              className={cn(
                "relative flex h-auto cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                activeTab === "structure"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>
                {terminology.paradigm === "document"
                  ? `${terminology.entitySingular} Schema`
                  : "Structure"}
              </span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("data")}
              className={cn(
                "relative flex h-auto cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                activeTab === "data"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>{`Live ${terminology.recordPlural}`}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("diff")}
              className={cn(
                "relative flex h-auto cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                activeTab === "diff"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Schema Diff</span>
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isSchemaLoading || isRowsLoading}
            className="h-8 gap-1.5 text-xs"
            title="Refresh schema and rows"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                (isSchemaLoading || isRowsLoading) && "animate-spin"
              )}
            />
          </Button>
        </div>
      </header>

      {/* ── Main Studio Split Workspace ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Collapsible Schema Tree */}
        {activeTab !== "diff" && (
          <aside
            className={cn(
              "shrink-0 transition-all duration-200",
              isSidebarCollapsed ? "w-0 overflow-hidden" : "w-64 sm:w-72"
            )}
          >
            <SchemaTree
              tables={tables}
              selectedTable={effectiveTableName}
              onSelectTable={(name) => {
                setSelectedTableName(name)
                setQueryParams((prev) => ({ ...prev, page: 1 }))
              }}
              databaseName={activeConnection?.name || "database"}
              dbType={activeConnection?.db_type || "postgres"}
              isLoading={isSchemaLoading}
            />
          </aside>
        )}

        {/* Right Pane: Active Content Workspace */}
        <main className="flex-1 overflow-y-auto p-6">
          {connections.length === 0 && !isConnectionsLoading ? (
            /* Empty State: No connections in project */
            <div className="border-border/80 bg-muted/10 flex h-full flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
              <Server className="text-muted-foreground/60 mb-3 h-10 w-10" />
              <h3 className="text-foreground text-sm font-semibold">
                No Database Connections Configured
              </h3>
              <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                To inspect schemas and edit live rows, connect a PostgreSQL,
                MySQL, MongoDB, or SQLite database.
              </p>
              <Link to="/connections" className="mt-4">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs font-semibold shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Configure Connection</span>
                </Button>
              </Link>
            </div>
          ) : !activeConnection ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
              Select a database connection above to begin.
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* Tab 1: Table Structure */}
              {activeTab === "structure" && (
                <motion.div
                  key={`structure-${effectiveTableName}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {activeTable ? (
                    <TableStructureView
                      table={activeTable}
                      dbType={activeConnection?.db_type || "postgres"}
                      onSwitchToDataGrid={() => setActiveTab("data")}
                    />
                  ) : (
                    <div className="text-muted-foreground p-8 text-center text-xs">
                      Select a {terminology.entitySingular.toLowerCase()} from
                      the tree on the left.
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tab 2: Live Data Grid */}
              {activeTab === "data" && (
                <motion.div
                  key={`data-${effectiveTableName}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {activeTable ? (
                    <DatabaseDataViewer
                      table={activeTable}
                      queryResult={queryResult || null}
                      isLoading={isRowsLoading}
                      dbType={activeConnection?.db_type || "postgres"}
                      onRefresh={refetchRows}
                      onSortChange={(field, dir) => {
                        setQueryParams((prev) => ({
                          ...prev,
                          sort_by: field,
                          sort_dir: dir,
                        }))
                      }}
                      onPageChange={(page) => {
                        setQueryParams((prev) => ({ ...prev, page }))
                      }}
                      onPageSizeChange={(limit) => {
                        setQueryParams((prev) => ({ ...prev, limit, page: 1 }))
                      }}
                      onSearchChange={(search) => {
                        setQueryParams((prev) => ({ ...prev, search, page: 1 }))
                      }}
                      onUpdateCell={async (row, col, newVal) => {
                        await updateCellMutation.mutateAsync({
                          row,
                          col,
                          newVal,
                        })
                      }}
                      onUpdateRow={async (row, updatedRow) => {
                        await updateRowMutation.mutateAsync({
                          row,
                          updatedRow,
                        })
                      }}
                      onDeleteRow={async (pkValues) => {
                        await deleteRowMutation.mutateAsync(pkValues)
                      }}
                      onInsertRow={async (rowData) => {
                        await insertRowMutation.mutateAsync(rowData)
                      }}
                    />
                  ) : (
                    <div className="text-muted-foreground p-8 text-center text-xs">
                      Select a {terminology.entitySingular.toLowerCase()} from
                      the tree on the left to inspect{" "}
                      {terminology.recordPlural.toLowerCase()}.
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tab 3: Schema Diff */}
              {activeTab === "diff" && (
                <motion.div
                  key="diff-view"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {connections.length < 2 ? (
                    <div className="border-border/70 bg-card rounded-xl border p-8 text-center">
                      <ArrowRightLeft className="text-muted-foreground/60 mx-auto mb-2 h-8 w-8" />
                      <h4 className="text-foreground text-sm font-semibold">
                        Requires At Least 2 Database Connections
                      </h4>
                      <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
                        Schema Diff compares a Source Database against a Target
                        Database to flag missing tables and type divergences.
                        Add a target connection to use this feature.
                      </p>
                      <Link to="/connections" className="mt-4 inline-block">
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs font-semibold"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Target Database</span>
                        </Button>
                      </Link>
                    </div>
                  ) : isDiffLoading ? (
                    <div className="text-muted-foreground flex h-64 flex-col items-center justify-center gap-2 text-xs">
                      <RefreshCw className="text-primary h-6 w-6 animate-spin" />
                      <span>Comparing source and target schemas...</span>
                    </div>
                  ) : schemaDiff ? (
                    <SchemaDiffViewer
                      diff={schemaDiff}
                      sourceDbName={activeConnection.name}
                      targetDbName={targetConnection?.name || "Target DB"}
                    />
                  ) : (
                    <div className="text-muted-foreground p-8 text-center text-xs">
                      Unable to compute schema diff between selected
                      connections.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  )
}
