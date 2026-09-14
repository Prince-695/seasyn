import { Globe } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { UseFormReturn } from "react-hook-form"
import type { DatabaseConnectionInput } from "@/lib/validators"
import type { DBType } from "@/types"
import { SslModeSelect } from "./SslModeSelect"

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
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2.5">
        <div className="col-span-3 space-y-1">
          <Label htmlFor="host" className="text-xs font-semibold">
            Host / Server Address <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Globe className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="host"
              placeholder={
                selectedEngine === "postgres"
                  ? "e.g. ep-example.neon.tech or 127.0.0.1"
                  : "e.g. mysql.example.com or 127.0.0.1"
              }
              {...register("host")}
              className="pl-9 font-mono text-xs"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="col-span-1 space-y-1">
          <Label htmlFor="port" className="text-xs font-semibold">
            Port Number <span className="text-destructive">*</span>
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

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="database" className="text-xs font-semibold">
            Database Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="database"
            placeholder={
              selectedEngine === "postgres"
                ? "e.g. neondb or production"
                : "e.g. app_db"
            }
            {...register("database")}
            className="font-mono text-xs"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="username" className="text-xs font-semibold">
            Database User <span className="text-destructive">*</span>
          </Label>
          <Input
            id="username"
            placeholder={
              selectedEngine === "postgres"
                ? "e.g. neondb_owner or postgres"
                : "e.g. root"
            }
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
            placeholder="Enter database password"
            {...register("password")}
            disabled={disabled}
            className="text-xs"
          />
        </div>
      </div>

      {/* SSL Mode selector */}
      <div className="border-border/60 bg-card flex items-center justify-between rounded-xl border p-2.5">
        <div>
          <Label
            htmlFor="ssl_mode"
            className="text-foreground text-xs font-semibold"
          >
            SSL Security Mode
          </Label>
          <p className="text-muted-foreground text-[11px]">
            Transport layer encryption
          </p>
        </div>
        <SslModeSelect
          value={form.watch("ssl_mode")}
          onChange={(val) =>
            form.setValue("ssl_mode", val, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
          disabled={disabled}
        />
      </div>
    </div>
  )
}
