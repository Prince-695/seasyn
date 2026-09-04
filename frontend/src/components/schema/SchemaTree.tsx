import { useState, useMemo } from "react"
import {
  Table2,
  Search,
  ChevronRight,
  Database,
  Hash,
  Filter,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { TableSchema } from "@/types/schema"
import { cn } from "@/lib/utils"

interface SchemaTreeProps {
  tables: TableSchema[]
  selectedTable: string | null
  onSelectTable: (tableName: string) => void
  databaseName?: string
  dbType?: string
  isLoading?: boolean
  className?: string
}

export function SchemaTree({
  tables,
  selectedTable,
  onSelectTable,
  databaseName = "database",
  dbType = "postgres",
  isLoading = false,
  className,
}: SchemaTreeProps) {
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(true)

  const filteredTables = useMemo(() => {
    if (!search.trim()) return tables
    const term = search.toLowerCase()
    return tables.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.columns.some((c) => c.name.toLowerCase().includes(term))
    )
  }, [tables, search])

  const totalRowCount = useMemo(() => {
    return tables.reduce((acc, t) => acc + (t.row_count || 0), 0)
  }, [tables])

  return (
    <div
      className={cn(
        "border-border/70 bg-card/60 flex h-full flex-col border-r backdrop-blur-sm select-none",
        className
      )}
    >
      {/* Top Header */}
      <div className="border-border/60 flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <div className="border-primary/30 bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg border">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
              <span className="max-w-32.5 truncate">{databaseName}</span>
              <span className="text-muted-foreground font-mono text-[10px] uppercase">
                ({dbType})
              </span>
            </div>
            <p className="text-muted-foreground text-[10px]">
              {tables.length} tables · {totalRowCount.toLocaleString()} rows
            </p>
          </div>
        </div>
      </div>

      {/* Search Filter Input */}
      <div className="border-border/50 border-b p-2.5">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter tables & columns..."
            className="h-8 pl-8 text-xs ring-offset-0"
          />
        </div>
      </div>

      {/* Tables Navigation Tree */}
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 py-1">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase transition-colors"
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                isOpen && "rotate-90"
              )}
            />
            <span>Tables ({filteredTables.length})</span>
          </button>
          {search && (
            <Badge variant="outline" className="h-4 px-1.5 py-0 text-[10px]">
              filtered
            </Badge>
          )}
        </div>

        {isOpen && (
          <div className="space-y-0.5 pt-0.5">
            {isLoading ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-muted/40 h-7 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="p-4 text-center">
                <Filter className="text-muted-foreground/40 mx-auto h-6 w-6" />
                <p className="text-muted-foreground mt-1.5 text-xs">
                  {search ? "No tables match filter" : "No tables discovered"}
                </p>
              </div>
            ) : (
              filteredTables.map((table) => {
                const isSelected = selectedTable === table.name
                return (
                  <button
                    key={table.name}
                    type="button"
                    onClick={() => onSelectTable(table.name)}
                    className={cn(
                      "group flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-all duration-150",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Table2
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-colors",
                          isSelected
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="truncate font-mono">{table.name}</span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded px-1 font-mono text-[10px]",
                          isSelected
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {table.row_count > 999
                          ? `${(table.row_count / 1000).toFixed(1)}k`
                          : table.row_count}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="border-border/60 bg-muted/10 text-muted-foreground flex items-center justify-between border-t p-2 text-[11px]">
        <span className="flex items-center gap-1 font-mono text-[10px]">
          <Hash className="h-3 w-3" />
          <span>{tables.length} Objects</span>
        </span>
        <span className="text-[10px]">Schema Introspected</span>
      </div>
    </div>
  )
}
