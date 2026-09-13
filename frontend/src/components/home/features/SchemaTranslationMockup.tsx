import { Database, ArrowRight } from "lucide-react"

import { CANONICAL_SCHEMA_MAPPINGS } from "@/lib/constants/schemaMappings"

export const SchemaTranslationMockup = () => {
  return (
    <div className="bg-muted/40 dark:bg-muted/15 border-border/40 relative flex h-50 w-full items-center justify-center overflow-hidden rounded-xl border p-3">
      <div className="bg-card border-border flex w-full max-w-xs flex-col gap-2 rounded-lg border p-2.5 shadow-sm">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Database className="text-primary h-3.5 w-3.5" />
            <span className="text-foreground text-[11px] font-semibold">
              Type Bridge
            </span>
          </div>
          <span className="bg-accent/15 text-accent inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold">
            <span className="bg-accent h-1.5 w-1.5 rounded-full" />
            Introspected
          </span>
        </div>

        {/* Translation Mappings List mapped from array */}
        <div className="flex flex-col gap-1.5">
          {CANONICAL_SCHEMA_MAPPINGS.slice(0, 3).map((item, index) => (
            <div
              key={index}
              className="bg-muted/40 border-border/50 flex items-center justify-between rounded-md border p-1.5 px-2 text-[10px]"
            >
              <div className="flex items-center gap-1">
                <span className="bg-info/15 text-info py-0.2 rounded px-1 font-mono text-[9px] font-bold">
                  {item.fromSource}
                </span>
                <span className="text-foreground font-mono font-medium">
                  {item.fromType}
                </span>
              </div>
              <ArrowRight className="text-muted-foreground/60 h-3 w-3 shrink-0" />
              <div className="flex items-center gap-1">
                <span className="bg-success/15 text-success py-0.2 rounded px-1 font-mono text-[9px] font-bold">
                  {item.toTarget}
                </span>
                <span className="text-foreground font-mono font-medium">
                  {item.toType}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
