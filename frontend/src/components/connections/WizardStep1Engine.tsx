import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EngineSelector } from "./EngineSelector"
import { cn } from "@/lib/utils"
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
        <Label className="text-muted-foreground text-xs font-medium">
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
            className="text-foreground text-xs font-medium"
          >
            Connection Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="connName"
            placeholder="e.g. Production Aurora Postgres or Analytics DB"
            autoComplete="off"
            {...register("name")}
            disabled={disabled}
            className="h-10 rounded-xl text-xs ring-offset-0"
          />
          {errors.name ? (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          ) : (
            <p className="text-muted-foreground text-[11px]">
              A friendly name to identify this database connection in your
              project.
            </p>
          )}
        </div>

        {/* Source vs Target Segmented Buttons */}
        <div className="space-y-1.5">
          <Label className="text-foreground text-xs font-medium">
            Database Role
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => {
                setIsSourceVal(true)
                setValue("is_source", true)
              }}
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-xs font-medium transition-all",
                isSourceVal
                  ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-xs"
                  : "border-border/70 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isSourceVal ? "bg-primary" : "bg-muted-foreground/40"
                )}
              />
              <span>Source (Read)</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => {
                setIsSourceVal(false)
                setValue("is_source", false)
              }}
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-xs font-medium transition-all",
                !isSourceVal
                  ? "border-success/50 bg-success/10 text-success hover:bg-success/15 hover:text-success shadow-xs"
                  : "border-border/70 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  !isSourceVal ? "bg-success" : "bg-muted-foreground/40"
                )}
              />
              <span>Target (Destination)</span>
            </Button>
          </div>
          <p className="text-muted-foreground text-[11px]">
            {isSourceVal
              ? "Read for schema extraction and data copying."
              : "Destination for synced schemas and migrated tables."}
          </p>
        </div>
      </div>
    </div>
  )
}
