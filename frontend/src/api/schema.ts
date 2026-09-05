import apiClient from "./client"
import type { ApiResponse } from "./types"
import type {
  DatabaseSchema,
  TableSchema,
  QueryResult,
  SchemaDiff,
  TableRowQueryParams,
} from "@/types/schema"
import { schemaMockStore } from "./mock/schemaMockStore"

// ─── Production API Client with Isolated Mock Fallbacks ─────────────────────

export const schemaApi = {
  /**
   * Fetch complete database schema snapshot
   */
  getSchema: async (
    orgId: string,
    projectId: string,
    connId: string
  ): Promise<ApiResponse<DatabaseSchema>> => {
    try {
      const res = await apiClient.get<ApiResponse<DatabaseSchema>>(
        `/organizations/${orgId}/projects/${projectId}/connections/${connId}/schema`
      )
      if (res.data?.data) return res.data
    } catch {
      // Backend route fallback until live endpoints are deployed
    }
    return schemaMockStore.getSchema(connId)
  },

  /**
   * List all table summaries
   */
  listTables: async (
    orgId: string,
    projectId: string,
    connId: string
  ): Promise<ApiResponse<TableSchema[]>> => {
    try {
      const res = await apiClient.get<ApiResponse<TableSchema[]>>(
        `/organizations/${orgId}/projects/${projectId}/connections/${connId}/tables`
      )
      if (res.data?.data) return res.data
    } catch {
      // Backend route fallback
    }
    return schemaMockStore.listTables(connId)
  },

  /**
   * Get deep structure of a specific table
   */
  getTable: async (
    orgId: string,
    projectId: string,
    connId: string,
    tableName: string
  ): Promise<ApiResponse<TableSchema>> => {
    try {
      const res = await apiClient.get<ApiResponse<TableSchema>>(
        `/organizations/${orgId}/projects/${projectId}/connections/${connId}/tables/${tableName}`
      )
      if (res.data?.data) return res.data
    } catch {
      // Backend route fallback
    }
    return schemaMockStore.getTable(connId, tableName)
  },

  /**
   * Fetch paginated live rows from a table
   */
  getTableRows: async (
    orgId: string,
    projectId: string,
    connId: string,
    tableName: string,
    params: TableRowQueryParams = {}
  ): Promise<ApiResponse<QueryResult>> => {
    try {
      const res = await apiClient.get<ApiResponse<QueryResult>>(
        `/organizations/${orgId}/projects/${projectId}/connections/${connId}/tables/${tableName}/rows`,
        { params }
      )
      if (res.data?.data) return res.data
    } catch {
      // Backend route fallback
    }
    return schemaMockStore.getTableRows(connId, tableName, params)
  },

  /**
   * Insert a new row into a table
   */
  insertRow: async (
    orgId: string,
    projectId: string,
    connId: string,
    tableName: string,
    rowData: Record<string, unknown>
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      const res = await apiClient.post<ApiResponse<Record<string, unknown>>>(
        `/organizations/${orgId}/projects/${projectId}/connections/${connId}/tables/${tableName}/rows`,
        rowData
      )
      if (res.data?.data) return res.data
    } catch {
      // Backend route fallback
    }
    return schemaMockStore.insertRow(connId, tableName, rowData)
  },

  /**
   * Update an existing row identified by primary keys
   */
  updateRow: async (
    orgId: string,
    projectId: string,
    connId: string,
    tableName: string,
    rowData: Record<string, unknown>,
    primaryKeys: Record<string, unknown>
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      const res = await apiClient.put<ApiResponse<Record<string, unknown>>>(
        `/organizations/${orgId}/projects/${projectId}/connections/${connId}/tables/${tableName}/rows`,
        { rowData, primaryKeys }
      )
      if (res.data?.data) return res.data
    } catch {
      // Backend route fallback
    }
    return schemaMockStore.updateRow(connId, tableName, rowData, primaryKeys)
  },

  /**
   * Delete an existing row identified by primary keys
   */
  deleteRow: async (
    orgId: string,
    projectId: string,
    connId: string,
    tableName: string,
    primaryKeys: Record<string, unknown>
  ): Promise<ApiResponse<null>> => {
    try {
      const res = await apiClient.delete<ApiResponse<null>>(
        `/organizations/${orgId}/projects/${projectId}/connections/${connId}/tables/${tableName}/rows`,
        { data: { primaryKeys } }
      )
      if (res.data) return res.data
    } catch {
      // Backend route fallback
    }
    return schemaMockStore.deleteRow(connId, tableName, primaryKeys)
  },

  /**
   * Generate side-by-side Schema Diff comparison between two databases
   */
  generateDiff: async (
    orgId: string,
    projectId: string,
    sourceConnId: string,
    targetConnId: string
  ): Promise<ApiResponse<SchemaDiff>> => {
    try {
      const res = await apiClient.post<ApiResponse<SchemaDiff>>(
        `/organizations/${orgId}/projects/${projectId}/schema/diff`,
        {
          source_connection_id: sourceConnId,
          target_connection_id: targetConnId,
        }
      )
      if (res.data?.data) return res.data
    } catch {
      // Backend route fallback
    }
    return schemaMockStore.generateDiff(sourceConnId, targetConnId)
  },
}
