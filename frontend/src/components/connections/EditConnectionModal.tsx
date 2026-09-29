import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  Loader2,
  Save,
  Radio,
  Server,
  X,
  SlidersHorizontal,
  Activity,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { EngineIcon } from "./EngineSelector"
import { RelationalForm } from "./forms/RelationalForm"
import { MongoForm } from "./forms/MongoForm"
import { SqliteForm } from "./forms/SqliteForm"
import { DiagnosticPingButton } from "./DiagnosticPingButton"
import { projectsApi } from "@/api/projects"
import { connectionKeys, schemaKeys } from "@/lib/queryKeys"
import { useWorkspaceStore } from "@/store/workspaceStore"
import {
  databaseConnectionSchema,
  type DatabaseConnectionInput,
} from "@/lib/validators"
import { getErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import type {
  PublicDatabaseConnection,
  UpdateConnectionPayload,
  TestConnectionPayload,
  SSLMode,
} from "@/types"
import type { MongoMode } from "@/hooks/useConnectionWizard"

export interface EditConnectionModalProps {
  connection: PublicDatabaseConnection
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnectionUpdated?: (conn: PublicDatabaseConnection) => void
}

interface EditConnectionFormProps {
  connection: PublicDatabaseConnection
  onClose: () => void
  onConnectionUpdated?: (conn: PublicDatabaseConnection) => void
}

function EditConnectionForm({
  connection,
  onClose,
  onConnectionUpdated,
}: EditConnectionFormProps) {
  const queryClient = useQueryClient()
  const { activeOrg } = useWorkspaceStore()
  const orgId = activeOrg?.id || ""

  const [mongoMode, setMongoMode] = useState<MongoMode>(
    connection.db_type === "mongodb" && (connection as { uri?: string }).uri
      ? "uri"
      : "params"
  )
  const [showMongoUri, setShowMongoUri] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSourceVal, setIsSourceVal] = useState<boolean>(connection.is_source)

  const form = useForm<DatabaseConnectionInput>({
    resolver: zodResolver(databaseConnectionSchema),
    defaultValues: {
      name: connection.name,
      db_type: connection.db_type,
      host: connection.host || "",
      port: connection.port,
      database: connection.database || "",
      username: connection.username || "",
      password: "",
      ssl_mode: connection.ssl_mode || "disable",
      file_path: connection.file_path || "",
      uri: (connection as { uri?: string }).uri || "",
      is_source: connection.is_source,
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateConnectionPayload) => {
      if (!orgId) {
        throw new Error("Missing active organization context.")
      }
      const res = await projectsApi.updateConnection(
        orgId,
        connection.project_id,
        connection.id,
        payload
      )
      return res.data
    },
    onSuccess: (updated) => {
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: connectionKeys.list(orgId, connection.project_id),
        })
        queryClient.invalidateQueries({
          queryKey: connectionKeys.all,
        })
        queryClient.invalidateQueries({
          queryKey: schemaKeys.all,
        })
      }
      onClose()
      if (updated) {
        onConnectionUpdated?.(updated)
      }
    },
    onError: (err) => {
      setSubmitError(
        getErrorMessage(err, "Failed to update database connection.")
      )
    },
  })

  const getTestPayload = (): TestConnectionPayload => {
    const values = form.getValues()

    if (connection.db_type === "sqlite") {
      return {
        db_type: "sqlite",
        file_path: values.file_path,
      }
    }

    if (connection.db_type === "mongodb" && mongoMode === "uri") {
      const isSrv = values.uri?.startsWith("mongodb+srv://")
      return {
        db_type: "mongodb",
        uri: values.uri,
        ssl_mode: isSrv ? "require" : (values.ssl_mode as SSLMode | undefined),
        database: values.database,
      }
    }

    return {
      db_type: connection.db_type,
      host: values.host,
      port: values.port,
      database: values.database,
      username: values.username,
      password: values.password || undefined,
      ssl_mode: values.ssl_mode as SSLMode | undefined,
      file_path: values.file_path,
      uri: connection.db_type === "mongodb" ? values.uri : undefined,
    }
  }

  const onSubmit = (data: DatabaseConnectionInput) => {
    setSubmitError(null)

    const payload: UpdateConnectionPayload = {
      name: data.name.trim(),
      is_source: Boolean(data.is_source),
      host: data.host,
      port: data.port,
      database: data.database,
      username: data.username,
      ssl_mode: data.ssl_mode as SSLMode | undefined,
      file_path: data.file_path,
      uri: data.uri,
    }

    // Only include password if user explicitly typed a new one
    if (data.password && data.password.trim().length > 0) {
      payload.password = data.password.trim()
    }

    if (connection.db_type === "sqlite") {
      delete payload.host
      delete payload.port
      delete payload.database
      delete payload.username
      delete payload.password
      delete payload.ssl_mode
      delete payload.uri
    } else if (connection.db_type === "mongodb" && mongoMode === "uri") {
      delete payload.host
      delete payload.port
      delete payload.username
      delete payload.password
      if (payload.uri?.startsWith("mongodb+srv://")) {
        payload.ssl_mode = "require"
      }
    }

    updateMutation.mutate(payload)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex h-full flex-col overflow-hidden"
    >
      {/* ─── Top Header Bar ────────────────────────────────────────────── */}
      <DialogHeader className="border-border/70 bg-muted/20 shrink-0 border-b px-6 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="border-border/80 bg-card flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border p-1.5 shadow-2xs">
              <EngineIcon type={connection.db_type} className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-foreground flex items-center gap-2 text-sm font-medium">
                <span>Edit Database Connection</span>
                <Badge
                  variant="outline"
                  className="border-border bg-muted/50 px-1.5 py-0 font-mono text-[10px] font-medium uppercase"
                >
                  {connection.db_type}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground line-clamp-1 text-xs">
                Update connection parameters, credentials, and telemetry for{" "}
                <span className="text-foreground font-medium">
                  {connection.name}
                </span>
              </DialogDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground h-7 w-7 rounded-md p-0"
            title="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogHeader>

      {/* ─── Horizontal 2-Column Content Body ─────────────────────────── */}
      <div className="divide-border/60 min-h-0 flex-1 divide-y overflow-hidden md:grid md:grid-cols-12 md:divide-x md:divide-y-0">
        {/* Left Column: Identity, Role & Live Diagnostic Area */}
        <div className="bg-muted/10 flex flex-col justify-between overflow-y-auto p-5 md:col-span-5">
          <div className="space-y-4">
            {/* Section Header */}
            <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium uppercase">
              <SlidersHorizontal className="text-primary h-3.5 w-3.5" />
              <span>General Settings</span>
            </div>

            {/* Connection Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="conn-name"
                className="text-foreground text-xs font-medium"
              >
                Connection Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="conn-name"
                placeholder="Production Database"
                {...register("name")}
                className="bg-background h-8.5 text-xs"
                disabled={updateMutation.isPending}
              />
              {errors.name && (
                <p className="text-destructive text-[11px]">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Pipeline Role Selector */}
            <div className="space-y-1.5">
              <Label className="text-foreground flex items-center justify-between text-xs font-medium">
                <span>Pipeline Role</span>
                <span className="text-muted-foreground text-[11px]">
                  {isSourceVal
                    ? "Reads schema & data"
                    : "Receives migration data"}
                </span>
              </Label>
              <div className="border-border bg-background grid grid-cols-2 gap-1 rounded-lg border p-1 shadow-2xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsSourceVal(true)
                    setValue("is_source", true)
                  }}
                  className={cn(
                    "flex h-7 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all",
                    isSourceVal
                      ? "border-info/30 bg-info/10 text-info border font-medium shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Radio className="h-3 w-3" />
                  <span>Source DB</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsSourceVal(false)
                    setValue("is_source", false)
                  }}
                  className={cn(
                    "flex h-7 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all",
                    !isSourceVal
                      ? "border-success/30 bg-success/10 text-success border font-medium shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Server className="h-3 w-3" />
                  <span>Target DB</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Dedicated Diagnostic & Health Check Box */}
          <div className="border-border/70 bg-card mt-4 rounded-xl border p-3.5 shadow-2xs">
            <div className="text-muted-foreground mb-2 flex items-center justify-between text-[11px] font-medium uppercase">
              <span className="flex items-center gap-1.5">
                <Activity className="text-primary h-3.5 w-3.5" />
                <span>Diagnostic Ping</span>
              </span>
              <span className="text-muted-foreground font-mono text-[10px]">
                LIVE TEST
              </span>
            </div>

            <p className="text-muted-foreground mb-3 text-[11px] leading-relaxed">
              Verify database connectivity, network firewalls, and credentials
              prior to saving changes.
            </p>

            <DiagnosticPingButton
              getPayload={getTestPayload}
              size="sm"
              className="h-8 w-full text-xs"
            />
          </div>
        </div>

        {/* Right Column: Endpoint Configuration & Credentials */}
        <div className="flex flex-col justify-between overflow-y-auto p-5 md:col-span-7">
          <div className="space-y-3">
            <div className="text-muted-foreground flex items-center justify-between text-[11px] font-medium uppercase">
              <span>Endpoint & Credentials</span>
              {connection.ssl_mode && connection.ssl_mode !== "disable" && (
                <span className="text-success font-mono text-[10px] font-medium">
                  SSL {connection.ssl_mode}
                </span>
              )}
            </div>

            {/* Engine-specific Credentials Form */}
            {connection.db_type === "sqlite" ? (
              <SqliteForm form={form} disabled={updateMutation.isPending} />
            ) : connection.db_type === "mongodb" ? (
              <MongoForm
                form={form}
                mongoMode={mongoMode}
                setMongoMode={setMongoMode}
                showMongoUri={showMongoUri}
                setShowMongoUri={setShowMongoUri}
                disabled={updateMutation.isPending}
              />
            ) : (
              <div className="space-y-1.5">
                <RelationalForm
                  form={form}
                  selectedEngine={connection.db_type}
                  disabled={updateMutation.isPending}
                />
                <p className="text-muted-foreground/80 px-1 text-[10px]">
                  Leave password blank to preserve existing encrypted
                  credentials.
                </p>
              </div>
            )}

            {/* Validation & Error banners */}
            {(submitError || errors.host) && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive mt-3 flex items-start gap-2 rounded-lg border p-2.5 text-xs">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError || errors.host?.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Footer Bar ────────────────────────────────────────── */}
      <div className="border-border/70 bg-muted/10 shrink-0 border-t px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground hidden items-center gap-2 text-xs sm:flex">
            <Server className="h-3.5 w-3.5 opacity-60" />
            <span className="font-mono text-[11px]">
              ID: {connection.id.slice(0, 8)}...
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="h-8.5 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
              className="h-8.5 gap-1.5 text-xs font-medium shadow-xs"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

export function EditConnectionModal({
  connection,
  open,
  onOpenChange,
  onConnectionUpdated,
}: EditConnectionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card h-135 max-h-[90vh] w-215 max-w-[95vw] overflow-hidden p-0 sm:max-w-none">
        {open && (
          <EditConnectionForm
            connection={connection}
            onClose={() => onOpenChange(false)}
            onConnectionUpdated={onConnectionUpdated}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
