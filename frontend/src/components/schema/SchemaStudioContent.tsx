import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Server, ArrowRightLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  TableStructureView,
  DatabaseDataViewer,
  SchemaDiffViewer,
} from "@/components/schema"
import type { StudioTab } from "@/hooks/useSchemaExplorer"
import type { getDatabaseTerminology } from "@/lib/constants/databaseViewers"
import type {
  ColumnSchema,
  QueryResult,
  SchemaDiff,
  TableSchema,
  TableRowQueryParams,
} from "@/types/schema"
import type { PublicDatabaseConnection } from "@/types"

interface SchemaStudioContentProps {
  connections: PublicDatabaseConnection[]
  isConnectionsLoading: boolean
  activeConnection: PublicDatabaseConnection | null
  targetConnection: PublicDatabaseConnection | null
  activeTab: StudioTab
  setActiveTab: (tab: StudioTab) => void
  effectiveTableName: string | null
  activeTable: TableSchema | null
  queryResult: QueryResult | null
  isRowsLoading: boolean
  isDiffLoading: boolean
  schemaDiff: SchemaDiff | null
  terminology: ReturnType<typeof getDatabaseTerminology>
  onRefreshRows: () => void
  setQueryParams: React.Dispatch<React.SetStateAction<TableRowQueryParams>>
  onUpdateCell: (
    row: Record<string, unknown>,
    col: ColumnSchema,
    newVal: unknown
  ) => Promise<void>
  onUpdateRow: (
    row: Record<string, unknown>,
    updatedRow: Record<string, unknown>
  ) => Promise<void>
  onDeleteRow: (pkValues: Record<string, unknown>) => Promise<void>
  onInsertRow: (rowData: Record<string, unknown>) => Promise<void>
}

export function SchemaStudioContent({
  connections,
  isConnectionsLoading,
  activeConnection,
  targetConnection,
  activeTab,
  setActiveTab,
  effectiveTableName,
  activeTable,
  queryResult,
  isRowsLoading,
  isDiffLoading,
  schemaDiff,
  terminology,
  onRefreshRows,
  setQueryParams,
  onUpdateCell,
  onUpdateRow,
  onDeleteRow,
  onInsertRow,
}: SchemaStudioContentProps) {
  if (connections.length === 0 && !isConnectionsLoading) {
    return (
      <div className="border-border/80 bg-muted/10 flex h-full flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
        <Server className="text-muted-foreground/60 mb-3 h-10 w-10" />
        <h3 className="text-foreground text-sm font-medium">
          No Database Connections Configured
        </h3>
        <p className="text-muted-foreground mt-1 max-w-sm text-xs">
          To inspect schemas and edit live rows, connect a PostgreSQL, MySQL,
          MongoDB, or SQLite database.
        </p>
        <Link to="/connections" className="mt-4">
          <Button size="sm" className="gap-1.5 text-xs font-medium shadow-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Configure Connection</span>
          </Button>
        </Link>
      </div>
    )
  }

  if (!activeConnection) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
        Select a database connection above to begin.
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {/* Tab 1: Table Structure */}
      {activeTab === "structure" && (
        <motion.div
          key={`structure-${effectiveTableName}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {activeTable ? (
            <TableStructureView
              table={activeTable}
              dbType={activeConnection.db_type || "postgres"}
              onSwitchToDataGrid={() => setActiveTab("data")}
            />
          ) : (
            <div className="text-muted-foreground p-8 text-center text-xs">
              Select a {terminology.entitySingular.toLowerCase()} from the
              schema tree on the left to inspect its fields, constraints, and
              indexes.
            </div>
          )}
        </motion.div>
      )}

      {/* Tab 2: Live Data Grid */}
      {activeTab === "data" && (
        <motion.div
          key={`data-${effectiveTableName}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {activeTable ? (
            <DatabaseDataViewer
              table={activeTable}
              queryResult={queryResult}
              isLoading={isRowsLoading}
              dbType={activeConnection.db_type || "postgres"}
              onRefresh={onRefreshRows}
              onSortChange={(field, dir) => {
                setQueryParams((prev) => ({
                  ...prev,
                  sort_by: field,
                  sort_dir: dir,
                }))
              }}
              onPageChange={(page) => {
                setQueryParams((prev) => ({ ...prev, page }))
              }}
              onPageSizeChange={(limit) => {
                setQueryParams((prev) => ({ ...prev, limit, page: 1 }))
              }}
              onSearchChange={(search) => {
                setQueryParams((prev) => ({ ...prev, search, page: 1 }))
              }}
              onUpdateCell={onUpdateCell}
              onUpdateRow={onUpdateRow}
              onDeleteRow={onDeleteRow}
              onInsertRow={onInsertRow}
            />
          ) : (
            <div className="text-muted-foreground p-8 text-center text-xs">
              Select a {terminology.entitySingular.toLowerCase()} from the
              schema tree on the left to browse and edit live{" "}
              {terminology.recordPlural.toLowerCase()}.
            </div>
          )}
        </motion.div>
      )}

      {/* Tab 3: Schema Diff */}
      {activeTab === "diff" && (
        <motion.div
          key="diff-view"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {connections.length < 2 ? (
            <div className="border-border/70 bg-card rounded-xl border p-8 text-center">
              <ArrowRightLeft className="text-muted-foreground/60 mx-auto mb-2 h-8 w-8" />
              <h4 className="text-foreground text-sm font-medium">
                Requires At Least 2 Database Connections
              </h4>
              <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
                Schema Diff compares a Source Database against a Target Database
                to flag missing tables and type divergences. Add a target
                connection to use this feature.
              </p>
              <Link to="/connections" className="mt-4 inline-block">
                <Button size="sm" className="gap-1.5 text-xs font-medium">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Target Database</span>
                </Button>
              </Link>
            </div>
          ) : isDiffLoading ? (
            <div className="text-muted-foreground flex h-64 flex-col items-center justify-center gap-2 text-xs">
              <RefreshCw className="text-primary h-6 w-6 animate-spin" />
              <span>Comparing source and target schemas...</span>
            </div>
          ) : schemaDiff ? (
            <SchemaDiffViewer
              diff={schemaDiff}
              sourceDbName={activeConnection.name}
              targetDbName={targetConnection?.name || "Target DB"}
            />
          ) : (
            <div className="text-muted-foreground p-8 text-center text-xs">
              Unable to compute schema diff between selected connections.
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SchemaStudioContent
