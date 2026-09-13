import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { schemaApi } from "@/api/schema"
import { projectsApi } from "@/api/projects"
import { schemaKeys, connectionKeys } from "@/lib/queryKeys"
import { getDatabaseTerminology } from "@/lib/constants/databaseViewers"
import { useActiveProject } from "@/hooks/useActiveProject"
import { useTableMutations } from "@/hooks/useTableMutations"
import type {
  ColumnSchema,
  DatabaseSchema,
  QueryResult,
  SchemaDiff,
  TableSchema,
  TableRowQueryParams,
} from "@/types/schema"
import type { Project, PublicDatabaseConnection } from "@/types"

export type StudioTab = "structure" | "data" | "diff"

export interface UseSchemaExplorerResult {
  // Navigation & Workspace State
  projects: Project[]
  matchedProject: Project | null
  effectiveProjectId: string
  connections: PublicDatabaseConnection[]
  activeConnection: PublicDatabaseConnection | null
  effectiveConnId: string
  targetConnection: PublicDatabaseConnection | null
  isConnectionsLoading: boolean

  // Schema & Tables
  databaseSchema: DatabaseSchema | null
  tables: TableSchema[]
  effectiveTableName: string | null
  activeTable: TableSchema | null
  isSchemaLoading: boolean
  terminology: ReturnType<typeof getDatabaseTerminology>

  // Table Rows Data
  queryResult: QueryResult | null
  isRowsLoading: boolean
  queryParams: TableRowQueryParams
  setQueryParams: React.Dispatch<React.SetStateAction<TableRowQueryParams>>

  // Schema Diff
  schemaDiff: SchemaDiff | null
  isDiffLoading: boolean

  // UI State
  activeTab: StudioTab
  setActiveTab: (tab: StudioTab) => void
  isSidebarCollapsed: boolean
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>

  // Actions & Mutations
  selectTable: (tableName: string | null) => void
  selectProject: (projectId: string) => void
  selectConnection: (connId: string) => void
  refreshAll: () => void
  updateCell: (
    row: Record<string, unknown>,
    col: ColumnSchema,
    newVal: unknown
  ) => Promise<void>
  updateRow: (
    row: Record<string, unknown>,
    updatedRow: Record<string, unknown>
  ) => Promise<void>
  deleteRow: (pkValues: Record<string, unknown>) => Promise<void>
  insertRow: (rowData: Record<string, unknown>) => Promise<void>
}

/**
 * Custom hook to manage the state, queries, and mutations for the Schema Explorer Studio.
 */
