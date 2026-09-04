import apiClient from "./client"
import type { ApiResponse } from "./types"
import type {
  Project,
  ProjectDetail,
  PublicDatabaseConnection,
  CreateProjectPayload,
  UpdateProjectPayload,
  CreateConnectionPayload,
  UpdateConnectionPayload,
  TestConnectionPayload,
  ConnectionTestResult,
} from "@/types/project"

export const projectsApi = {
  // ─── Projects CRUD ──────────────────────────────────────────────────────────
  list: async (orgId: string): Promise<ApiResponse<Project[]>> => {
    const response = await apiClient.get<ApiResponse<Project[]>>(
      `/organizations/${orgId}/projects`
    )
    return response.data
  },

  get: async (
    orgId: string,
    projectId: string
  ): Promise<ApiResponse<ProjectDetail>> => {
    const response = await apiClient.get<ApiResponse<ProjectDetail>>(
      `/organizations/${orgId}/projects/${projectId}`
    )
    return response.data
  },

  create: async (
    orgId: string,
    data: CreateProjectPayload
  ): Promise<ApiResponse<Project>> => {
    const response = await apiClient.post<ApiResponse<Project>>(
      `/organizations/${orgId}/projects`,
      data
    )
    return response.data
  },

  update: async (
    orgId: string,
    projectId: string,
    data: UpdateProjectPayload
  ): Promise<ApiResponse<Project>> => {
    const response = await apiClient.put<ApiResponse<Project>>(
      `/organizations/${orgId}/projects/${projectId}`,
      data
    )
    return response.data
  },

  delete: async (
    orgId: string,
    projectId: string
  ): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/organizations/${orgId}/projects/${projectId}`
    )
    return response.data
  },

  // ─── Database Connections CRUD ──────────────────────────────────────────────
  listConnections: async (
    orgId: string,
    projectId: string
  ): Promise<ApiResponse<PublicDatabaseConnection[]>> => {
    const response = await apiClient.get<
      ApiResponse<PublicDatabaseConnection[]>
    >(`/organizations/${orgId}/projects/${projectId}/connections`)
    return response.data
  },

  getConnection: async (
    orgId: string,
    projectId: string,
    connId: string
  ): Promise<ApiResponse<PublicDatabaseConnection>> => {
    const response = await apiClient.get<ApiResponse<PublicDatabaseConnection>>(
      `/organizations/${orgId}/projects/${projectId}/connections/${connId}`
    )
    return response.data
  },

  createConnection: async (
    orgId: string,
    projectId: string,
    data: CreateConnectionPayload
  ): Promise<ApiResponse<PublicDatabaseConnection>> => {
    const response = await apiClient.post<
      ApiResponse<PublicDatabaseConnection>
    >(`/organizations/${orgId}/projects/${projectId}/connections`, data)
    return response.data
  },

  updateConnection: async (
    orgId: string,
    projectId: string,
    connId: string,
    data: UpdateConnectionPayload
  ): Promise<ApiResponse<PublicDatabaseConnection>> => {
    const response = await apiClient.put<ApiResponse<PublicDatabaseConnection>>(
      `/organizations/${orgId}/projects/${projectId}/connections/${connId}`,
      data
    )
    return response.data
  },

  deleteConnection: async (
    orgId: string,
    projectId: string,
    connId: string
  ): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/organizations/${orgId}/projects/${projectId}/connections/${connId}`
    )
    return response.data
  },

  // ─── Diagnostics & Latency Ping ────────────────────────────────────────────
  testDirectConnection: async (
    orgId: string,
    projectId: string,
    data: TestConnectionPayload
  ): Promise<ApiResponse<ConnectionTestResult>> => {
    const response = await apiClient.post<ApiResponse<ConnectionTestResult>>(
      `/organizations/${orgId}/projects/${projectId}/connections/test`,
      data
    )
    return response.data
  },

  testSavedConnection: async (
    orgId: string,
    projectId: string,
    connId: string
  ): Promise<ApiResponse<ConnectionTestResult>> => {
    const response = await apiClient.post<ApiResponse<ConnectionTestResult>>(
      `/organizations/${orgId}/projects/${projectId}/connections/${connId}/test`
    )
    return response.data
  },
}
