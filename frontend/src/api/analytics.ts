import apiClient from "./client"
import type { ApiResponse } from "./types"
import type {
  OrgAnalyticsOverview,
  ProjectAnalytics,
  MigrationAnalytics,
} from "@/types/analytics"

export const analyticsApi = {
  /**
   * GET /v1/organizations/:orgID/analytics/overview
   * Returns quota usage, engine distribution, 30-day velocity timeline, and migration health.
   */
  getOrgOverview: async (
    orgId: string
  ): Promise<ApiResponse<OrgAnalyticsOverview>> => {
    const response = await apiClient.get<ApiResponse<OrgAnalyticsOverview>>(
      `/organizations/${orgId}/analytics/overview`
    )
    return response.data
  },

  /**
   * GET /v1/organizations/:orgID/projects/:projectID/analytics
   * Returns connection quotas, topology nodes/edges, top synced tables, and 14-day activity heatmap.
   */
  getProjectAnalytics: async (
    orgId: string,
    projectId: string
  ): Promise<ApiResponse<ProjectAnalytics>> => {
    const response = await apiClient.get<ApiResponse<ProjectAnalytics>>(
      `/organizations/${orgId}/projects/${projectId}/analytics`
    )
    return response.data
  },

  /**
   * GET /v1/organizations/:orgID/projects/:projectID/migrations/analytics
   * Returns migration summary intelligence, duration distribution, and error classifications.
   */
  getMigrationAnalytics: async (
    orgId: string,
    projectId: string
  ): Promise<ApiResponse<MigrationAnalytics>> => {
    const response = await apiClient.get<ApiResponse<MigrationAnalytics>>(
      `/organizations/${orgId}/projects/${projectId}/migrations/analytics`
    )
    return response.data
  },
}
