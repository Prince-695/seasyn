import { cn } from "@/lib/utils"
import type { DBType } from "@/types"
import { ENGINES } from "@/lib/constants/engines"
import { EngineIcon } from "./EngineIcon"
import { Button } from "@/components/ui/button"

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
            variant="ghost"
            disabled={disabled}
            onClick={() => onChange(engine.type)}
            className={cn(
              "group relative flex h-auto w-full cursor-pointer flex-col items-start rounded-xl border p-4 text-left transition-all duration-200",
              "hover:shadow-xs",
              isSelected
                ? "border-primary bg-primary/3 ring-primary shadow-xs ring-1"
                : "border-border/80 bg-card hover:bg-muted/30",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {/* Top Row: Icon, Title */}
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "bg-muted/40 flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60"
                  )}
                >
                  <EngineIcon type={engine.type} className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-foreground text-sm font-semibold">
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
            </div>

            {/* Description */}
            <p className="text-muted-foreground mt-2.5 line-clamp-2 text-xs leading-relaxed">
              {engine.description}
            </p>
          </Button>
        )
      })}
    </div>
  )
}
