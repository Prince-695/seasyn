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
    badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Hash,
  },
  float: {
    label: "FLOAT",
    badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Hash,
  },
  decimal: {
    label: "DECIMAL",
    badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Hash,
  },
  string: {
    label: "STRING",
    badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: Type,
  },
  uuid: {
    label: "UUID",
    badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: Key,
  },
  bool: {
    label: "BOOL",
    badgeClass: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    icon: ToggleLeft,
  },
  timestamp: {
    label: "TIME",
    badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: Clock,
  },
  json: {
    label: "JSON",
    badgeClass: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    icon: Code2,
  },
  array: {
    label: "ARRAY",
    badgeClass: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    icon: Layers,
  },
  binary: {
    label: "BINARY",
    badgeClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    icon: Binary,
  },
  enum: {
    label: "ENUM",
    badgeClass: "bg-pink-500/10 text-pink-500 border-pink-500/20",
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
