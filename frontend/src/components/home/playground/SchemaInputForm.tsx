import { useState } from "react"
import {
  Plus,
  Trash2,
  RotateCcw,
  Table2,
  FileCode2,
  KeyRound,
  ShoppingBag,
  User,
  Activity,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  PLAYGROUND_PRESETS,
  SQL_DATA_TYPES,
  NOSQL_DATA_TYPES,
  type SchemaField,
  type DataType,
  type ConversionDirection,
  type PresetTemplate,
} from "@/lib/constants/playgroundPresets"

interface SchemaInputFormProps {
  direction: ConversionDirection
  tableName: string
  onTableNameChange: (name: string) => void
  fields: SchemaField[]
  onFieldsChange: (fields: SchemaField[]) => void
  jsonDoc: string
  onJsonDocChange: (doc: string) => void
  onSelectPreset: (preset: PresetTemplate) => void
  activePresetId: string
  onReset: () => void
}

export const SchemaInputForm = ({
  direction,
  tableName,
  onTableNameChange,
  fields,
  onFieldsChange,
  jsonDoc,
  onJsonDocChange,
  onSelectPreset,
  activePresetId,
  onReset,
}: SchemaInputFormProps) => {
  const isSql = direction === "sql-to-nosql"
  const availableTypes = isSql ? SQL_DATA_TYPES : NOSQL_DATA_TYPES
  const [copied, setCopied] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)

  const handleFieldChange = (
    id: string,
    key: keyof SchemaField,
    value: string | DataType | boolean
  ) => {
    onFieldsChange(
      fields.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    )
  }

  const handleAddField = () => {
    onFieldsChange([
      ...fields,
      {
        id: "f_" + Math.random().toString(36).slice(2, 8),
        name: "new_attribute",
        type: "VARCHAR",
        value: "sample_value",
      },
    ])
  }

  const handleDeleteField = (id: string) => {
    if (fields.length > 1) onFieldsChange(fields.filter((f) => f.id !== id))
  }

  const handleJsonChange = (val: string) => {
    onJsonDocChange(val)
    try {
      const parsed = JSON.parse(val)
      setJsonError(null)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const extracted: SchemaField[] = Object.entries(parsed)
          .filter(([k]) => k !== "_id")
          .map(([k, v], idx) => {
            let type: DataType = "VARCHAR"
            if (typeof v === "number")
              type = Number.isInteger(v) ? "INT" : "NUMERIC"
            else if (typeof v === "boolean") type = "BOOLEAN"
            else if (Array.isArray(v)) type = "ARRAY"
            else if (typeof v === "object" && v !== null) type = "JSONB"
            return {
              id: `field_${idx}`,
              name: k,
              type,
              value: typeof v === "object" ? JSON.stringify(v) : String(v),
            }
          })
        if (extracted.length > 0) onFieldsChange(extracted)
      }
    } catch {
      setJsonError("Invalid JSON syntax")
    }
  }

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonDoc)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  const getPresetIcon = (type: string) => {
    if (type === "shopping-bag")
      return <ShoppingBag className="size-3 shrink-0" />
    if (type === "user") return <User className="size-3 shrink-0" />
    return <Activity className="size-3 shrink-0" />
  }

  return (
    <div className="bg-card border-border flex h-full flex-col rounded-2xl border p-4 shadow-xs transition-all">
      {/* Header & Presets */}
      <div className="border-border flex flex-col gap-2.5 border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary border-primary/20 rounded-lg border p-1.5">
              {isSql ? (
                <Table2 className="size-4" />
              ) : (
                <FileCode2 className="text-secondary size-4" />
              )}
            </div>
            <div>
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Source Entity
              </span>
              <h3 className="text-foreground text-sm font-bold">
                {isSql ? "Relational SQL Table" : "NoSQL Document (JSON)"}
              </h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            <RotateCcw className="mr-1 size-3" />
            Reset
          </Button>
        </div>

        {/* Presets Bar */}
        <div className="flex scrollbar-none items-center gap-1.5 overflow-x-auto py-0.5 whitespace-nowrap">
          <span className="text-muted-foreground shrink-0 text-[11px] font-medium">
            Presets:
          </span>
          {PLAYGROUND_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id
            return (
              <Button
                key={preset.id}
                variant={isSelected ? "secondary" : "outline"}
                size="xs"
                onClick={() => onSelectPreset(preset)}
                className={`flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-[10.5px] font-medium transition-all ${
                  isSelected
                    ? "bg-secondary text-secondary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="opacity-80">
                  {getPresetIcon(preset.iconType)}
                </span>
                <span>{preset.name}</span>
              </Button>
            )
          })}
        </div>

        {/* Entity / Table Name */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-muted-foreground font-mono text-xs whitespace-nowrap">
            {isSql ? "Table Name:" : "Collection Name:"}
          </span>
          <Input
            value={tableName}
            onChange={(e) => onTableNameChange(e.target.value)}
            className="bg-muted/40 h-7 max-w-45 font-mono text-xs"
            placeholder={isSql ? "e.g. orders" : "e.g. orders"}
          />
        </div>
      </div>

      {/* Body: SQL Fields or NoSQL JSON Format */}
      {isSql ? (
        <div className="max-h-90 flex-1 space-y-2 overflow-y-auto py-2.5 pr-1">
          <div className="text-muted-foreground grid grid-cols-12 gap-2 px-1 text-[11px] font-semibold uppercase">
            <div className="col-span-4">Field Name</div>
            <div className="col-span-3">Type</div>
            <div className="col-span-4">Sample Value</div>
            <div className="col-span-1"></div>
          </div>

          {fields.map((field) => (
            <div
              key={field.id}
              className="bg-muted/30 border-border/50 grid grid-cols-12 items-center gap-2 rounded-lg border p-1.5"
            >
              <div className="relative col-span-4">
                <Input
                  value={field.name}
                  onChange={(e) =>
                    handleFieldChange(field.id, "name", e.target.value)
                  }
                  className="bg-background h-7 font-mono text-xs"
                />
                {field.isPrimary && (
                  <KeyRound className="text-secondary pointer-events-none absolute top-2 right-2 size-3 opacity-80" />
                )}
              </div>
              <div className="col-span-3">
                <select
                  value={field.type}
                  onChange={(e) =>
                    handleFieldChange(
                      field.id,
                      "type",
                      e.target.value as DataType
                    )
                  }
                  aria-label={`Data type for ${field.name}`}
                  className="border-input bg-background text-foreground h-7 w-full rounded-lg border px-1.5 font-mono text-[11px] focus:outline-none"
                >
                  {availableTypes.map((t) => (
                    <option
                      key={t}
                      value={t}
                      className="bg-popover text-popover-foreground"
                    >
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-4">
                <Input
                  value={field.value}
                  onChange={(e) =>
                    handleFieldChange(field.id, "value", e.target.value)
                  }
                  className="bg-background text-muted-foreground h-7 font-mono text-xs"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleDeleteField(field.id)}
                  disabled={fields.length <= 1}
                  aria-label={`Delete field ${field.name}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col overflow-hidden py-2">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-muted-foreground text-[11px] font-medium">
              BSON / JSON Document Payload
            </span>
            <div className="flex items-center gap-2">
              {jsonError ? (
                <span className="text-destructive font-mono text-[10px] font-semibold">
                  {jsonError}
                </span>
              ) : (
                <span className="font-mono text-[10px] font-medium text-emerald-500">
                  Valid JSON
                </span>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleCopyJson}
                className="h-5 w-5"
                title="Copy Document JSON"
              >
                {copied ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
              </Button>
            </div>
          </div>
          <div className="bg-muted/30 border-border relative flex-1 overflow-hidden rounded-xl border">
            <textarea
              value={jsonDoc}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder="Paste or edit JSON document..."
              className="text-foreground/90 h-full w-full resize-none bg-transparent p-3 font-mono text-xs leading-relaxed focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {isSql && (
        <div className="border-border mt-auto border-t pt-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddField}
            className="border-border hover:border-primary hover:text-primary flex w-full items-center justify-center gap-1.5 border-dashed text-xs font-medium"
          >
            <Plus className="size-3.5" />
            <span>Add Schema Field</span>
          </Button>
        </div>
      )}
    </div>
  )
}
