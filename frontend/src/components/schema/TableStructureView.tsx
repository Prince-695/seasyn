import { useState } from "react"
import {
  Key,
  ArrowUpRight,
  ShieldAlert,
  Database,
  Layers,
  FileCode,
  Table as TableIcon,
  Check,
  Copy,
  Braces,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SeasonTypeBadge } from "./SeasonTypeBadge"
import type { TableSchema } from "@/types/schema"
import { cn } from "@/lib/utils"

interface TableStructureViewProps {
  table: TableSchema
  dbType?: string
  onSwitchToDataGrid?: () => void
  className?: string
}

export function TableStructureView({
  table,
  dbType = "postgres",
  onSwitchToDataGrid,
  className,
}: TableStructureViewProps) {
  const isMongo = dbType === "mongodb"
  const [activeSubTab, setActiveSubTab] = useState<
    "columns" | "indexes" | "constraints" | "ddl"
  >("columns")
  const [copiedDdl, setCopiedDdl] = useState(false)

  // Generate synthetic DDL / MongoDB Validator for quick preview
  const generateDdl = () => {
    if (isMongo) {
      const properties: Record<string, unknown> = {}
      table.columns.forEach((col) => {
        properties[col.name] = {
          bsonType:
            col.season_type === "int"
              ? "int"
              : col.season_type === "float" || col.season_type === "decimal"
                ? "double"
                : col.season_type === "bool"
                  ? "bool"
                  : col.season_type === "json"
                    ? "object"
                    : col.season_type === "array"
                      ? "array"
                      : "string",
          description: `${col.name} field${col.is_primary_key ? " (Document Identifier)" : ""}`,
        }
      })
      const validator = {
        $jsonSchema: {
          bsonType: "object",
          required: table.primary_keys,
          properties,
        },
      }
      return `// MongoDB Collection Schema Validator\n// Collection: "${table.name}"\ndb.createCollection("${table.name}", {\n  validator: ${JSON.stringify(validator, null, 2)}\n});`
    }

    const colDefs = table.columns.map((col) => {
      let def = `  "${col.name}" ${col.data_type.toUpperCase()}`
      if (!col.is_nullable) def += " NOT NULL"
      if (col.default_value) def += ` DEFAULT ${col.default_value}`
      return def
    })

    if (table.primary_keys && table.primary_keys.length > 0) {
      colDefs.push(`  PRIMARY KEY ("${table.primary_keys.join('", "')}")`)
    }

    return `CREATE TABLE "${table.name}" (\n${colDefs.join(",\n")}\n);`
  }

  const handleCopyDdl = async () => {
    try {
      await navigator.clipboard.writeText(generateDdl())
      setCopiedDdl(true)
      setTimeout(() => setCopiedDdl(false), 2000)
    } catch {
      // Clipboard fallback
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table Metadata Header Strip */}
      <div className="border-border/70 bg-card rounded-xl border p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="border-primary/40 bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl border shadow-xs">
              {isMongo ? (
                <Braces className="h-5 w-5 text-emerald-500" />
              ) : (
                <TableIcon className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-foreground font-mono text-base font-bold">
                  {table.name}
                </h2>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {table.columns.length} {isMongo ? "fields" : "columns"}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {table.row_count.toLocaleString()}{" "}
                  {isMongo ? "documents" : "rows"}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                {isMongo
                  ? "MongoDB Collection in database schema"
                  : "Physical relation in database schema"}{" "}
                · Size approx{" "}
                {table.size_bytes
                  ? `${(table.size_bytes / (1024 * 1024)).toFixed(2)} MB`
                  : "< 1 MB"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToDataGrid && (
              <Button
                size="sm"
                onClick={onSwitchToDataGrid}
                className="gap-1.5 text-xs font-semibold"
              >
                <Database className="h-3.5 w-3.5" />
                <span>View Live {isMongo ? "Documents" : "Data"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="border-border/60 mt-4 flex items-center gap-1 border-t pt-3">
          <button
            type="button"
            onClick={() => setActiveSubTab("columns")}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
              activeSubTab === "columns"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            {isMongo ? "Fields" : "Columns"} ({table.columns.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("indexes")}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
              activeSubTab === "indexes"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            Indexes ({table.indexes?.length || 0})
          </button>
          {!isMongo && (
            <button
              type="button"
              onClick={() => setActiveSubTab("constraints")}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
                activeSubTab === "constraints"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              Constraints ({table.constraints?.length || 0})
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveSubTab("ddl")}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
              activeSubTab === "ddl"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            {isMongo ? "Collection Validator" : "DDL SQL"}
          </button>
        </div>
      </div>

      {/* ── SubTab 1: Columns ── */}
      {activeSubTab === "columns" && (
        <div className="border-border/70 bg-card overflow-hidden rounded-xl border shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-border/60 bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold tracking-wider uppercase">
                <tr>
                  <th className="px-3 py-2.5">Column Name</th>
                  <th className="px-3 py-2.5">Universal Type</th>
                  <th className="px-3 py-2.5">Native Type</th>
                  <th className="px-3 py-2.5">Nullable</th>
                  <th className="px-3 py-2.5">Default Value</th>
                  <th className="px-3 py-2.5">Key / Relationship</th>
                </tr>
              </thead>
              <tbody className="divide-border/50 divide-y font-mono">
                {table.columns.map((col) => {
                  return (
                    <tr
                      key={col.name}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-3 py-2.5">
                        <div className="text-foreground flex items-center gap-1.5 font-semibold">
                          {col.is_primary_key && (
                            <Key className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          )}
                          {col.is_foreign_key && (
                            <ArrowUpRight className="text-info h-3.5 w-3.5 shrink-0" />
                          )}
                          <span>{col.name}</span>
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <SeasonTypeBadge type={col.season_type} />
                      </td>

                      <td className="text-muted-foreground px-3 py-2.5">
                        {col.data_type}
                      </td>

                      <td className="px-3 py-2.5 font-sans">
                        {col.is_nullable ? (
                          <span className="text-muted-foreground text-[11px]">
                            Nullable
                          </span>
                        ) : (
                          <span className="text-foreground text-[11px] font-semibold">
                            NOT NULL
                          </span>
                        )}
                      </td>

                      <td className="text-muted-foreground px-3 py-2.5 font-mono text-[11px]">
                        {col.default_value || "-"}
                      </td>

                      <td className="px-3 py-2.5 font-sans">
                        {col.is_primary_key && (
                          <Badge className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-500">
                            Primary Key
                          </Badge>
                        )}
                        {col.is_foreign_key && col.foreign_table && (
                          <div className="text-info flex items-center gap-1 font-mono text-[11px]">
                            <ArrowUpRight className="h-3 w-3" />
                            <span>
                              ➔ {col.foreign_table}.{col.foreign_column}
                            </span>
                          </div>
                        )}
                        {!col.is_primary_key && !col.is_foreign_key && (
                          <span className="text-muted-foreground/50 text-[11px]">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SubTab 2: Indexes ── */}
      {activeSubTab === "indexes" && (
        <div className="border-border/70 bg-card overflow-hidden rounded-xl border shadow-xs">
          {table.indexes && table.indexes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-border/60 bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold tracking-wider uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Index Name</th>
                    <th className="px-3 py-2.5">Indexed Columns</th>
                    <th className="px-3 py-2.5">Unique</th>
                    <th className="px-3 py-2.5">Index Method</th>
                  </tr>
                </thead>
                <tbody className="divide-border/50 divide-y font-mono">
                  {table.indexes.map((idx) => (
                    <tr
                      key={idx.name}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="text-foreground px-3 py-2.5 font-semibold">
                        {idx.name}
                      </td>
                      <td className="text-muted-foreground px-3 py-2.5">
                        ({idx.columns.join(", ")})
                      </td>
                      <td className="px-3 py-2.5 font-sans">
                        {idx.is_unique ? (
                          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-500">
                            UNIQUE
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">
                            Non-unique
                          </span>
                        )}
                      </td>
                      <td className="text-muted-foreground px-3 py-2.5 font-mono text-[11px]">
                        {idx.type || "BTREE"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted-foreground p-8 text-center text-xs">
              <Layers className="text-muted-foreground/40 mx-auto mb-2 h-6 w-6" />
              No secondary indexes configured for this relation.
            </div>
          )}
        </div>
      )}

      {/* ── SubTab 3: Constraints ── */}
      {activeSubTab === "constraints" && (
        <div className="border-border/70 bg-card overflow-hidden rounded-xl border shadow-xs">
          {table.constraints && table.constraints.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-border/60 bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold tracking-wider uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Constraint Identifier</th>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="px-3 py-2.5">Target Columns</th>
                    <th className="px-3 py-2.5">References</th>
                  </tr>
                </thead>
                <tbody className="divide-border/50 divide-y font-mono">
                  {table.constraints.map((c) => (
                    <tr
                      key={c.name}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="text-foreground px-3 py-2.5 font-semibold">
                        {c.name}
                      </td>
                      <td className="px-3 py-2.5 font-sans">
                        <Badge variant="outline" className="text-[10px]">
                          {c.type}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground px-3 py-2.5">
                        {c.columns.join(", ")}
                      </td>
                      <td className="text-info px-3 py-2.5 text-[11px]">
                        {c.foreign_table ? (
                          <span>
                            ➔ {c.foreign_table}({c.foreign_columns?.join(", ")})
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted-foreground p-8 text-center text-xs">
              <ShieldAlert className="text-muted-foreground/40 mx-auto mb-2 h-6 w-6" />
              No table constraints recorded.
            </div>
          )}
        </div>
      )}

      {/* ── SubTab 4: DDL Preview ── */}
      {activeSubTab === "ddl" && (
        <div className="border-border/70 bg-card overflow-hidden rounded-xl border shadow-xs">
          <div className="border-border/60 bg-muted/30 flex items-center justify-between border-b px-4 py-2">
            <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
              <FileCode className="text-primary h-4 w-4" />
              <span>Generated SQL DDL Schema Definition</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyDdl}
              className="h-7 gap-1 text-xs"
            >
              {copiedDdl ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span>{copiedDdl ? "Copied" : "Copy SQL"}</span>
            </Button>
          </div>
          <div className="overflow-x-auto bg-zinc-950 p-4 font-mono text-xs text-emerald-400">
            <pre>{generateDdl()}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
