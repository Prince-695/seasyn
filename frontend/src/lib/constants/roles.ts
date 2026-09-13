import { Shield, Users, Eye, Crown, type LucideIcon } from "lucide-react"
import type { OrgRole } from "@/types"

export type EditableOrgRole = "admin" | "member" | "viewer"

export interface RoleConfig {
  role: OrgRole
  label: string
  description: string
  className: string
  icon: LucideIcon
  isEditable: boolean
}

export const ROLE_CONFIG: Record<OrgRole, RoleConfig> = {
  owner: {
    role: "owner",
    label: "Owner",
    description: "Full control over organization billing, members, and deletion.",
    className: "bg-primary/10 text-primary border-primary/25",
    icon: Crown,
    isEditable: false,
  },
  admin: {
    role: "admin",
    label: "Admin",
    description: "Can invite members, manage connections, and configure settings.",
    className: "bg-info/10 text-info border-info/25",
    icon: Shield,
    isEditable: true,
  },
  member: {
    role: "member",
    label: "Member",
    description: "Can view schemas, execute table edits, and run migrations.",
    className: "bg-success/10 text-success border-success/25",
    icon: Users,
    isEditable: true,
  },
  viewer: {
    role: "viewer",
    label: "Viewer",
    description: "Read-only access. Can view schemas and query data without editing.",
    className: "bg-muted/50 text-muted-foreground border-border",
    icon: Eye,
    isEditable: true,
  },
}

export const EDITABLE_ROLES: RoleConfig[] = [
  ROLE_CONFIG.admin,
  ROLE_CONFIG.member,
  ROLE_CONFIG.viewer,
]
