import { useState } from "react"
import { Eye, EyeOff, Zap, Globe } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { UseFormReturn } from "react-hook-form"
import type { DatabaseConnectionInput } from "@/lib/validators"
import type { MongoMode } from "@/hooks/useConnectionWizard"
import type { SSLMode } from "@/types"
import { SslModeSelect } from "./SslModeSelect"

interface MongoFormProps {
  form: UseFormReturn<DatabaseConnectionInput>
  mongoMode?: MongoMode
  setMongoMode?: (mode: MongoMode) => void
  showMongoUri?: boolean
  setShowMongoUri?: (show: boolean) => void
  disabled?: boolean
}

export function MongoForm({
  form,
  showMongoUri: externalShowUri,
  setShowMongoUri: externalSetShowUri,
  disabled = false,
}: MongoFormProps) {
  const { register, setValue, watch } = form
  const [internalShowUri, setInternalShowUri] = useState(false)

  const isPasswordVisible =
    externalShowUri !== undefined ? externalShowUri : internalShowUri
  const setPasswordVisible = externalSetShowUri || setInternalShowUri

  const currentUri = watch("uri") || ""

  // Helper to parse MongoDB URI and fill individual fields below
  const handleAutoFillFromUri = (rawUri: string) => {
    try {
      const trimmed = rawUri.trim()
      if (!trimmed) return
      const parsed = new URL(trimmed)
      const isSrv = trimmed.startsWith("mongodb+srv://")
      const hasTls =
        parsed.searchParams.get("tls") === "true" ||
        parsed.searchParams.get("ssl") === "true"

      setValue("ssl_mode", (isSrv || hasTls ? "require" : "disable") as SSLMode)

      if (parsed.hostname) {
        setValue("host", parsed.hostname)
      }
      if (parsed.port) {
        setValue("port", parseInt(parsed.port, 10))
      } else if (!isSrv) {
        setValue("port", 27017)
      }
      if (parsed.pathname) {
        const dbName = parsed.pathname.replace(/^\//, "")
        if (dbName) setValue("database", dbName)
      }
      if (parsed.username) {
        setValue("username", decodeURIComponent(parsed.username))
      }
      if (parsed.password) {
        setValue("password", decodeURIComponent(parsed.password))
      }
    } catch {
      // Ignore if user is still typing an invalid URI
    }
  }

  return (
    <div className="space-y-3.5">
      {/* ── 1. MongoDB Connection String / URI ── */}
      <div className="border-primary/20 bg-primary/5 space-y-2 rounded-xl border p-3">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="mongoUri"
            className="text-foreground flex items-center gap-1.5 text-xs font-medium"
          >
            <Zap className="text-primary h-3.5 w-3.5" />
            <span>MongoDB Connection String / URI (e.g. MONGODB_URI)</span>
          </Label>
          <span className="text-muted-foreground text-[11px]">
            Auto-fills fields below
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              id="mongoUri"
              type={isPasswordVisible ? "text" : "password"}
              placeholder="mongodb+srv://username:password@cluster.mongodb.net/database"
              {...register("uri", {
                onChange: (e) => {
                  const val = String(e.target.value || "").trim()
                  if (val) {
                    handleAutoFillFromUri(val)
                  }
                },
              })}
              className="bg-background pr-9 font-mono text-xs shadow-xs"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setPasswordVisible(!isPasswordVisible)}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
              tabIndex={-1}
            >
              {isPasswordVisible ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={disabled || !currentUri.trim()}
            className="h-9 shrink-0 cursor-pointer gap-1.5 px-3 text-xs font-semibold shadow-xs"
            onClick={() => handleAutoFillFromUri(currentUri)}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Auto-Fill</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Visual Separation Divider ── */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <span className="border-border/60 w-full border-t" />
        </div>
        <div className="relative flex justify-center text-[10px] font-semibold tracking-wider uppercase">
          <span className="bg-background text-muted-foreground px-3">
            Or configure individual parameters
          </span>
        </div>
      </div>

      {/* ── 3. Individual Host & Port Fields ── */}
      <div className="grid grid-cols-4 gap-2.5">
        <div className="col-span-3 space-y-1">
          <Label htmlFor="host" className="text-xs font-semibold">
            Host / Server Address <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Globe className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="host"
              placeholder="e.g. cluster.mongodb.net or 127.0.0.1"
              {...register("host")}
              className="pl-9 font-mono text-xs"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="col-span-1 space-y-1">
          <Label htmlFor="port" className="text-xs font-semibold">
            Port Number
          </Label>
          <Input
            id="port"
            type="number"
            placeholder="27017"
            {...register("port", { valueAsNumber: true })}
            className="font-mono text-xs"
            disabled={disabled}
          />
        </div>
      </div>

      {/* ── 4. Database Name, Username, Password ── */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="database" className="text-xs font-semibold">
            Database Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="database"
            placeholder="e.g. production_db or admin"
            {...register("database")}
            className="font-mono text-xs"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="username" className="text-xs font-semibold">
            Database User / Username
          </Label>
          <Input
            id="username"
            placeholder="e.g. admin or dbUser"
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

      {/* ── 5. MongoDB SSL/TLS Mode Selector ── */}
      <div className="border-border/60 bg-card flex items-center justify-between rounded-xl border p-2.5">
        <div>
          <Label
            htmlFor="mongo_ssl_mode"
            className="text-foreground text-xs font-semibold"
          >
            SSL / TLS Security Mode
          </Label>
          <p className="text-muted-foreground text-[11px]">
            Always required for MongoDB Atlas
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
