import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DBType } from "@/types"

interface UriQuickPasteBarProps {
  selectedEngine: DBType
  quickPasteUri: string
  setQuickPasteUri: (uri: string) => void
  onApply: (uri: string) => void
  disabled?: boolean
}

export function UriQuickPasteBar({
  selectedEngine,
  quickPasteUri,
  setQuickPasteUri,
  onApply,
  disabled = false,
}: UriQuickPasteBarProps) {
  if (selectedEngine === "sqlite") return null

  const placeholderUri =
    selectedEngine === "postgres"
      ? "postgres://username:password@ep-example.neon.tech:5432/neondb?sslmode=require"
      : "mysql://username:password@host:3306/production_db"

  return (
    <div className="border-primary/20 bg-primary/5 space-y-2 rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <Label
          htmlFor="quickPasteUri"
          className="text-foreground flex items-center gap-1.5 text-xs font-medium"
        >
          <Zap className="text-primary h-3.5 w-3.5" />
          <span>Connection String / URI (e.g. DATABASE_URL)</span>
        </Label>
        <span className="text-muted-foreground text-[11px]">
          Auto-fills fields below
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          id="quickPasteUri"
          placeholder={placeholderUri}
          value={quickPasteUri}
          onChange={(e) => setQuickPasteUri(e.target.value)}
          disabled={disabled}
          className="bg-background h-9 font-mono text-xs shadow-xs"
        />
        <Button
          type="button"
          size="sm"
          disabled={disabled || !quickPasteUri.trim()}
          className="h-9 shrink-0 cursor-pointer gap-1.5 px-3 text-xs font-semibold shadow-xs"
          onClick={() => onApply(quickPasteUri)}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Auto-Fill</span>
        </Button>
      </div>
    </div>
  )
}
