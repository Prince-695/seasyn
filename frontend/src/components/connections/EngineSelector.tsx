import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DBType } from "@/types"

interface EngineOption {
  type: DBType
  name: string
  paradigm: string
  description: string
  colorClass: string
  badgeClass: string
}

// Port defaults live in lib/constants/engines.ts — do not duplicate here
const engines: EngineOption[] = [
  {
    type: "postgres",
    name: "PostgreSQL",
    paradigm: "Relational • SQL",
    description:
      "Advanced open-source relational database with robust transactional ACID guarantees.",
    colorClass: "border-info/30 hover:border-info/60",
    badgeClass: "border-info/30 bg-info/10 text-info",
  },
  {
    type: "mysql",
    name: "MySQL",
    paradigm: "Relational • SQL",
    description:
      "Ubiquitous, high-speed relational database optimized for web applications and scale.",
    colorClass: "border-primary/30 hover:border-primary/60",
    badgeClass: "border-primary/30 bg-primary/10 text-primary",
  },
  {
    type: "mongodb",
    name: "MongoDB",
    paradigm: "Document • NoSQL",
    description:
      "Flexible JSON-like document model supporting dynamic schemas and nested objects.",
    colorClass: "border-success/30 hover:border-success/60",
    badgeClass: "border-success/30 bg-success/10 text-success",
  },
  {
    type: "sqlite",
    name: "SQLite",
    paradigm: "Embedded • Serverless",
    description:
      "Self-contained, serverless zero-configuration file database engine.",
    colorClass: "border-warning/30 hover:border-warning/60",
    badgeClass: "border-warning/30 bg-warning/10 text-warning",
  },
]

// Engine vector icons designed for dark & light theme consistency
export function EngineIcon({
  type,
  className = "h-6 w-6",
}: {
  type: DBType
  className?: string
}) {
  switch (type) {
    case "postgres":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("text-info", className)}
        >
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </svg>
      )
    case "mysql":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("text-primary", className)}
        >
          <path d="M4 19h16" />
          <path d="M4 15c4-2 6-8 8-8s4 6 8 8" />
          <path d="M12 7v8" />
        </svg>
      )
    case "mongodb":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("text-success", className)}
        >
          <path d="M12 2C9 7 6 11 6 15c0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-3-8-6-13z" />
          <path d="M12 2v19" />
        </svg>
      )
    case "sqlite":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("text-warning", className)}
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
  }
}

interface EngineSelectorProps {
  value: DBType
  onChange: (engine: DBType) => void
  disabled?: boolean
}

export function EngineSelector({
  value,
  onChange,
  disabled = false,
}: EngineSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {engines.map((engine) => {
        const isSelected = value === engine.type
        return (
          <button
            key={engine.type}
            type="button"
            disabled={disabled}
            onClick={() => onChange(engine.type)}
            className={cn(
              "group relative flex cursor-pointer flex-col items-start rounded-xl border p-4 text-left transition-all duration-200",
              "hover:shadow-xs",
              isSelected
                ? "border-primary bg-primary/[0.03] shadow-xs ring-1 ring-primary"
                : "border-border/80 bg-card hover:bg-muted/30",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {/* Top Row: Icon, Title, Checkmark */}
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40 transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60"
                  )}
                >
                  <EngineIcon type={engine.type} className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {engine.name}
                  </h4>
                  <span
                    className={cn(
                      "inline-block rounded-md border px-1.5 py-0 text-[10px] font-medium tracking-tight",
                      engine.badgeClass
                    )}
                  >
                    {engine.paradigm}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Description */}
            <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {engine.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}