export function useSchemaExplorer(): UseSchemaExplorerResult {
  const [searchParams, setSearchParams] = useSearchParams()

  // Selected Connection & Table state from URL or fallback
  const projectParam =
    searchParams.get("project") || searchParams.get("projectId") || ""
  const connParam = searchParams.get("conn") || searchParams.get("connId") || ""

  const [selectedProjectIdentifier, setSelectedProjectIdentifier] =
    useState<string>(projectParam)
  const [selectedConnIdentifier, setSelectedConnIdentifier] =
    useState<string>(connParam)
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<StudioTab>("structure")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Query table rows params
  const [queryParams, setQueryParams] = useState<TableRowQueryParams>({
    page: 1,
    limit: 25,
  })

  // Resolves active project from URL param or first-project fallback
  const {
    projectId: effectiveProjectId,
    orgId,
    resolvedProject: matchedProject,
    projects,
  } = useActiveProject(selectedProjectIdentifier || projectParam)

  // 2. Fetch Connections for the selected project
  const { data: connections = [], isLoading: isConnectionsLoading } = useQuery({
    queryKey: connectionKeys.list(orgId || "", effectiveProjectId),
    queryFn: async () => {
      if (!orgId || !effectiveProjectId) return []
      const res = await projectsApi.listConnections(orgId, effectiveProjectId)
      return res.data || []
    },
    enabled: !!orgId && !!effectiveProjectId,
  })

  const activeConnection = useMemo(() => {
    if (!connections.length) return null
    return (
      connections.find(
        (c) =>
          c.name === selectedConnIdentifier || c.id === selectedConnIdentifier
      ) ||
      connections.find((c) => c.name === connParam || c.id === connParam) ||
      connections[0]
    )
  }, [connections, selectedConnIdentifier, connParam])

  const effectiveConnId = activeConnection?.id || ""

  // Sync clean, human-friendly slug & connection name to URL
  useEffect(() => {
    if (matchedProject && activeConnection) {
      const projectSlug = matchedProject.slug || matchedProject.id
      const connName = activeConnection.name || activeConnection.id

      const currentProject = searchParams.get("project")
      const currentConn = searchParams.get("conn")

      if (
        currentProject !== projectSlug ||
        currentConn !== connName ||
        searchParams.has("projectId") ||
        searchParams.has("connId")
      ) {
        setSearchParams(
          { project: projectSlug, conn: connName },
          { replace: true }
        )
      }
    }
  }, [matchedProject, activeConnection, searchParams, setSearchParams])

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
      orgId || "",
      effectiveProjectId,
      effectiveConnId
    ),
    queryFn: async () => {
      if (!orgId || !effectiveProjectId || !effectiveConnId) return null
      const res = await schemaApi.getSchema(
        orgId,
        effectiveProjectId,
        effectiveConnId
      )
      return res.data || null
    },
    enabled: !!orgId && !!effectiveProjectId && !!effectiveConnId,
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
      orgId || "",
      effectiveProjectId,
      effectiveConnId,
      effectiveTableName || "",
      queryParams
    ),
    queryFn: async () => {
      if (
        !orgId ||
        !effectiveProjectId ||
        !effectiveConnId ||
        !effectiveTableName
      )
        return null
      const res = await schemaApi.getTableRows(
        orgId,
        effectiveProjectId,
        effectiveConnId,
        effectiveTableName,
        queryParams
      )
      return res.data || null
    },
    enabled:
      activeTab === "data" &&
      !!orgId &&
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
      orgId || "",
      effectiveProjectId,
      effectiveConnId,
      targetConnection?.id || ""
    ),
    queryFn: async () => {
      if (
        !orgId ||
        !effectiveProjectId ||
        !effectiveConnId ||
        !targetConnection?.id
      )
        return null
      const res = await schemaApi.generateDiff(
        orgId,
        effectiveProjectId,
        effectiveConnId,
        targetConnection.id
      )
      return res.data || null
    },
    enabled:
      activeTab === "diff" && !!effectiveConnId && !!targetConnection?.id,
  })

  // Hook-managed CRUD table mutations
  const { updateCell, updateRow, deleteRow, insertRow } = useTableMutations({
    orgId,
    effectiveProjectId,
    effectiveConnId,
    effectiveTableName,
    activeTable,
    terminology,
    refetchRows,
    refetchSchema,
  })

  const refreshAll = useCallback(() => {
    refetchSchema()
    if (activeTab === "data") refetchRows()
  }, [activeTab, refetchSchema, refetchRows])

  const selectTable = useCallback((name: string | null) => {
    setSelectedTableName(name)
    setQueryParams((prev) => ({ ...prev, page: 1 }))
  }, [])

  const selectProject = useCallback((projectId: string) => {
    setSelectedProjectIdentifier(projectId)
    setSelectedConnIdentifier("")
    setSelectedTableName(null)
  }, [])

  const selectConnection = useCallback((connId: string) => {
    setSelectedConnIdentifier(connId)
    setSelectedTableName(null)
  }, [])

  return {
    projects,
    matchedProject,
    effectiveProjectId,
    connections,
    activeConnection,
    effectiveConnId,
    targetConnection,
    isConnectionsLoading,
    databaseSchema: databaseSchema || null,
    tables,
    effectiveTableName,
    activeTable,
    isSchemaLoading,
    terminology,
    queryResult: queryResult || null,
    isRowsLoading,
    queryParams,
    setQueryParams,
    schemaDiff: schemaDiff || null,
    isDiffLoading,
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    selectTable,
    selectProject,
    selectConnection,
    refreshAll,
    updateCell,
    updateRow,
    deleteRow,
    insertRow,
  }
}

export default useSchemaExplorer
