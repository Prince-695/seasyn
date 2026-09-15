import {
  Plus,
  Trash2,
  RotateCcw,
  Table2,
  KeyRound,
  ShoppingBag,
  User,
  Activity,
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
  onSelectPreset,
  activePresetId,
  onReset,
}: SchemaInputFormProps) => {
  const isSql = direction === "sql-to-nosql"
  const availableTypes = isSql ? SQL_DATA_TYPES : NOSQL_DATA_TYPES

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
    const newField: SchemaField = {
      id: "f_" + Math.random().toString(36).slice(2, 8),
      name: "new_attribute",
      type: "VARCHAR",
      value: "sample_value",
      isPrimary: false,
    }
    onFieldsChange([...fields, newField])
  }

  const handleDeleteField = (id: string) => {
    if (fields.length <= 1) return
    onFieldsChange(fields.filter((f) => f.id !== id))
  }

  const renderPresetIcon = (iconType: string) => {
    switch (iconType) {
      case "shopping-bag":
        return <ShoppingBag className="size-3 shrink-0" />
      case "user":
        return <User className="size-3 shrink-0" />
      case "activity":
        return <Activity className="size-3 shrink-0" />
      default:
        return null
    }
  }

  return (
    <div className="bg-card border-border flex h-full flex-col rounded-2xl border p-4.5 shadow-xs transition-all">
      {/* Header & Presets */}
      <div className="border-border flex flex-col gap-3 border-b pb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary border-primary/20 rounded-lg border p-1.5">
              <Table2 className="size-4" />
            </div>
            <div>
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Source Entity
              </span>
              <h3 className="text-foreground text-sm font-bold">
                {isSql ? "Relational SQL Table" : "NoSQL Document Schema"}
              </h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>
        </div>

        {/* Quick Presets in 1 Single Line */}
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
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span className="opacity-80">
                  {renderPresetIcon(preset.iconType)}
                </span>
                <span>{preset.name}</span>
              </Button>
            )
          })}
        </div>

        {/* Entity / Table Name Input */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-muted-foreground font-mono text-xs whitespace-nowrap">
            {isSql ? "Table Name:" : "Collection Name:"}
          </span>
          <Input
            value={tableName}
            onChange={(e) => onTableNameChange(e.target.value)}
            className="bg-muted/40 h-7 max-w-50 font-mono text-xs"
            placeholder="e.g. orders"
          />
        </div>
      </div>

      {/* Dynamic Fields Table */}
      <div className="max-h-90 flex-1 space-y-2 overflow-y-auto py-3 pr-1">
        <div className="text-muted-foreground grid grid-cols-12 gap-2 px-1 text-[11px] font-semibold tracking-wider uppercase">
          <div className="col-span-4">Field Name</div>
          <div className="col-span-3">Type</div>
          <div className="col-span-4">Sample Value</div>
          <div className="col-span-1 text-center"></div>
        </div>

        {fields.map((field) => (
          <div
            key={field.id}
            className="bg-muted/30 border-border/50 hover:border-border grid grid-cols-12 items-center gap-2 rounded-lg border p-1.5 transition-colors"
          >
            {/* Field Name */}
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

            {/* Field Type */}
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
                aria-label={`Data type for field ${field.name}`}
                className="border-input bg-background text-foreground focus:ring-ring h-7 w-full rounded-lg border px-2 py-0.5 font-mono text-[11px] focus:ring-1 focus:outline-none"
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

            {/* Sample Value */}
            <div className="col-span-4">
              <Input
                value={field.value}
                onChange={(e) =>
                  handleFieldChange(field.id, "value", e.target.value)
                }
                className="bg-background text-muted-foreground h-7 font-mono text-xs"
              />
            </div>

            {/* Delete Field */}
            <div className="col-span-1 flex justify-center">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDeleteField(field.id)}
                disabled={fields.length <= 1}
                aria-label={`Delete field ${field.name}`}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Field CTA */}
      <div className="border-border mt-auto border-t pt-3">
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
    </div>
  )
}
