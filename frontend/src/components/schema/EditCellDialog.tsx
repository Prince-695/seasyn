import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { SeasonTypeBadge } from "./SeasonTypeBadge"
import type { ColumnSchema } from "@/types/schema"
import { Code2, AlertCircle } from "lucide-react"

interface EditCellDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: Record<string, unknown> | null
  column: ColumnSchema | null
  onSave: (val: unknown) => Promise<void>
}

interface EditCellInnerProps {
  row: Record<string, unknown>
  column: ColumnSchema
  onSave: (val: unknown) => Promise<void>
  onClose: () => void
}

function EditCellInner({ row, column, onSave, onClose }: EditCellInnerProps) {
  const isJson = column.season_type === "json" || column.season_type === "array"
  const isBool = column.season_type === "bool"
  const raw = row[column.name]

  const [boolVal, setBoolVal] = useState<boolean>(() =>
    isBool ? Boolean(raw) : false
  )
  const [value, setValue] = useState<string>(() => {
    if (isBool) return ""
    if (isJson) {
      return typeof raw === "object"
        ? JSON.stringify(raw, null, 2)
        : String(raw ?? "")
    }
    return raw === null || raw === undefined ? "" : String(raw)
  })
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setJsonError(null)
    try {
      let finalVal: unknown = value

      if (isBool) {
        finalVal = boolVal
      } else if (isJson) {
        try {
          finalVal = JSON.parse(value)
        } catch {
          setJsonError("Invalid JSON syntax. Please check brackets and quotes.")
          setSaving(false)
          return
        }
      } else if (
        column.season_type === "int" ||
        column.season_type === "float" ||
        column.season_type === "decimal"
      ) {
        if (value.trim() === "") {
          finalVal = column.is_nullable ? null : 0
        } else {
          finalVal = Number(value)
        }
      }

      await onSave(finalVal)
      onClose()
    } catch (err: unknown) {
      setJsonError(
        err instanceof Error ? err.message : "Failed to update cell value."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <DialogTitle className="text-base font-bold">
            Edit Value:{" "}
            <span className="text-primary font-mono">{column.name}</span>
          </DialogTitle>
          <SeasonTypeBadge type={column.season_type} />
        </div>
        <DialogDescription className="text-xs">
          Modify cell value. Type constraints and nullability rules apply.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-2">
        {isBool ? (
          <div className="border-border/70 bg-muted/20 flex items-center justify-between rounded-xl border p-3">
            <Label
              htmlFor="boolField"
              className="cursor-pointer text-xs font-semibold"
            >
              Boolean State: {boolVal ? "TRUE" : "FALSE"}
            </Label>
            <Switch
              id="boolField"
              checked={boolVal}
              onCheckedChange={setBoolVal}
            />
          </div>
        ) : isJson ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="jsonArea" className="text-xs font-semibold">
                JSON / Object Editor
              </Label>
              <span className="text-muted-foreground flex items-center gap-1 font-mono text-[10px]">
                <Code2 className="h-3 w-3" /> Valid JSON
              </span>
            </div>
            <Textarea
              id="jsonArea"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                if (jsonError) setJsonError(null)
              }}
              rows={8}
              className="bg-zinc-950 font-mono text-xs text-emerald-400"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="fieldInput" className="text-xs font-semibold">
              Column Value ({column.data_type})
            </Label>
            <Input
              id="fieldInput"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                column.is_nullable ? "NULL or value" : "Value required"
              }
              className="font-mono text-xs ring-offset-0"
            />
          </div>
        )}

        {jsonError && (
          <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-1.5 rounded-lg border p-2 text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{jsonError}</span>
          </div>
        )}
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function EditCellDialog({
  open,
  onOpenChange,
  row,
  column,
  onSave,
}: EditCellDialogProps) {
  if (!open || !column || !row) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EditCellInner
        key={`${column.name}-${String(row[column.name])}`}
        row={row}
        column={column}
        onSave={onSave}
        onClose={() => onOpenChange(false)}
      />
    </Dialog>
  )
}
