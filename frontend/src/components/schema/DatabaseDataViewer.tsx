import { RelationalGridView } from "./RelationalGridView"
import { DocumentView } from "./DocumentView"
import { getDatabaseTerminology } from "@/lib/constants/databaseViewers"
import type { TableSchema, ColumnSchema, QueryResult } from "@/types/schema"

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
 * Strictly renders RelationalGridView for SQL databases and DocumentView for MongoDB.
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

  const rows = queryResult?.rows || []
  const totalRows = queryResult?.total_rows ?? rows.length
  const currentPage = queryResult?.page || 1
  const pageSize = queryResult?.limit || 25
  const totalPages =
    queryResult?.total_pages || Math.ceil(totalRows / pageSize) || 1

  // Document databases (MongoDB): Exclusively render DocumentView
  if (isDocumentParadigm) {
    return (
      <DocumentView
        documents={rows}
        collectionName={table.name}
        primaryKeyField={table.primary_keys[0] || "_id"}
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
            const pkField = table.primary_keys[0] || "_id"
            await onDeleteRow({ [pkField]: doc[pkField] })
          }
        }}
        onInsertDocument={async (newDoc) => {
          if (onInsertRow) {
            await onInsertRow(newDoc)
          }
        }}
        className={className}
      />
    )
  }

  // Relational databases (PostgreSQL, MySQL, SQLite): Exclusively render RelationalGridView
  return (
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
      className={className}
    />
  )
}

export default DatabaseDataViewer
