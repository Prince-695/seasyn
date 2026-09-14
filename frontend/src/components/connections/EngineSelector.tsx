import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DBType } from "@/types"
import { ENGINES } from "@/lib/constants/engines"
import { EngineIcon } from "./EngineIcon"

export { EngineIcon }

interface EngineSelectorProps {
  value: DBType
  onChange: (engine: DBType) => void
  disabled?: boolean
  className?: string
}

export function EngineSelector({
  value,
  onChange,
  disabled = false,
  className,
}: EngineSelectorProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-2.5 sm:grid-cols-2", className)}>
      {ENGINES.map((engine) => {
        const isSelected = value === engine.type
        return (
          <Button
            key={engine.type}
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onChange(engine.type)}
            className={cn(
              "group focus-visible:ring-primary relative flex h-auto min-h-30 w-full cursor-pointer flex-col items-stretch justify-between rounded-xl p-3.5 text-left font-normal whitespace-normal transition-all duration-200 outline-none focus-visible:ring-2",
              isSelected
                ? "border-primary bg-primary/5 ring-primary text-foreground hover:bg-primary/10 hover:border-primary shadow-xs ring-1"
                : "border-border/80 bg-card text-foreground hover:border-border hover:bg-muted/30",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {/* Top Row: Icon + Title + Paradigm Badge */}
            <div className="flex w-full items-start gap-2.5">
              <div
                className={cn(
                  "bg-muted/40 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  isSelected
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground"
                )}
              >
                <EngineIcon type={engine.type} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-foreground text-sm leading-tight font-semibold">
                  {engine.name}
                </h4>
                <span
                  className={cn(
                    "mt-1 inline-block max-w-full truncate rounded-md border px-1.5 py-0 text-[10px] font-medium tracking-tight",
                    engine.badgeClass
                  )}
                >
                  {engine.paradigm}
                </span>
              </div>
            </div>

            {/* Description with multi-line wrapping */}
            <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-relaxed wrap-break-word whitespace-normal">
              {engine.description}
            </p>
          </Button>
        )
      })}
    </div>
  )
}
