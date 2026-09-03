import { useWorkspaceStore } from "@/store/workspaceStore"
import type { OrgRole } from "@/types/org"

export function useHasPermission(allowedRoles: OrgRole[]): boolean {
  const currentRole = useWorkspaceStore((state) => state.currentRole)
  return !!currentRole && allowedRoles.includes(currentRole)
}

export default useHasPermission
