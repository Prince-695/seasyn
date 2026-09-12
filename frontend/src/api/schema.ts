import apiClient from "./client"
import type { ApiResponse } from "./types"
import type {
  DatabaseSchema,
  TableSchema,
  QueryResult,
  SchemaDiff,
  TableRowQueryParams,
} from "@/types/schema"

export const schemaApi = {
  /**
   * Fetch complete database schema snapshot
   */
  getSchema: async (
    orgId: string,
    projectId: string,
    connId: string
  ): Promise<ApiResponse<DatabaseSchema>> => {
    const res = await apiClient.get<ApiResponse<DatabaseSchema>>(
      `/organizations/${orgId}/projects/${projectId}/connections/${connId}/schema`
    )
    return res.data
  },

  /**
   * List all table summaries
   */
  listTables: async (
    orgId: string,
    projectId: string,
    connId: string
  ): Promise<ApiResponse<string[]>> => {
    const res = await apiClient.get<ApiResponse<string[]>>(
      `/organizations/${orgId}/projects/${projectId}/connections/${connId}/tables`
    )
    return res.data
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
    const res = await apiClient.get<ApiResponse<TableSchema>>(
      `/organizations/${orgId}/projects/${projectId}/connections/${connId}/tables/${tableName}`
    )
    return res.data
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
    const queryParams: Record<string, unknown> = {}
    if (params.page !== undefined) queryParams.page = params.page
    if (params.limit !== undefined) queryParams.limit = params.limit
    if (params.sort_by) queryParams.order_by = params.sort_by
    if (params.sort_dir) queryParams.order_dir = params.sort_dir
    if (params.search) queryParams.search = params.search

    const res = await apiClient.get<ApiResponse<QueryResult>>(
      `/organizations/${orgId}/projects/${projectId}/connections/${connId}/tables/${tableName}/rows`,
      { params: queryParams }
    )
    return res.data
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
    const res = await apiClient.post<ApiResponse<Record<string, unknown>>>(
      `/organizations/${orgId}/projects/${projectId}/connections/${connId}/tables/${tableName}/rows`,
      { data: rowData }
    )
    return res.data
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
    const res = await apiClient.put<ApiResponse<Record<string, unknown>>>(
      `/organizations/${orgId}/projects/${projectId}/connections/${connId}/tables/${tableName}/rows`,
      { primary_key: primaryKeys, data: rowData }
    )
    return res.data
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
    const res = await apiClient.delete<ApiResponse<null>>(
      `/organizations/${orgId}/projects/${projectId}/connections/${connId}/tables/${tableName}/rows`,
      { data: { primary_key: primaryKeys } }
    )
    return res.data
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
    const res = await apiClient.post<ApiResponse<SchemaDiff>>(
      `/organizations/${orgId}/projects/${projectId}/schema/diff`,
      {
        source_connection_id: sourceConnId,
        target_connection_id: targetConnId,
      }
    )
    return res.data
  },
}
