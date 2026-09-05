import { useQuery } from "@tanstack/react-query"
import {
  Database,
  Table as TableIcon,
  Layers,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EngineIcon } from "@/components/connections/EngineIcon"
import { schemaApi } from "@/api/schema"
import { schemaKeys } from "@/lib/queryKeys"
import { getDatabaseTerminology } from "@/lib/constants/databaseViewers"
import type { PublicDatabaseConnection } from "@/types"

interface Step1SourceSelectionProps {
  orgId: string
  projectId: string
  connections: PublicDatabaseConnection[]
  selectedConnId: string
  selectedTable: string
  onSelectConnection: (connId: string) => void
  onSelectTable: (tableName: string) => void
}

export function Step1SourceSelection({
  orgId,
  projectId,
  connections,
  selectedConnId,
  selectedTable,
  onSelectConnection,
  onSelectTable,
}: Step1SourceSelectionProps) {
  const activeConn = connections.find((c) => c.id === selectedConnId)
  const terminology = getDatabaseTerminology(activeConn?.db_type)

  // Introspect live database schema for the selected source connection
  const {
    data: schema,
    isLoading: isSchemaLoading,
    error: schemaError,
  } = useQuery({
    queryKey: schemaKeys.database(orgId, projectId, selectedConnId),
    queryFn: async () => {
      if (!selectedConnId) return null
      const res = await schemaApi.getSchema(orgId, projectId, selectedConnId)
      return res.data || null
    },
    enabled: !!orgId && !!projectId && !!selectedConnId,
  })

  const tables = schema?.tables || []
  const activeTableObj = tables.find((t) => t.name === selectedTable)

  return (
    <div className="space-y-6">
      {/* 1. Source Database Connection Picker */}
      <div className="space-y-2">
        <Label
          htmlFor="sourceConn"
          className="text-foreground text-xs font-semibold"
        >
          1. Select Source Database Connection
        </Label>
        <p className="text-muted-foreground text-xs">
          Choose the origin database to stream data from.
        </p>

        {connections.length === 0 ? (
          <div className="border-border/60 bg-muted/20 text-muted-foreground flex items-center gap-2 rounded-xl border p-4 text-xs">
            <AlertCircle className="text-warning h-4 w-4" />
            <span>
              No database connections registered in this project. Please add a
              connection first.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {connections.map((conn) => {
              const isSelected = conn.id === selectedConnId
              return (
                <Button
                  key={conn.id}
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    onSelectConnection(conn.id)
                    onSelectTable("")
                  }}
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

      {/* 2. Source Table / Collection Picker */}
      {selectedConnId && (
        <div className="space-y-2 pt-2">
          <Label
            htmlFor="sourceTable"
            className="text-foreground text-xs font-semibold"
          >
            2. Select Source {terminology.entitySingular}
          </Label>
          <p className="text-muted-foreground text-xs">
            Introspected from {activeConn?.name}: choose the specific{" "}
            {terminology.entitySingular.toLowerCase()} to replicate.
          </p>

          {isSchemaLoading ? (
            <div className="border-border/60 bg-muted/20 text-muted-foreground flex items-center justify-center gap-2 rounded-xl border py-8 text-xs">
              <Loader2 className="text-primary h-4 w-4 animate-spin" />
              <span>Introspecting schema and table records...</span>
            </div>
          ) : schemaError ? (
            <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-xl border p-4 text-xs">
              <AlertCircle className="h-4 w-4" />
              <span>
                Failed to introspect tables for this connection. Please verify
                connection credentials.
              </span>
            </div>
          ) : tables.length === 0 ? (
            <div className="border-border/60 bg-muted/20 text-muted-foreground flex items-center gap-2 rounded-xl border p-4 text-xs">
              <Database className="h-4 w-4" />
              <span>
                No {terminology.entityPlural.toLowerCase()} found in this
                database.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {tables.map((t) => {
                const isSelected = t.name === selectedTable
                return (
                  <Button
                    key={t.name}
                    type="button"
                    variant="ghost"
                    onClick={() => onSelectTable(t.name)}
                    className={`flex h-auto w-full cursor-pointer items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs"
                        : "border-border/70 bg-card hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <TableIcon className="text-primary/70 h-4 w-4 shrink-0" />
                      <span className="text-foreground truncate font-mono text-xs font-semibold">
                        {t.name}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px]"
                      >
                        {t.row_count.toLocaleString()}{" "}
                        {terminology.recordPlural.toLowerCase()}
                      </Badge>
                    </div>
                  </Button>
                )
              })}
            </div>
          )}

          {/* Selected Table Overview Strip */}
          {activeTableObj && (
            <div className="border-border/60 bg-muted/20 mt-3 flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Layers className="text-primary h-4 w-4" />
                <span className="text-foreground font-mono font-semibold">
                  {activeTableObj.name}
                </span>
                <span className="text-muted-foreground">
                  ({activeTableObj.columns.length} columns)
                </span>
              </div>
              <span className="text-foreground font-mono font-semibold">
                Est. {activeTableObj.row_count.toLocaleString()} rows to stream
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
