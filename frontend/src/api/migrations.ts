import apiClient, { API_BASE_URL } from "./client"
import type { ApiResponse } from "./types"
import type { MigrationJob, StartMigrationPayload } from "@/types/migration"

export const migrationsApi = {
  /**
   * Start a new cross-database migration pipeline
   */
  startMigration: async (
    orgId: string,
    projectId: string,
    payload: StartMigrationPayload
  ): Promise<ApiResponse<MigrationJob>> => {
    const response = await apiClient.post<ApiResponse<MigrationJob>>(
      `/organizations/${orgId}/projects/${projectId}/migrations`,
      payload
    )
    return response.data
  },

  /**
   * List all active and historical migration jobs for a project
   */
  listMigrations: async (
    orgId: string,
    projectId: string
  ): Promise<ApiResponse<MigrationJob[]>> => {
    const response = await apiClient.get<ApiResponse<MigrationJob[]>>(
      `/organizations/${orgId}/projects/${projectId}/migrations`
    )
    return response.data
  },

  /**
   * Fetch a single migration job by ID
   */
  getMigration: async (
    orgId: string,
    projectId: string,
    jobId: string
  ): Promise<ApiResponse<MigrationJob>> => {
    const response = await apiClient.get<ApiResponse<MigrationJob>>(
      `/organizations/${orgId}/projects/${projectId}/migrations/${jobId}`
    )
    return response.data
  },

  /**
   * Cancel or abort an active running migration job
   */
  cancelMigration: async (
    orgId: string,
    projectId: string,
    jobId: string
  ): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/organizations/${orgId}/projects/${projectId}/migrations/${jobId}`
    )
    return response.data
  },

  /**
   * Construct absolute URL for Server-Sent Events (SSE) progress streaming
   */
  getProgressStreamUrl: (
    orgId: string,
    projectId: string,
    jobId: string
  ): string => {
    return `${API_BASE_URL}/organizations/${orgId}/projects/${projectId}/migrations/${jobId}/progress`
  },
}
