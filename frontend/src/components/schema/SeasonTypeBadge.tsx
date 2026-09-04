import { cn } from "@/lib/utils"
import type { SeasonType } from "@/types/schema"
import {
  Hash,
  Type,
  ToggleLeft,
  Clock,
  Code2,
  Binary,
  Layers,
  HelpCircle,
  Key,
} from "lucide-react"

interface SeasonTypeBadgeProps {
  type: SeasonType | string
  className?: string
  showIcon?: boolean
}

const TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: typeof Hash }
> = {
  int: {
    label: "INT",
    badgeClass: "bg-info/10 text-info border-info/20",
    icon: Hash,
  },
  float: {
    label: "FLOAT",
    badgeClass: "bg-info/10 text-info border-info/20",
    icon: Hash,
  },
  decimal: {
    label: "DECIMAL",
    badgeClass: "bg-info/10 text-info border-info/20",
    icon: Hash,
  },
  string: {
    label: "STRING",
    badgeClass: "bg-success/10 text-success border-success/20",
    icon: Type,
  },
  uuid: {
    label: "UUID",
    badgeClass: "bg-success/10 text-success border-success/20",
    icon: Key,
  },
  bool: {
    label: "BOOL",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    icon: ToggleLeft,
  },
  timestamp: {
    label: "TIME",
    badgeClass: "bg-warning/10 text-warning border-warning/20",
    icon: Clock,
  },
  json: {
    label: "JSON",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    icon: Code2,
  },
  array: {
    label: "ARRAY",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    icon: Layers,
  },
  binary: {
    label: "BINARY",
    badgeClass: "bg-muted text-muted-foreground border-border",
    icon: Binary,
  },
  enum: {
    label: "ENUM",
    badgeClass: "bg-accent text-accent-foreground border-border",
    icon: Type,
  },
  unknown: {
    label: "ANY",
    badgeClass: "bg-muted text-muted-foreground border-border",
    icon: HelpCircle,
  },
}

export function SeasonTypeBadge({
  type,
  className,
  showIcon = true,
}: SeasonTypeBadgeProps) {
  const normalized = (type || "unknown").toLowerCase()
  const config = TYPE_CONFIG[normalized] || TYPE_CONFIG.unknown
  const IconComponent = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase transition-colors",
        config.badgeClass,
        className
      )}
      title={`Universal SEASYN Type: ${config.label}`}
    >
      {showIcon && <IconComponent className="h-2.5 w-2.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  )
}
