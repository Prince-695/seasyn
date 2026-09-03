import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { OrgRole } from "@/types/org"

interface RoleBadgeProps {
  role: OrgRole
  className?: string
}

const roleStyles: Record<OrgRole, { label: string; className: string }> = {
  owner: {
    label: "Owner",
    className: "bg-primary/10 text-primary border-primary/25",
  },
  admin: {
    label: "Admin",
    className: "bg-info/10 text-info border-info/25",
  },
  member: {
    label: "Member",
    className: "bg-success/10 text-success border-success/25",
  },
  viewer: {
    label: "Viewer",
    className: "bg-muted/50 text-muted-foreground border-border",
  },
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleStyles[role] ?? roleStyles.viewer

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
