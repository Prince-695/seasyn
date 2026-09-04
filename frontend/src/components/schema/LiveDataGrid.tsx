import { useState } from "react"
import {
  Table as TableIcon,
  Search,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  RefreshCw,
  Download,
  Key,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EditCellDialog } from "./EditCellDialog"
import { DeleteRowDialog } from "./DeleteRowDialog"
import { InsertRowModal } from "./InsertRowModal"
import type { TableSchema, ColumnSchema, QueryResult } from "@/types/schema"
import { cn } from "@/lib/utils"

interface LiveDataGridProps {
  table: TableSchema
  queryResult: QueryResult | null
  isLoading?: boolean
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
  onDeleteRow?: (pkValues: Record<string, unknown>) => Promise<void>
  onInsertRow?: (data: Record<string, unknown>) => Promise<void>
  className?: string
}

export function LiveDataGrid({
  table,
  queryResult,
  isLoading = false,
  onRefresh,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onUpdateCell,
  onDeleteRow,
  onInsertRow,
  className,
}: LiveDataGridProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set())

  // Dialog states
  const [insertModalOpen, setInsertModalOpen] = useState(false)
  const [editingCell, setEditingCell] = useState<{
    row: Record<string, unknown>
    column: ColumnSchema
  } | null>(null)
  const [rowToDelete, setRowToDelete] = useState<Record<
    string,
    unknown
  > | null>(null)

  const rows = queryResult?.rows || []
  const columns = table.columns
  const totalRows = queryResult?.total_rows ?? rows.length
  const currentPage = queryResult?.page || 1
  const pageSize = queryResult?.limit || 25
  const totalPages =
    queryResult?.total_pages || Math.ceil(totalRows / pageSize) || 1

  const handleSort = (colName: string) => {
    let nextDir: "asc" | "desc" = "asc"
    if (sortField === colName) {
      nextDir = sortDir === "asc" ? "desc" : "asc"
    }
    setSortField(colName)
    setSortDir(nextDir)
    onSortChange?.(colName, nextDir)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange?.(searchTerm)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(
        rows.map((r, i) => String(r[table.primary_keys[0] || "id"] ?? i))
      )
      setSelectedRowIds(allIds)
    } else {
      setSelectedRowIds(new Set())
    }
  }

  const handleSelectRow = (rowKey: string) => {
    const next = new Set(selectedRowIds)
    if (next.has(rowKey)) next.delete(rowKey)
    else next.add(rowKey)
    setSelectedRowIds(next)
  }

  // Export CSV
  const handleExportCsv = () => {
    if (rows.length === 0) return
    const headers = columns.map((c) => c.name).join(",")
    const csvRows = rows.map((r) =>
      columns
        .map((c) => {
          const val = r[c.name]
          if (val === null || val === undefined) return ""
          const str =
            typeof val === "object" ? JSON.stringify(val) : String(val)
          return `"${str.replace(/"/g, '""')}"`
        })
        .join(",")
    )
    const blob = new Blob([`${headers}\n${csvRows.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${table.name}_data.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      {/* Action Toolbar */}
      <div className="border-border/70 bg-card flex flex-wrap items-center justify-between gap-2.5 rounded-xl border p-3 shadow-xs">
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search table rows..."
              className="h-8 pl-8 text-xs ring-offset-0"
            />
          </form>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 gap-1.5 text-xs"
              title="Refresh rows"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
              />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={rows.length === 0}
            className="h-8 gap-1.5 text-xs"
            title="Export CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {selectedRowIds.size > 0 && (
            <Badge variant="secondary" className="font-mono text-xs">
              {selectedRowIds.size} selected
            </Badge>
          )}

          {onInsertRow && (
            <Button
              size="sm"
              onClick={() => setInsertModalOpen(true)}
              className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Row</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Table Grid Container */}
      <div className="border-border/70 bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="max-h-[550px] overflow-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-border/60 bg-muted/60 sticky top-0 z-10 border-b backdrop-blur-md">
              <tr>
                {/* Select All Checkbox */}
                <th className="w-10 px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={
                      rows.length > 0 && selectedRowIds.size === rows.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="accent-primary h-3.5 w-3.5 rounded"
                  />
                </th>

                {/* Column Headers */}
                {columns.map((col) => {
                  const isSorted = sortField === col.name
                  return (
                    <th
                      key={col.name}
                      onClick={() => handleSort(col.name)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer px-3 py-2.5 font-mono text-[11px] font-semibold tracking-wider uppercase transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        {col.is_primary_key && (
                          <Key className="h-3 w-3 shrink-0 text-amber-500" />
                        )}
                        <span>{col.name}</span>
                        {isSorted ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="text-primary h-3 w-3" />
                          ) : (
                            <ArrowDown className="text-primary h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="text-muted-foreground/40 h-3 w-3 opacity-0 hover:opacity-100" />
                        )}
                      </div>
                    </th>
                  )
                })}

                {/* Actions Column */}
                <th className="text-muted-foreground w-20 px-3 py-2.5 text-right text-[11px] font-medium uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-border/50 divide-y font-mono">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="text-muted-foreground py-12 text-center text-xs"
                  >
                    Loading rows from database...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="text-muted-foreground py-12 text-center"
                  >
                    <TableIcon className="text-muted-foreground/40 mx-auto mb-2 h-8 w-8" />
                    <p className="text-foreground text-xs font-semibold">
                      No Records Found
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      The table &apos;{table.name}&apos; has 0 rows matching
                      your filter.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row, rowIdx) => {
                  const pkVal = String(
                    row[table.primary_keys[0] || "id"] ?? rowIdx
                  )
                  const isChecked = selectedRowIds.has(pkVal)

                  return (
                    <tr
                      key={pkVal}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isChecked && "bg-primary/5"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectRow(pkVal)}
                          className="accent-primary h-3.5 w-3.5 rounded"
                        />
                      </td>

                      {/* Cell Values */}
                      {columns.map((col) => {
                        const cellVal = row[col.name]
                        const isNull = cellVal === null || cellVal === undefined
                        const isBool = col.season_type === "bool"
                        const isJson =
                          col.season_type === "json" ||
                          col.season_type === "array"

                        return (
                          <td
                            key={col.name}
                            onClick={() =>
                              onUpdateCell &&
                              setEditingCell({ row, column: col })
                            }
                            title="Click to edit value"
                            className="text-foreground max-w-[240px] cursor-pointer truncate px-3 py-2 text-xs hover:underline"
                          >
                            {isNull ? (
                              <span className="text-muted-foreground/50 text-[11px] italic">
                                NULL
                              </span>
                            ) : isBool ? (
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase",
                                  cellVal
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {String(cellVal)}
                              </span>
                            ) : isJson ? (
                              <span className="font-mono text-[11px] text-indigo-400">
                                {typeof cellVal === "object"
                                  ? JSON.stringify(cellVal)
                                  : String(cellVal)}
                              </span>
                            ) : (
                              <span>{String(cellVal)}</span>
                            )}
                          </td>
                        )
                      })}

                      {/* Action buttons */}
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onUpdateCell && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingCell({
                                  row,
                                  column: columns[0],
                                })
                              }
                              title="Edit record"
                              className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {onDeleteRow && (
                            <button
                              type="button"
                              onClick={() => setRowToDelete(row)}
                              title="Delete record"
                              className="text-muted-foreground hover:text-destructive rounded p-1 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Controls */}
        <div className="border-border/60 bg-muted/20 text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, totalRows)} of{" "}
              {totalRows.toLocaleString()} rows
            </span>
            <span>·</span>
            <div className="flex items-center gap-1">
              <span>Page size:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                className="border-input bg-background text-foreground h-6 rounded border px-1.5 text-xs shadow-xs"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => onPageChange?.(currentPage - 1)}
              className="h-7 px-2.5 text-xs"
            >
              Previous
            </Button>
            <span className="text-foreground px-2 font-mono text-xs font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => onPageChange?.(currentPage + 1)}
              className="h-7 px-2.5 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Cell Dialog */}
      {editingCell && (
        <EditCellDialog
          open={!!editingCell}
          onOpenChange={(open) => !open && setEditingCell(null)}
          row={editingCell.row}
          column={editingCell.column}
          onSave={async (newVal) => {
            if (onUpdateCell) {
              await onUpdateCell(editingCell.row, editingCell.column, newVal)
            }
          }}
        />
      )}

      {/* Delete Row Dialog */}
      {rowToDelete && (
        <DeleteRowDialog
          open={!!rowToDelete}
          onOpenChange={(open) => !open && setRowToDelete(null)}
          row={rowToDelete}
          primaryKeys={table.primary_keys}
          tableName={table.name}
          onConfirmDelete={async (pkValues) => {
            if (onDeleteRow) {
              await onDeleteRow(pkValues)
            }
          }}
        />
      )}

      {/* Insert Row Modal */}
      {insertModalOpen && onInsertRow && (
        <InsertRowModal
          open={insertModalOpen}
          onOpenChange={setInsertModalOpen}
          table={table}
          onInsert={onInsertRow}
        />
      )}
    </div>
  )
}
