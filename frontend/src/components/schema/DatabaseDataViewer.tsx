import { useState } from "react"
import { Table as TableIcon, FileCode, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RelationalGridView } from "./RelationalGridView"
import { DocumentView } from "./DocumentView"
import { getDatabaseTerminology } from "@/lib/constants/databaseViewers"
import type { TableSchema, ColumnSchema, QueryResult } from "@/types/schema"
import { cn } from "@/lib/utils"

export interface DatabaseDataViewerProps {
  table: TableSchema
  queryResult: QueryResult | null
  isLoading?: boolean
  dbType?: string
  onRefresh?: () => void
  onSortChange?: (field: string, dir: "asc" | "desc") => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (limit: number) => void
  onSearchChange?: (term: string) => void
  onUpdateCell?: (
    row: Record<string, unknown>,
    col: ColumnSchema,
    newVal: unknown
  ) => Promise<void>
  onUpdateRow?: (
    row: Record<string, unknown>,
    updatedRow: Record<string, unknown>
  ) => Promise<void>
  onDeleteRow?: (pkValues: Record<string, unknown>) => Promise<void>
  onInsertRow?: (data: Record<string, unknown>) => Promise<void>
  className?: string
}

/**
 * Dynamic Database Viewer Dispatcher
 * Automatically resolves the primary visualization strategy based on the database paradigm
 * (e.g. Relational Table for PostgreSQL/MySQL/SQLite, Document Tree/Cards for MongoDB).
 */
export function DatabaseDataViewer({
  table,
  queryResult,
  isLoading = false,
  dbType = "postgres",
  onRefresh,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onUpdateCell,
  onUpdateRow,
  onDeleteRow,
  onInsertRow,
  className,
}: DatabaseDataViewerProps) {
  const terminology = getDatabaseTerminology(dbType)
  const isDocumentParadigm = terminology.paradigm === "document"

  // Allow user to switch between default paradigm view and alternative view format
  const [viewMode, setViewMode] = useState<"table" | "documents">(() =>
    terminology.defaultViewMode === "documents" ? "documents" : "table"
  )

  const rows = queryResult?.rows || []
  const totalRows = queryResult?.total_rows ?? rows.length
  const currentPage = queryResult?.page || 1
  const pageSize = queryResult?.limit || 25
  const totalPages =
    queryResult?.total_pages || Math.ceil(totalRows / pageSize) || 1

  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      {/* Paradigm Dispatcher Header Strip */}
      <div className="border-border/70 bg-card flex flex-wrap items-center justify-between gap-2.5 rounded-xl border p-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          {/* Format Mode Switcher Buttons */}
          <div className="border-border/70 bg-muted/40 flex items-center gap-1 rounded-lg border p-0.5">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={cn(
                "h-7 gap-1.5 px-2.5 text-xs font-medium",
                viewMode === "table" && "shadow-xs"
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table Grid</span>
            </Button>

            <Button
              variant={viewMode === "documents" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("documents")}
              className={cn(
                "h-7 gap-1.5 px-2.5 text-xs font-medium",
                viewMode === "documents" && "shadow-xs"
              )}
            >
              <FileCode
                className={cn(
                  "h-3.5 w-3.5",
                  isDocumentParadigm ? "text-success" : "text-primary"
                )}
              />
              <span>
                {isDocumentParadigm ? "Document View" : "JSON / Docs"}
              </span>
            </Button>
          </div>

          {/* Paradigm Badge */}
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[10px]",
              isDocumentParadigm
                ? "border-success/30 bg-success/10 text-success"
                : "border-primary/30 bg-primary/10 text-primary"
            )}
          >
            {terminology.paradigm.toUpperCase()} • {terminology.recordPlural}
          </Badge>
        </div>

        {/* Refresh Action */}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-7 gap-1 px-2.5 text-xs"
            title={`Refresh ${terminology.recordPlural.toLowerCase()}`}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        )}
      </div>

      {/* Dynamic View Component Dispatch */}
      {viewMode === "documents" ? (
        <DocumentView
          documents={rows}
          collectionName={table.name}
          primaryKeyField={
            table.primary_keys[0] || (isDocumentParadigm ? "_id" : "id")
          }
          totalDocuments={totalRows}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          isLoading={isLoading}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onRefresh={onRefresh}
          onUpdateDocument={async (origDoc, updatedDoc) => {
            if (onUpdateRow) {
              await onUpdateRow(origDoc, updatedDoc)
            } else if (onUpdateCell) {
              for (const col of table.columns) {
                if (origDoc[col.name] !== updatedDoc[col.name]) {
                  await onUpdateCell(origDoc, col, updatedDoc[col.name])
                }
              }
            }
          }}
          onDeleteDocument={async (doc) => {
            if (onDeleteRow) {
              const pkField =
                table.primary_keys[0] || (isDocumentParadigm ? "_id" : "id")
              await onDeleteRow({ [pkField]: doc[pkField] })
            }
          }}
          onInsertDocument={async (newDoc) => {
            if (onInsertRow) {
              await onInsertRow(newDoc)
            }
          }}
        />
      ) : (
        <RelationalGridView
          table={table}
          queryResult={queryResult}
          isLoading={isLoading}
          onRefresh={onRefresh}
          onSortChange={onSortChange}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onSearchChange={onSearchChange}
          onUpdateCell={onUpdateCell}
          onDeleteRow={onDeleteRow}
          onInsertRow={onInsertRow}
        />
      )}
    </div>
  )
}
