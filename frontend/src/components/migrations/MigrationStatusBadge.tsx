import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { MigrationStatus } from "@/types/migration"
import { cn } from "@/lib/utils"

interface MigrationStatusBadgeProps {
  status: MigrationStatus
  className?: string
  showIcon?: boolean
}

export function MigrationStatusBadge({
  status,
  className,
  showIcon = true,
}: MigrationStatusBadgeProps) {
  switch (status) {
    case "running":
      return (
        <Badge
          variant="secondary"
          className={cn(
            "border-info/30 bg-info/10 text-info gap-1.5 font-mono text-xs font-semibold tracking-wider uppercase",
            className
          )}
        >
          {showIcon && <Loader2 className="text-info h-3 w-3 animate-spin" />}
          <span>Running</span>
        </Badge>
      )
    case "completed":
      return (
        <Badge
          variant="secondary"
          className={cn(
            "border-success/30 bg-success/10 text-success gap-1.5 font-mono text-xs font-semibold tracking-wider uppercase",
            className
          )}
        >
          {showIcon && <CheckCircle2 className="text-success h-3 w-3" />}
          <span>Completed</span>
        </Badge>
      )
    case "failed":
      return (
        <Badge
          variant="destructive"
          className={cn(
            "border-destructive/30 bg-destructive/10 text-destructive gap-1.5 font-mono text-xs font-semibold tracking-wider uppercase",
            className
          )}
        >
          {showIcon && <XCircle className="text-destructive h-3 w-3" />}
          <span>Failed</span>
        </Badge>
      )
    case "cancelled":
      return (
        <Badge
          variant="secondary"
          className={cn(
            "border-warning/30 bg-warning/10 text-warning gap-1.5 font-mono text-xs font-semibold tracking-wider uppercase",
            className
          )}
        >
          {showIcon && <AlertTriangle className="text-warning h-3 w-3" />}
          <span>Cancelled</span>
        </Badge>
      )
    case "pending":
    default:
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-muted-foreground border-border bg-muted/40 gap-1.5 font-mono text-xs font-semibold tracking-wider uppercase",
            className
          )}
        >
          {showIcon && <Clock className="text-muted-foreground h-3 w-3" />}
          <span>Pending</span>
        </Badge>
      )
  }
}
