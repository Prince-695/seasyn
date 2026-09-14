import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EngineIcon } from "@/components/connections/EngineIcon"
import type { PublicDatabaseConnection } from "@/types"
import { cn } from "@/lib/utils"

interface ConnectionSelectCardProps {
  connection: PublicDatabaseConnection
  isSelected: boolean
  onSelect: () => void
}

export function ConnectionSelectCard({
  connection,
  isSelected,
  onSelect,
}: ConnectionSelectCardProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onSelect}
      className={cn(
        "flex h-auto w-full cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition-all",
        isSelected
          ? "border-primary bg-primary/10 shadow-xs"
          : "border-border/70 bg-card hover:border-border hover:bg-muted/30"
      )}
    >
      <div className="flex items-center gap-3">
        <EngineIcon engine={connection.db_type} className="h-5 w-5" />
        <div>
          <p className="text-foreground text-xs font-semibold">
            {connection.name}
          </p>
          <p className="text-muted-foreground font-mono text-[11px]">
            {connection.database || connection.host || connection.db_type}
          </p>
        </div>
      </div>

      <Badge variant="outline" className="font-mono text-[10px] uppercase">
        {connection.db_type}
      </Badge>
    </Button>
  )
}
