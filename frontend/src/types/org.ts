export type OrgRole = "owner" | "admin" | "member" | "viewer"

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface OrgWithRole extends Organization {
  role: OrgRole
}

export interface OrgMemberDetail {
  user_id: string
  email: string
  first_name: string
  last_name: string
  username?: string
  role: OrgRole
  joined_at: string
}

export interface CreateOrgPayload {
  name: string
  slug: string
  description?: string
}

export interface UpdateOrgPayload {
  name: string
  description?: string
}

export interface InviteMemberPayload {
  email: string
  role: OrgRole
}

export interface UpdateMemberRolePayload {
  role: OrgRole
}
