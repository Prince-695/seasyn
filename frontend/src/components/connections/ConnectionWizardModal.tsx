import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { EngineSelector, EngineIcon } from "./EngineSelector"
import { DiagnosticPingButton } from "./DiagnosticPingButton"
import {
  databaseConnectionSchema,
  type DatabaseConnectionInput,
} from "@/lib/validators"
import { connectionKeys } from "@/lib/queryKeys"
import { projectsApi } from "@/api/projects"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { ENGINE_DEFAULTS, ENGINES } from "@/lib/constants/engines"
import {
  Loader2,
  Plus,
  Database,
  ShieldCheck,
  Globe,
  HardDrive,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import type {
  DBType,
  SSLMode,
  CreateConnectionPayload,
  PublicDatabaseConnection,
  TestConnectionPayload,
} from "@/types"
import { cn } from "@/lib/utils"

interface ConnectionWizardModalProps {
  projectId: string
  onConnectionCreated?: (conn: PublicDatabaseConnection) => void
  trigger?: React.ReactNode
  defaultIsSource?: boolean
}

type WizardStep = 1 | 2 | 3

export function ConnectionWizardModal({
  projectId,
  onConnectionCreated,
  trigger,
  defaultIsSource = true,
}: ConnectionWizardModalProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<WizardStep>(1)
  const [direction, setDirection] = useState<number>(1)
  const queryClient = useQueryClient()
  const { activeOrg } = useWorkspaceStore()
  const [selectedEngine, setSelectedEngine] = useState<DBType>("postgres")
  const [mongoMode, setMongoMode] = useState<"uri" | "params">("uri")
  const [isSourceVal, setIsSourceVal] = useState(defaultIsSource)
  const [quickPasteOpen, setQuickPasteOpen] = useState(false)
  const [quickPasteUri, setQuickPasteUri] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    trigger: triggerValidation,
    formState: { errors },
  } = useForm<DatabaseConnectionInput>({
    resolver: zodResolver(databaseConnectionSchema),
    defaultValues: {
      name: "",
      db_type: "postgres",
      host: "",
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

  // Reset wizard on dialog close
  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setStep(1)
      setDirection(1)
      setQuickPasteOpen(false)
      setQuickPasteUri("")
      reset()
      createMutation.reset()
    }
  }

  // Parse connection URI and populate form fields
  const handleApplyConnectionString = (raw: string) => {
    try {
      const trimmed = raw.trim()
      if (!trimmed) return
      const parsed = new URL(trimmed)
      const protocol = parsed.protocol.replace(":", "").toLowerCase()

      if (protocol.includes("postgres")) setSelectedEngine("postgres")
      else if (protocol.includes("mysql")) setSelectedEngine("mysql")
      else if (protocol.includes("mongo")) {
        setSelectedEngine("mongodb")
        setMongoMode("uri")
        setValue("uri", trimmed)
        return
      }

      if (parsed.hostname) setValue("host", parsed.hostname)
      if (parsed.port) setValue("port", parseInt(parsed.port, 10))
      if (parsed.username)
        setValue("username", decodeURIComponent(parsed.username))
      if (parsed.password)
        setValue("password", decodeURIComponent(parsed.password))
      if (parsed.pathname) {
        const dbName = parsed.pathname.replace(/^\//, "")
        if (dbName) setValue("database", dbName)
      }
      const sslMode = parsed.searchParams.get("sslmode")
      if (
        sslMode &&
        ["disable", "require", "verify-ca", "verify-full", "prefer"].includes(
          sslMode
        )
      ) {
        setValue("ssl_mode", sslMode as SSLMode)
      }
      setQuickPasteOpen(false)
      setQuickPasteUri("")
    } catch {
      // Invalid URL format
    }
  }

  // Extract payload for live diagnostic ping
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
      handleDialogChange(false)
      if (newConn) {
        onConnectionCreated?.(newConn)
      }
    },
  })

  const onSubmit = (data: DatabaseConnectionInput) => {
    createMutation.mutate(data)
  }

  // Step 1 Validation -> Proceed to Step 2
  const handleNextFromStep1 = async () => {
    const isValid = await triggerValidation(["name", "db_type", "is_source"])
    if (isValid) {
      setDirection(1)
      setStep(2)
    }
  }

  // Step 2 Validation -> Proceed to Step 3
  const handleNextFromStep2 = async () => {
    let isValid = false
    if (selectedEngine === "sqlite") {
      isValid = await triggerValidation(["file_path"])
    } else if (selectedEngine === "mongodb") {
      isValid =
        mongoMode === "uri"
          ? await triggerValidation(["uri"])
          : await triggerValidation(["host", "database"])
    } else {
      isValid = await triggerValidation([
        "host",
        "port",
        "database",
        "username",
      ])
    }

    if (isValid) {
      setDirection(1)
      setStep(3)
    }
  }

  const handleBack = () => {
    setDirection(-1)
    setStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : 1))
  }

  const formValues = getValues()
  const selectedEngineMeta = ENGINES.find((e) => e.type === selectedEngine)

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
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
      <DialogContent className="max-w-3xl overflow-hidden p-6 sm:max-w-3xl">
        <DialogHeader className="gap-1 pb-2">
          <div className="flex items-center justify-between">
            <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
              <Database className="h-4 w-4" />
              <span>Database Adapter Setup</span>
            </div>
            {/* Step Progress Tracker */}
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                  step === 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/20 text-primary"
                )}
              >
                1
              </span>
              <div
                className={cn(
                  "h-0.5 w-6 rounded-full transition-colors",
                  step >= 2 ? "bg-primary" : "bg-muted"
                )}
              />
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                  step === 2
                    ? "bg-primary text-primary-foreground"
                    : step > 2
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                2
              </span>
              <div
                className={cn(
                  "h-0.5 w-6 rounded-full transition-colors",
                  step === 3 ? "bg-primary" : "bg-muted"
                )}
              />
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                  step === 3
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                3
              </span>
            </div>
          </div>
          <DialogTitle className="text-lg font-bold">
            {step === 1 && "1. Select Engine & Role"}
            {step === 2 && `2. Configure ${selectedEngineMeta?.name} Adapter`}
            {step === 3 && "3. Verify & Save Connection"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 1 &&
              "Choose the database engine type, name your adapter, and select its synchronization role."}
            {step === 2 &&
              "Enter connection endpoint parameters or paste a connection URI."}
            {step === 3 &&
              "Review adapter configuration and run live diagnostic latency check."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-1">
          <div className="relative min-h-[290px] overflow-hidden">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {/* ── STEP 1: Engine & Role ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="space-y-4 pt-1"
                >
                  {/* Engine Selection in 4-column horizontal cards */}
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      Select Database Engine
                    </Label>
                    <EngineSelector
                      value={selectedEngine}
                      onChange={(engine) => setSelectedEngine(engine)}
                      disabled={createMutation.isPending}
                      className="grid-cols-2 sm:grid-cols-4"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                    {/* Connection Name */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="connName"
                        className="text-xs font-semibold"
                      >
                        Connection Identifier{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="connName"
                        placeholder="e.g. Primary Aurora Postgres"
                        autoComplete="off"
                        {...register("name")}
                        disabled={createMutation.isPending}
                        className="text-xs ring-offset-0"
                      />
                      {errors.name && (
                        <p className="text-destructive text-xs">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    {/* Source vs Target Switcher */}
                    <div className="border-border/70 bg-muted/20 flex items-center justify-between rounded-xl border p-3">
                      <div className="space-y-0.5">
                        <span className="text-foreground text-xs font-semibold">
                          {isSourceVal ? "Source Database" : "Target Database"}
                        </span>
                        <p className="text-muted-foreground text-[11px]">
                          {isSourceVal
                            ? "Read for schema & data introspection."
                            : "Destination for synced schemas & tables."}
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
                </motion.div>
              )}

              {/* ── STEP 2: Connection Credentials ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="space-y-3 pt-1"
                >
                  {/* Quick Paste helper for Relational DBs */}
                  {selectedEngine !== "sqlite" && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium">
                        Credential Parameters
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary h-7 gap-1.5 text-xs font-medium"
                        onClick={() => setQuickPasteOpen(!quickPasteOpen)}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>
                          {quickPasteOpen ? "Hide URI Paste" : "Paste URI"}
                        </span>
                      </Button>
                    </div>
                  )}

                  {quickPasteOpen && (
                    <div className="border-primary/30 bg-primary/5 flex items-center gap-2 rounded-lg border p-2">
                      <Input
                        placeholder={`${selectedEngine}://user:pass@host:port/dbname?sslmode=require`}
                        value={quickPasteUri}
                        onChange={(e) => setQuickPasteUri(e.target.value)}
                        className="bg-background h-8 font-mono text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 shrink-0 text-xs"
                        onClick={() =>
                          handleApplyConnectionString(quickPasteUri)
                        }
                      >
                        Apply
                      </Button>
                    </div>
                  )}

                  {/* Engine Specific Fields */}
                  {selectedEngine === "sqlite" ? (
                    <div className="space-y-2 pt-2">
                      <Label
                        htmlFor="filePath"
                        className="text-xs font-semibold"
                      >
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
                        Specify an absolute file path accessible to the SEASYN
                        worker engine.
                      </p>
                    </div>
                  ) : selectedEngine === "mongodb" ? (
                    <Tabs
                      value={mongoMode}
                      onValueChange={(val) =>
                        setMongoMode(val as "uri" | "params")
                      }
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
                        <Label
                          htmlFor="mongoUri"
                          className="text-xs font-semibold"
                        >
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

                      <TabsContent value="params" className="space-y-2.5 pt-2">
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="col-span-2 space-y-1">
                            <Label
                              htmlFor="host"
                              className="text-xs font-medium"
                            >
                              Host
                            </Label>
                            <Input
                              id="host"
                              placeholder="localhost"
                              {...register("host")}
                              className="text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label
                              htmlFor="port"
                              className="text-xs font-medium"
                            >
                              Port
                            </Label>
                            <Input
                              id="port"
                              type="number"
                              defaultValue={27017}
                              {...register("port", { valueAsNumber: true })}
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
                              className="text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label
                              htmlFor="user"
                              className="text-xs font-medium"
                            >
                              Username
                            </Label>
                            <Input
                              id="user"
                              placeholder="admin"
                              {...register("username")}
                              className="text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label
                              htmlFor="pass"
                              className="text-xs font-medium"
                            >
                              Password
                            </Label>
                            <Input
                              id="pass"
                              type="password"
                              {...register("password")}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    /* PostgreSQL & MySQL Form */
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-4 gap-2.5">
                        <div className="col-span-3 space-y-1">
                          <Label
                            htmlFor="host"
                            className="text-xs font-semibold"
                          >
                            Host Address{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <div className="relative">
                            <Globe className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                              id="host"
                              placeholder="ep-example.neon.tech or 127.0.0.1"
                              {...register("host")}
                              className="pl-9 font-mono text-xs"
                              disabled={createMutation.isPending}
                            />
                          </div>
                        </div>

                        <div className="col-span-1 space-y-1">
                          <Label
                            htmlFor="port"
                            className="text-xs font-semibold"
                          >
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

                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="space-y-1">
                          <Label
                            htmlFor="database"
                            className="text-xs font-semibold"
                          >
                            Database Name{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="database"
                            placeholder="neondb"
                            {...register("database")}
                            className="font-mono text-xs"
                            disabled={createMutation.isPending}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="username"
                            className="text-xs font-semibold"
                          >
                            Username <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="username"
                            placeholder="neondb_owner"
                            {...register("username")}
                            className="font-mono text-xs"
                            disabled={createMutation.isPending}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="password"
                            className="text-xs font-semibold"
                          >
                            Password
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••••••"
                            {...register("password")}
                            disabled={createMutation.isPending}
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
                  )}
                </motion.div>
              )}

              {/* ── STEP 3: Review & Test Diagnostics ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="space-y-3 pt-1"
                >
                  {/* Summary Card */}
                  <div className="border-border/70 bg-card rounded-xl border p-3.5">
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <div className="border-border/60 bg-muted/40 flex h-7 w-7 items-center justify-center rounded-lg border">
                          <EngineIcon
                            type={selectedEngine}
                            className="h-4 w-4"
                          />
                        </div>
                        <div>
                          <span className="text-foreground text-xs font-semibold">
                            {formValues.name || "Unnamed Connection"}
                          </span>
                          <span className="text-muted-foreground ml-2 text-[11px]">
                            ({selectedEngineMeta?.name})
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase",
                          isSourceVal
                            ? "bg-primary/10 text-primary border-primary/20 border"
                            : "border-success/20 bg-success/10 text-success border"
                        )}
                      >
                        {isSourceVal ? "Source" : "Target"}
                      </span>
                    </div>

                    <div className="border-border/60 divide-border/50 divide-y border-t pt-1 font-mono text-xs">
                      <div className="flex items-start justify-between py-1.5">
                        <span className="text-muted-foreground w-24 shrink-0 text-[11px] font-medium">
                          Endpoint
                        </span>
                        <span className="text-foreground max-w-[75%] text-right text-[11px] font-medium break-all">
                          {selectedEngine === "sqlite"
                            ? formValues.file_path || "-"
                            : selectedEngine === "mongodb" &&
                                mongoMode === "uri"
                              ? formValues.uri || "-"
                              : `${formValues.host || "localhost"}:${formValues.port || 5432}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-muted-foreground w-24 shrink-0 text-[11px] font-medium">
                          Database
                        </span>
                        <span className="text-foreground text-[11px] font-medium">
                          {formValues.database || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-muted-foreground w-24 shrink-0 text-[11px] font-medium">
                          User
                        </span>
                        <span className="text-foreground text-[11px] font-medium">
                          {formValues.username || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-muted-foreground w-24 shrink-0 text-[11px] font-medium">
                          SSL Mode
                        </span>
                        <span className="text-foreground text-[11px] font-medium">
                          {formValues.ssl_mode || "disable"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Diagnostics Card */}
                  <div className="border-border/70 bg-card rounded-xl border p-3.5">
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <ShieldCheck className="text-primary h-4 w-4" />
                        <span>Live Connection Diagnostic</span>
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
                    <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border p-2.5 text-xs">
                      {createMutation.error instanceof Error
                        ? createMutation.error.message
                        : "Failed to save database connection."}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons Footer */}
          <div className="border-border/60 flex items-center justify-between border-t pt-4">
            <div>
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  disabled={createMutation.isPending}
                  className="gap-1.5 text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDialogChange(false)}
                  disabled={createMutation.isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step === 1 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNextFromStep1}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <span>Next: Credentials</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}

              {step === 2 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNextFromStep2}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <span>Next: Test & Save</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}

              {step === 3 && (
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  <span>Save Connection</span>
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
