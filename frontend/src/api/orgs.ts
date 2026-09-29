import apiClient from "./client"
import type { ApiResponse } from "./types"
import type {
  Organization,
  OrgWithRole,
  OrgMemberDetail,
  CreateOrgPayload,
  UpdateOrgPayload,
  InviteMemberPayload,
  UpdateMemberRolePayload,
} from "@/types/org"

export const orgsApi = {
  createOrg: async (
    payload: CreateOrgPayload
  ): Promise<ApiResponse<Organization>> => {
    const response = await apiClient.post("/organizations", payload)
    return response.data
  },

  getOrgs: async (): Promise<ApiResponse<OrgWithRole[]>> => {
    const response = await apiClient.get("/organizations")
    return response.data
  },

  getOrg: async (orgID: string): Promise<ApiResponse<Organization>> => {
    const response = await apiClient.get(`/organizations/${orgID}`)
    return response.data
  },

  updateOrg: async (
    orgID: string,
    payload: UpdateOrgPayload
  ): Promise<ApiResponse<Organization>> => {
    const response = await apiClient.put(`/organizations/${orgID}`, payload)
    return response.data
  },

  deleteOrg: async (orgID: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/organizations/${orgID}`)
    return response.data
  },

  getMembers: async (
    orgID: string
  ): Promise<ApiResponse<OrgMemberDetail[]>> => {
    const response = await apiClient.get(`/organizations/${orgID}/members`)
    return response.data
  },

  inviteMember: async (
    orgID: string,
    payload: InviteMemberPayload
  ): Promise<ApiResponse<null>> => {
    const response = await apiClient.post(
      `/organizations/${orgID}/members`,
      payload
    )
    return response.data
  },

  updateMemberRole: async (
    orgID: string,
    userID: string,
    payload: UpdateMemberRolePayload
  ): Promise<ApiResponse<null>> => {
    const response = await apiClient.put(
      `/organizations/${orgID}/members/${userID}/role`,
      payload
    )
    return response.data
  },

  removeMember: async (
    orgID: string,
    userID: string
  ): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(
      `/organizations/${orgID}/members/${userID}`
    )
    return response.data
  },
}
