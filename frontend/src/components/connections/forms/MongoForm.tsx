import { Eye, EyeOff } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { UseFormReturn } from "react-hook-form"
import type { DatabaseConnectionInput } from "@/lib/validators"
import type { MongoMode } from "@/hooks/useConnectionWizard"

interface MongoFormProps {
  form: UseFormReturn<DatabaseConnectionInput>
  mongoMode: MongoMode
  setMongoMode: (mode: MongoMode) => void
  showMongoUri: boolean
  setShowMongoUri: (show: boolean) => void
  disabled?: boolean
}

export function MongoForm({
  form,
  mongoMode,
  setMongoMode,
  showMongoUri,
  setShowMongoUri,
  disabled = false,
}: MongoFormProps) {
  const { register, setValue } = form

  return (
    <Tabs
      value={mongoMode}
      onValueChange={(val) => setMongoMode(val as MongoMode)}
      className="w-full"
    >
      <TabsList className="grid h-8 w-48 grid-cols-2">
        <TabsTrigger value="uri" className="text-xs">
          URI
        </TabsTrigger>
        <TabsTrigger value="params" className="text-xs">
          Parameters
        </TabsTrigger>
      </TabsList>

      <TabsContent value="uri" className="space-y-2 pt-2">
        <Label htmlFor="mongoUri" className="text-xs font-semibold">
          MongoDB Connection URI <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="mongoUri"
            type={showMongoUri ? "text" : "password"}
            placeholder="mongodb+srv://user:password@cluster.mongodb.net/database"
            {...register("uri", {
              onChange: (e) => {
                const val = String(e.target.value || "").trim()
                if (
                  val.startsWith("mongodb+srv://") ||
                  val.includes("tls=true") ||
                  val.includes("ssl=true")
                ) {
                  setValue("ssl_mode", "require")
                }
              },
            })}
            className="pr-9 font-mono text-xs ring-offset-0"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowMongoUri(!showMongoUri)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
            tabIndex={-1}
          >
            {showMongoUri ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="params" className="space-y-2.5 pt-2">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="col-span-2 space-y-1">
            <Label htmlFor="host" className="text-xs font-medium">
              Host
            </Label>
            <Input
              id="host"
              placeholder="localhost"
              {...register("host")}
              disabled={disabled}
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="port" className="text-xs font-medium">
              Port
            </Label>
            <Input
              id="port"
              type="number"
              defaultValue={27017}
              {...register("port", { valueAsNumber: true })}
              disabled={disabled}
              className="text-xs"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="space-y-1">
            <Label htmlFor="db" className="text-xs font-medium">
              Database
            </Label>
            <Input
              id="db"
              placeholder="main_db"
              {...register("database")}
              disabled={disabled}
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="user" className="text-xs font-medium">
              Username
            </Label>
            <Input
              id="user"
              placeholder="admin"
              {...register("username")}
              disabled={disabled}
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pass" className="text-xs font-medium">
              Password
            </Label>
            <Input
              id="pass"
              type="password"
              {...register("password")}
              disabled={disabled}
              className="text-xs"
            />
          </div>
        </div>

        {/* MongoDB SSL Mode selector */}
        <div className="flex items-center justify-between pt-1">
          <Label
            htmlFor="mongo_ssl_mode"
            className="text-muted-foreground text-xs font-medium"
          >
            SSL / TLS Mode
          </Label>
          <select
            id="mongo_ssl_mode"
            {...register("ssl_mode")}
            disabled={disabled}
            className="border-input bg-background text-foreground h-8 rounded-md border px-2.5 text-xs shadow-xs focus:ring-1"
          >
            <option value="disable">Disable</option>
            <option value="require">Require (TLS/SSL)</option>
            <option value="verify-ca">Verify CA</option>
            <option value="verify-full">Verify Full</option>
            <option value="prefer">Prefer</option>
          </select>
        </div>
      </TabsContent>
    </Tabs>
  )
}
