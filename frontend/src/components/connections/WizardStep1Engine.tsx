import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { EngineSelector } from "./EngineSelector"
import type { UseFormReturn } from "react-hook-form"
import type { DatabaseConnectionInput } from "@/lib/validators"
import type { DBType } from "@/types"

interface WizardStep1EngineProps {
  form: UseFormReturn<DatabaseConnectionInput>
  selectedEngine: DBType
  setSelectedEngine: (engine: DBType) => void
  isSourceVal: boolean
  setIsSourceVal: (isSource: boolean) => void
  disabled?: boolean
}

export function WizardStep1Engine({
  form,
  selectedEngine,
  setSelectedEngine,
  isSourceVal,
  setIsSourceVal,
  disabled = false,
}: WizardStep1EngineProps) {
  const {
    register,
    setValue,
    formState: { errors },
  } = form

  return (
    <div className="space-y-4 pt-1">
      {/* Engine Selection in 4-column horizontal cards */}
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs font-semibold">
          Select Database Engine
        </Label>
        <EngineSelector
          value={selectedEngine}
          onChange={(engine) => setSelectedEngine(engine)}
          disabled={disabled}
          className="grid-cols-2 sm:grid-cols-4"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
        {/* Connection Name */}
        <div className="space-y-1.5">
          <Label
            htmlFor="connName"
            className="text-foreground text-xs font-semibold"
          >
            Connection Identifier <span className="text-destructive">*</span>
          </Label>
          <Input
            id="connName"
            placeholder="e.g. Primary Aurora Postgres"
            autoComplete="off"
            {...register("name")}
            disabled={disabled}
            className="h-10 rounded-xl text-xs ring-offset-0"
          />
          {errors.name ? (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          ) : (
            <p className="text-muted-foreground text-[11px]">
              A recognizable name for this database connection.
            </p>
          )}
        </div>

        {/* Source vs Target Switcher */}
        <div className="space-y-1.5">
          <Label className="text-foreground text-xs font-semibold">
            Synchronization Role
          </Label>
          <div className="border-border/70 bg-card/60 flex h-10 items-center justify-between rounded-xl border px-3.5 shadow-2xs">
            <span className="text-foreground text-xs font-semibold">
              {isSourceVal ? "Source Database" : "Target Database"}
            </span>
            <Switch
              checked={isSourceVal}
              onCheckedChange={(checked) => {
                setIsSourceVal(checked)
                setValue("is_source", checked)
              }}
              disabled={disabled}
            />
          </div>
          <p className="text-muted-foreground text-[11px]">
            {isSourceVal
              ? "Read for schema extraction & data introspection."
              : "Destination for synced schemas & tables."}
          </p>
        </div>
      </div>
    </div>
  )
}
