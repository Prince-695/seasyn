import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { EngineSelector } from "./EngineSelector"
import { DiagnosticPingButton } from "./DiagnosticPingButton"
import {
  databaseConnectionSchema,
  type DatabaseConnectionInput,
} from "@/lib/validators"
import { connectionKeys } from "@/lib/queryKeys"
import { projectsApi } from "@/api/projects"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { ENGINE_DEFAULTS } from "@/lib/constants/engines"
import {
  Loader2,
  Plus,
  Database,
  ShieldCheck,
  Globe,
  HardDrive,
} from "lucide-react"
import type {
  DBType,
  SSLMode,
  CreateConnectionPayload,
  PublicDatabaseConnection,
  TestConnectionPayload,
} from "@/types"

interface ConnectionWizardModalProps {
  projectId: string
  onConnectionCreated?: (conn: PublicDatabaseConnection) => void
  trigger?: React.ReactNode
  defaultIsSource?: boolean
}

export function ConnectionWizardModal({
  projectId,
  onConnectionCreated,
  trigger,
  defaultIsSource = true,
}: ConnectionWizardModalProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { activeOrg } = useWorkspaceStore()
  const [selectedEngine, setSelectedEngine] = useState<DBType>("postgres")
  const [mongoMode, setMongoMode] = useState<"uri" | "params">("uri")

  const [isSourceVal, setIsSourceVal] = useState(defaultIsSource)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<DatabaseConnectionInput>({
    resolver: zodResolver(databaseConnectionSchema),
    defaultValues: {
      name: "",
      db_type: "postgres",
      host: "localhost",
      port: 5432,
      database: "",
      username: "",
      password: "",
      ssl_mode: "disable",
      file_path: "",
      uri: "",
      is_source: defaultIsSource,
    },
  })

  // Synchronize db_type and apply engine-specific presets from centralized constants
  useEffect(() => {
    setValue("db_type", selectedEngine)
    const defaults = ENGINE_DEFAULTS[selectedEngine]
    if (defaults.port) setValue("port", defaults.port)
    if (defaults.ssl_mode) setValue("ssl_mode", defaults.ssl_mode as SSLMode)
    if (selectedEngine === "sqlite") {
      setValue("file_path", "/data/database.db")
    }
  }, [selectedEngine, setValue])

  // Function to extract current payload for live diagnostic ping test
  const getTestPayload = (): TestConnectionPayload => {
    const values = getValues()
    return {
      db_type: selectedEngine,
      host: values.host,
      port: values.port,
      database: values.database,
      username: values.username,
      password: values.password,
      ssl_mode: values.ssl_mode as SSLMode | undefined,
      file_path: values.file_path,
      uri: values.uri,
    }
  }

  const createMutation = useMutation({
    mutationFn: async (data: CreateConnectionPayload) => {
      if (!activeOrg?.id) throw new Error("No active organization selected")
      const res = await projectsApi.createConnection(
        activeOrg.id,
        projectId,
        data
      )
      return res.data
    },
    onSuccess: (newConn) => {
      if (activeOrg?.id) {
        queryClient.invalidateQueries({
          queryKey: connectionKeys.list(activeOrg.id, projectId),
        })
      }
      setOpen(false)
      reset()
      if (newConn) {
        onConnectionCreated?.(newConn)
      }
    },
  })

  const onSubmit = (data: DatabaseConnectionInput) => {
    createMutation.mutate(data)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          reset()
          createMutation.reset()
        }
      }}
    >
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button className="gap-2 font-semibold">
              <Plus className="h-4 w-4" />
              <span>Add Database Connection</span>
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
            <Database className="h-4 w-4" />
            <span>Database Adapter Setup</span>
          </div>
          <DialogTitle className="text-xl">
            Configure Database Connection
          </DialogTitle>
          <DialogDescription>
            Register a source or target database adapter. Passwords are sent
            directly for AES-256 encryption and are never stored in browser
            state.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          {/* Step 1: Engine Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              1. Select Database Engine
            </Label>
            <EngineSelector
              value={selectedEngine}
              onChange={(engine) => setSelectedEngine(engine)}
              disabled={createMutation.isPending}
            />
          </div>

          {/* Step 2: Connection Parameters */}
          <div className="border-border/70 bg-card space-y-4 rounded-xl border p-4">
            <Label className="text-xs font-semibold">
              2. Connection Credentials & Target
            </Label>

            {/* Connection Name */}
            <div className="space-y-1.5">
              <Label htmlFor="connName" className="text-xs font-medium">
                Connection Identifier{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="connName"
                placeholder="e.g. Primary Aurora Postgres"
                {...register("name")}
                disabled={createMutation.isPending}
              />
              {errors.name && (
                <p className="text-destructive text-xs">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Dynamic fields based on engine */}
            {selectedEngine === "sqlite" ? (
              /* SQLite File Path Form */
              <div className="space-y-1.5">
                <Label htmlFor="filePath" className="text-xs font-medium">
                  SQLite Database File Path{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <HardDrive className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="filePath"
                    placeholder="/var/data/production.db or app.db"
                    {...register("file_path")}
                    className="pl-9 font-mono text-xs"
                    disabled={createMutation.isPending}
                  />
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Specify an absolute file path accessible to the SEASYN worker
                  engine.
                </p>
              </div>
            ) : selectedEngine === "mongodb" ? (
              /* MongoDB Form (URI vs Parameters with Tabs) */
              <div className="space-y-3">
                <Tabs
                  value={mongoMode}
                  onValueChange={(val) => setMongoMode(val as "uri" | "params")}
                  className="w-full"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">
                      Configuration Method
                    </span>
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="uri">Connection URI</TabsTrigger>
                      <TabsTrigger value="params">Parameters</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="uri" className="space-y-1.5 pt-2">
                    <Label htmlFor="mongoUri" className="text-xs font-medium">
                      MongoDB Connection URI{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="mongoUri"
                      type="password"
                      placeholder="mongodb+srv://user:password@cluster.mongodb.net/database"
                      {...register("uri")}
                      className="font-mono text-xs"
                      disabled={createMutation.isPending}
                    />
                  </TabsContent>

                  <TabsContent value="params" className="pt-2">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="host" className="text-xs font-medium">
                          Host
                        </Label>
                        <Input
                          id="host"
                          placeholder="localhost"
                          {...register("host")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="port" className="text-xs font-medium">
                          Port
                        </Label>
                        <Input
                          id="port"
                          type="number"
                          defaultValue={27017}
                          {...register("port", { valueAsNumber: true })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="db" className="text-xs font-medium">
                          Database
                        </Label>
                        <Input
                          id="db"
                          placeholder="main_db"
                          {...register("database")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="user" className="text-xs font-medium">
                          Username
                        </Label>
                        <Input
                          id="user"
                          placeholder="admin"
                          {...register("username")}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="pass" className="text-xs font-medium">
                          Password
                        </Label>
                        <Input
                          id="pass"
                          type="password"
                          {...register("password")}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              /* PostgreSQL and MySQL Standard Form */
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="host" className="text-xs font-medium">
                      Host Address <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Globe className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                      <Input
                        id="host"
                        placeholder="db.production.internal or 127.0.0.1"
                        {...register("host")}
                        className="pl-9 font-mono text-xs"
                        disabled={createMutation.isPending}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="port" className="text-xs font-medium">
                      Port <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="port"
                      type="number"
                      placeholder={
                        selectedEngine === "postgres" ? "5432" : "3306"
                      }
                      {...register("port", { valueAsNumber: true })}
                      className="font-mono text-xs"
                      disabled={createMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="database" className="text-xs font-medium">
                    Database Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="database"
                    placeholder="e.g. seasyn_production"
                    {...register("database")}
                    className="font-mono text-xs"
                    disabled={createMutation.isPending}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs font-medium">
                      Database User <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="username"
                      placeholder="postgres"
                      {...register("username")}
                      className="font-mono text-xs"
                      disabled={createMutation.isPending}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••••••"
                      {...register("password")}
                      disabled={createMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Source vs Target Switcher */}
            <div className="border-border/60 bg-muted/20 flex items-center justify-between rounded-lg border p-3 pt-2">
              <div className="space-y-0.5">
                <span className="text-foreground text-xs font-semibold">
                  {isSourceVal
                    ? "Source Database"
                    : "Target / Destination Database"}
                </span>
                <p className="text-muted-foreground text-[11px]">
                  {isSourceVal
                    ? "Data will be introspected and read from this database."
                    : "Data and converted schemas will be synced into this database."}
                </p>
              </div>
              <Switch
                checked={isSourceVal}
                onCheckedChange={(checked) => {
                  setIsSourceVal(checked)
                  setValue("is_source", checked)
                }}
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          {/* Step 3: Diagnostic Latency Test */}
          <div className="border-border/70 bg-card space-y-2 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <ShieldCheck className="text-primary h-4 w-4" />
                <span>3. Live Connection Diagnostics</span>
              </div>
              <span className="text-muted-foreground text-[10px]">
                Recommended before saving
              </span>
            </div>

            <DiagnosticPingButton
              getPayload={getTestPayload}
              projectId={projectId}
              size="sm"
            />
          </div>

          {/* Server Error Alert */}
          {createMutation.isError && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border p-3 text-xs">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to save database connection."}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="gap-2"
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>Save Connection</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
