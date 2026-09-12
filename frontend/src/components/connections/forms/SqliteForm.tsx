import { HardDrive } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { UseFormReturn } from "react-hook-form"
import type { DatabaseConnectionInput } from "@/lib/validators"

interface SqliteFormProps {
  form: UseFormReturn<DatabaseConnectionInput>
  disabled?: boolean
}

export function SqliteForm({ form, disabled = false }: SqliteFormProps) {
  const { register } = form

  return (
    <div className="space-y-2 pt-2">
      <Label htmlFor="filePath" className="text-xs font-semibold">
        SQLite Database File Path <span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <HardDrive className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          id="filePath"
          placeholder="/var/data/production.db or app.db"
          {...register("file_path")}
          className="pl-9 font-mono text-xs"
          disabled={disabled}
        />
      </div>
      <p className="text-muted-foreground text-[11px]">
        Specify an absolute file path accessible to the SEASYN worker engine.
      </p>
    </div>
  )
}
