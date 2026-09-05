import { useQuery } from "@tanstack/react-query"
import { Sparkles, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EngineIcon } from "@/components/connections/EngineIcon"
import { schemaApi } from "@/api/schema"
import { schemaKeys } from "@/lib/queryKeys"
import { getDatabaseTerminology } from "@/lib/constants/databaseViewers"
import type { PublicDatabaseConnection } from "@/types"

interface Step2TargetSelectionProps {
  orgId: string
  projectId: string
  connections: PublicDatabaseConnection[]
  sourceConnId: string
  selectedConnId: string
  targetTable: string
  onSelectConnection: (connId: string) => void
  onChangeTargetTable: (tableName: string) => void
}

export function Step2TargetSelection({
  orgId,
  projectId,
  connections,
  sourceConnId,
  selectedConnId,
  targetTable,
  onSelectConnection,
  onChangeTargetTable,
}: Step2TargetSelectionProps) {
  // Filter out source connection so user cannot select the same database
  const availableTargetConnections = connections.filter(
    (c) => c.id !== sourceConnId
  )

  const activeTargetConn = connections.find((c) => c.id === selectedConnId)
  const terminology = getDatabaseTerminology(activeTargetConn?.db_type)

  // Introspect target database schema to detect whether destination table exists
  const { data: targetSchema } = useQuery({
    queryKey: schemaKeys.database(orgId, projectId, selectedConnId),
    queryFn: async () => {
      if (!selectedConnId) return null
      const res = await schemaApi.getSchema(orgId, projectId, selectedConnId)
      return res.data || null
    },
    enabled: !!orgId && !!projectId && !!selectedConnId,
  })

  const existingTargetTables = targetSchema?.tables || []
  const isTableExisting =
    !!targetTable &&
    existingTargetTables.some(
      (t) => t.name.toLowerCase() === targetTable.trim().toLowerCase()
    )

  return (
    <div className="space-y-6">
      {/* 1. Target Database Connection Picker */}
      <div className="space-y-2">
        <Label
          htmlFor="targetConn"
          className="text-foreground text-xs font-semibold"
        >
          1. Select Destination Database Connection
        </Label>
        <p className="text-muted-foreground text-xs">
          Choose the destination engine where the replicated data will be
          written.
        </p>

        {availableTargetConnections.length === 0 ? (
          <div className="border-border/60 bg-muted/20 text-muted-foreground flex items-center gap-2 rounded-xl border p-4 text-xs">
            <AlertCircle className="text-warning h-4 w-4" />
            <span>
              At least two registered connections are required for
              cross-database migration. Please register a target database first.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {availableTargetConnections.map((conn) => {
              const isSelected = conn.id === selectedConnId
              return (
                <Button
                  key={conn.id}
                  type="button"
                  variant="ghost"
                  onClick={() => onSelectConnection(conn.id)}
                  className={`flex h-auto w-full cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border/70 bg-card hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <EngineIcon engine={conn.db_type} className="h-5 w-5" />
                    <div>
                      <p className="text-foreground text-xs font-semibold">
                        {conn.name}
                      </p>
                      <p className="text-muted-foreground font-mono text-[11px]">
                        {conn.database || conn.host || conn.db_type}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] uppercase"
                  >
                    {conn.db_type}
                  </Badge>
                </Button>
              )
            })}
          </div>
        )}
      </div>

      {/* 2. Destination Table Name */}
      {selectedConnId && (
        <div className="space-y-2 pt-2">
          <Label
            htmlFor="targetTableName"
            className="text-foreground text-xs font-semibold"
          >
            2. Destination {terminology.entitySingular} Name
          </Label>
          <p className="text-muted-foreground text-xs">
            Specify the destination name. It can match the source name or be
            custom.
          </p>

          <div className="relative max-w-md">
            <Input
              id="targetTableName"
              value={targetTable}
              onChange={(e) => onChangeTargetTable(e.target.value)}
              placeholder="e.g. users, customer_records"
              className="font-mono text-xs"
            />
          </div>

          {/* Auto-DDL vs Existing Table Intelligence Badge */}
          {targetTable.trim().length > 0 && (
            <div className="mt-3">
              {isTableExisting ? (
                <div className="border-info/30 bg-info/10 text-info flex items-center gap-2.5 rounded-xl border p-3.5 text-xs">
                  <CheckCircle2 className="text-info h-4 w-4 shrink-0" />
                  <div>
                    <span className="font-semibold">
                      Existing {terminology.entitySingular} Detected:{" "}
                    </span>
                    <span className="text-info/90">
                      "{targetTable}" already exists in {activeTargetConn?.name}
                      . Streamed records will be appended or upserted into this
                      table.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border-success/30 bg-success/10 text-success flex items-center gap-2.5 rounded-xl border p-3.5 text-xs">
                  <Sparkles className="text-success h-4 w-4 shrink-0" />
                  <div>
                    <span className="font-semibold">
                      Automatic Schema DDL Active:{" "}
                    </span>
                    <span className="text-success/90">
                      "{targetTable}" does not exist in {activeTargetConn?.name}
                      . SeaSyn will automatically generate and execute the
                      target table DDL before streaming begins.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cross-Engine compatibility hint */}
      {activeTargetConn && (
        <div className="border-border/60 bg-muted/20 text-muted-foreground flex items-start gap-2.5 rounded-xl border p-3.5 text-xs">
          <Info className="text-primary mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-relaxed">
            SeaSyn automatically handles cross-engine data type conversions
            (e.g. UUID to String, JSONB to BSON, Timestamps to ISO-8601).
          </p>
        </div>
      )}
    </div>
  )
}
