import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { OrgRole } from "@/types/org"

interface RoleBadgeProps {
  role: OrgRole
  className?: string
}

import { ROLE_CONFIG } from "@/lib/constants/roles"

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.viewer

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2 py-0.5 text-xs font-semibold capitalize",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  )
}

export default RoleBadge
