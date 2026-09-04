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
import type { TableSchema } from "@/types/schema"
import { Plus, Key, Loader2, AlertCircle } from "lucide-react"

interface InsertRowModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: TableSchema
  onInsert: (data: Record<string, unknown>) => Promise<void>
}

export function InsertRowModal({
  open,
  onOpenChange,
  table,
  onInsert,
}: InsertRowModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFieldChange = (colName: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [colName]: value,
    }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate non-nullable fields without defaults or autogen
      for (const col of table.columns) {
        if (!col.is_nullable && !col.default_value) {
          const val = formData[col.name]
          if (val === undefined || val === null || val === "") {
            throw new Error(
              `Column '${col.name}' is required and cannot be NULL.`
            )
          }
        }
      }

      // Format types (parse json, numbers)
      const payload: Record<string, unknown> = {}
      for (const [colName, rawVal] of Object.entries(formData)) {
        if (rawVal === "" || rawVal === undefined) continue
        const colDef = table.columns.find((c) => c.name === colName)
        if (!colDef) {
          payload[colName] = rawVal
          continue
        }

        if (colDef.season_type === "json" || colDef.season_type === "array") {
          try {
            payload[colName] =
              typeof rawVal === "string" ? JSON.parse(rawVal) : rawVal
          } catch {
            throw new Error(`Invalid JSON format in column '${colName}'.`)
          }
        } else if (
          colDef.season_type === "int" ||
          colDef.season_type === "float" ||
          colDef.season_type === "decimal"
        ) {
          payload[colName] = Number(rawVal)
        } else {
          payload[colName] = rawVal
        }
      }

      await onInsert(payload)
      setFormData({})
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to insert new row.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="border-primary/30 bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg border">
              <Plus className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold">
              Insert New Row:{" "}
              <span className="text-primary font-mono">{table.name}</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Generate and validate a new physical record. Constraints and
            defaults will be applied.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div className="space-y-3">
            {table.columns.map((col) => {
              const isPk = col.is_primary_key
              const isBool = col.season_type === "bool"
              const isJson =
                col.season_type === "json" || col.season_type === "array"

              return (
                <div
                  key={col.name}
                  className="border-border/60 bg-muted/10 space-y-1.5 rounded-xl border p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isPk && <Key className="h-3.5 w-3.5 text-amber-500" />}
                      <Label
                        htmlFor={`col-${col.name}`}
                        className="font-mono text-xs font-semibold"
                      >
                        {col.name}
                      </Label>
                      {!col.is_nullable && (
                        <span className="text-destructive text-xs">*</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <SeasonTypeBadge type={col.season_type} />
                      {col.default_value && (
                        <span className="text-muted-foreground font-mono text-[10px]">
                          default: {col.default_value}
                        </span>
                      )}
                    </div>
                  </div>

                  {isBool ? (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-muted-foreground font-mono text-xs">
                        {formData[col.name] ? "TRUE" : "FALSE"}
                      </span>
                      <Switch
                        id={`col-${col.name}`}
                        checked={Boolean(formData[col.name])}
                        onCheckedChange={(checked) =>
                          handleFieldChange(col.name, checked)
                        }
                      />
                    </div>
                  ) : isJson ? (
                    <Textarea
                      id={`col-${col.name}`}
                      rows={3}
                      placeholder='{ "key": "value" }'
                      value={(formData[col.name] as string) || ""}
                      onChange={(e) =>
                        handleFieldChange(col.name, e.target.value)
                      }
                      className="bg-zinc-950 font-mono text-xs text-emerald-400"
                    />
                  ) : (
                    <Input
                      id={`col-${col.name}`}
                      placeholder={
                        col.default_value
                          ? `(Default: ${col.default_value})`
                          : col.is_nullable
                            ? "Optional (NULL)"
                            : "Required value"
                      }
                      value={(formData[col.name] as string) || ""}
                      onChange={(e) =>
                        handleFieldChange(col.name, e.target.value)
                      }
                      className="font-mono text-xs ring-offset-0"
                    />
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-2.5 text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5 font-semibold"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? "Inserting..." : "Insert Record"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
