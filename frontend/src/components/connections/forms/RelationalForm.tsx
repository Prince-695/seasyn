import { Globe } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { UseFormReturn } from "react-hook-form"
import type { DatabaseConnectionInput } from "@/lib/validators"
import type { DBType } from "@/types"

interface RelationalFormProps {
  form: UseFormReturn<DatabaseConnectionInput>
  selectedEngine: DBType
  disabled?: boolean
}

export function RelationalForm({
  form,
  selectedEngine,
  disabled = false,
}: RelationalFormProps) {
  const { register } = form

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-4 gap-2.5">
        <div className="col-span-3 space-y-1">
          <Label htmlFor="host" className="text-xs font-semibold">
            Host Address <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Globe className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="host"
              placeholder="ep-example.neon.tech or 127.0.0.1"
              {...register("host")}
              className="pl-9 font-mono text-xs"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="col-span-1 space-y-1">
          <Label htmlFor="port" className="text-xs font-semibold">
            Port <span className="text-destructive">*</span>
          </Label>
          <Input
            id="port"
            type="number"
            placeholder={selectedEngine === "postgres" ? "5432" : "3306"}
            {...register("port", { valueAsNumber: true })}
            className="font-mono text-xs"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="space-y-1">
          <Label htmlFor="database" className="text-xs font-semibold">
            Database Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="database"
            placeholder="neondb"
            {...register("database")}
            className="font-mono text-xs"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="username" className="text-xs font-semibold">
            Username <span className="text-destructive">*</span>
          </Label>
          <Input
            id="username"
            placeholder="neondb_owner"
            {...register("username")}
            className="font-mono text-xs"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password" className="text-xs font-semibold">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••••••"
            {...register("password")}
            disabled={disabled}
            className="text-xs"
          />
        </div>
      </div>

      {/* SSL Mode selector */}
      <div className="flex items-center justify-between pt-1">
        <Label
          htmlFor="ssl_mode"
          className="text-muted-foreground text-xs font-medium"
        >
          SSL Mode
        </Label>
        <select
          id="ssl_mode"
          {...register("ssl_mode")}
          disabled={disabled}
          className="border-input bg-background text-foreground h-8 rounded-md border px-2.5 text-xs shadow-xs focus:ring-1"
        >
          <option value="disable">Disable</option>
          <option value="require">Require (SSL)</option>
          <option value="verify-ca">Verify CA</option>
          <option value="verify-full">Verify Full</option>
          <option value="prefer">Prefer</option>
        </select>
      </div>
    </div>
  )
}
