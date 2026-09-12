import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DBType } from "@/types"

interface UriQuickPasteBarProps {
  selectedEngine: DBType
  quickPasteOpen: boolean
  setQuickPasteOpen: (open: boolean) => void
  quickPasteUri: string
  setQuickPasteUri: (uri: string) => void
  onApply: (uri: string) => void
  disabled?: boolean
}

export function UriQuickPasteBar({
  selectedEngine,
  quickPasteOpen,
  setQuickPasteOpen,
  quickPasteUri,
  setQuickPasteUri,
  onApply,
  disabled = false,
}: UriQuickPasteBarProps) {
  if (selectedEngine === "sqlite") return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">
          Credential Parameters
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="text-primary hover:text-primary h-7 gap-1.5 text-xs font-medium"
          onClick={() => setQuickPasteOpen(!quickPasteOpen)}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{quickPasteOpen ? "Hide URI Paste" : "Paste URI"}</span>
        </Button>
      </div>

      {quickPasteOpen && (
        <div className="border-primary/30 bg-primary/5 flex items-center gap-2 rounded-lg border p-2">
          <Input
            placeholder={`${selectedEngine}://user:pass@host:port/dbname?sslmode=require`}
            value={quickPasteUri}
            onChange={(e) => setQuickPasteUri(e.target.value)}
            disabled={disabled}
            className="bg-background h-8 font-mono text-xs"
          />
          <Button
            type="button"
            size="sm"
            disabled={disabled || !quickPasteUri.trim()}
            className="h-8 shrink-0 text-xs"
            onClick={() => onApply(quickPasteUri)}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  )
}
