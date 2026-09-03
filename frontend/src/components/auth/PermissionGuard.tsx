import React from "react"
import { useHasPermission } from "@/hooks/useHasPermission"
import type { OrgRole } from "@/types/org"

export interface PermissionGuardProps {
  allowedRoles: OrgRole[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  allowedRoles,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const hasPermission = useHasPermission(allowedRoles)

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default PermissionGuard
