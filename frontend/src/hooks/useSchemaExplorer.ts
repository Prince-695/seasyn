import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import { schemaApi } from "@/api/schema"
import { projectsApi } from "@/api/projects"
import { schemaKeys, projectKeys, connectionKeys } from "@/lib/queryKeys"
import { getDatabaseTerminology } from "@/lib/constants/databaseViewers"
import { useWorkspaceStore } from "@/store/workspaceStore"
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
  const { activeOrg, activeProjectId } = useWorkspaceStore()

  // Selected Connection & Table state from URL or fallback
  const projectParam =
    searchParams.get("project") ||
    searchParams.get("projectId") ||
    activeProjectId ||
    ""
  const connParam = searchParams.get("conn") || searchParams.get("connId") || ""

  const [selectedProjectIdentifier, setSelectedProjectIdentifier] =
    useState<string>(projectParam)
  const [selectedConnIdentifier, setSelectedConnIdentifier] =
    useState<string>(connParam)
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

  const matchedProject = useMemo(() => {
    if (!projects.length) return null
    return (
      projects.find(
        (p) =>
          p.slug === selectedProjectIdentifier ||
          p.id === selectedProjectIdentifier
      ) ||
      projects.find((p) => p.slug === projectParam || p.id === projectParam) ||
      projects[0]
    )
  }, [projects, selectedProjectIdentifier, projectParam])

  const effectiveProjectId = matchedProject?.id || ""

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

  // CRUD Mutations
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

  const updateCell = useCallback(
    async (
      row: Record<string, unknown>,
      col: ColumnSchema,
      newVal: unknown
    ) => {
      await updateCellMutation.mutateAsync({ row, col, newVal })
    },
    [updateCellMutation]
  )

  const updateRow = useCallback(
    async (
      row: Record<string, unknown>,
      updatedRow: Record<string, unknown>
    ) => {
      await updateRowMutation.mutateAsync({ row, updatedRow })
    },
    [updateRowMutation]
  )

  const deleteRow = useCallback(
    async (pkValues: Record<string, unknown>) => {
      await deleteRowMutation.mutateAsync(pkValues)
    },
    [deleteRowMutation]
  )

  const insertRow = useCallback(
    async (rowData: Record<string, unknown>) => {
      await insertRowMutation.mutateAsync(rowData)
    },
    [insertRowMutation]
  )

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
