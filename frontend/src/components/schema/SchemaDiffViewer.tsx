import { useState } from "react"
import {
  PlusCircle,
  MinusCircle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Database,
  Filter,
  Layers,
  FileCode,
  Check,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SeasonTypeBadge } from "./SeasonTypeBadge"
import type { SchemaDiff, TableDiff } from "@/types/schema"
import { cn } from "@/lib/utils"

interface SchemaDiffViewerProps {
  diff: SchemaDiff
  sourceDbName?: string
  targetDbName?: string
  className?: string
}

export function SchemaDiffViewer({
  diff,
  sourceDbName = "Source Database",
  targetDbName = "Target Database",
  className,
}: SchemaDiffViewerProps) {
  const [filter, setFilter] = useState<"all" | "diffs" | "added" | "altered">(
    "all"
  )
  const [selectedTableDiff, setSelectedTableDiff] = useState<TableDiff | null>(
    diff.tables_altered[0] || null
  )
  const [copiedMigrationSql, setCopiedMigrationSql] = useState(false)

  // Filtered altered tables
  const alteredList = diff.tables_altered

  const handleCopyMigrationDdl = async () => {
    let sql = `-- SEASYN Automated Migration Script\n-- Source (${diff.source_db_type}) ➔ Target (${diff.target_db_type})\n-- Generated at: ${new Date(diff.generated_at).toLocaleString()}\n\n`

    diff.tables_added.forEach((t) => {
      sql += `-- Create table missing in target\nCREATE TABLE "${t}" (\n  "id" UUID PRIMARY KEY,\n  "created_at" TIMESTAMPTZ DEFAULT NOW()\n);\n\n`
    })

    diff.tables_altered.forEach((td) => {
      td.column_diffs?.forEach((cd) => {
        if (cd.diff_type === "added" && cd.source_column) {
          sql += `ALTER TABLE "${td.name}" ADD COLUMN "${cd.name}" ${cd.source_column.data_type};\n`
        } else if (cd.diff_type === "altered" && cd.source_column) {
          sql += `ALTER TABLE "${td.name}" ALTER COLUMN "${cd.name}" TYPE ${cd.source_column.data_type};\n`
        }
      })
    })

    try {
      await navigator.clipboard.writeText(sql)
      setCopiedMigrationSql(true)
      setTimeout(() => setCopiedMigrationSql(false), 2000)
    } catch {
      // Clipboard fallback
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* ── Summary Metric Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Added Tables */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setFilter("added")}
          className={cn(
            "border-border/70 bg-card hover:bg-muted/20 flex h-auto cursor-pointer flex-col items-start rounded-xl border p-3.5 text-left shadow-xs transition-all duration-150",
            filter === "added" &&
              "border-success/50 bg-success/5 ring-success/30 ring-1"
          )}
        >
          <div className="flex w-full items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold">
              Tables to Add
            </span>
            <PlusCircle className="text-success h-4 w-4" />
          </div>
          <span className="text-success mt-2 font-mono text-2xl font-bold">
            +{diff.tables_added.length}
          </span>
          <span className="text-muted-foreground mt-0.5 text-[11px]">
            Missing from target DB
          </span>
        </Button>

        {/* Removed Tables */}
        <div className="border-border/70 bg-card flex flex-col items-start rounded-xl border p-3.5 text-left shadow-xs">
          <div className="flex w-full items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold">
              Target Orphans
            </span>
            <MinusCircle className="text-destructive h-4 w-4" />
          </div>
          <span className="text-destructive mt-2 font-mono text-2xl font-bold">
            -{diff.tables_removed.length}
          </span>
          <span className="text-muted-foreground mt-0.5 text-[11px]">
            Present only in target
          </span>
        </div>

        {/* Altered Tables */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setFilter("altered")}
          className={cn(
            "border-border/70 bg-card hover:bg-muted/20 flex h-auto cursor-pointer flex-col items-start rounded-xl border p-3.5 text-left shadow-xs transition-all duration-150",
            filter === "altered" &&
              "border-warning/50 bg-warning/5 ring-warning/30 ring-1"
          )}
        >
          <div className="flex w-full items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold">
              Altered Tables
            </span>
            <AlertCircle className="text-warning h-4 w-4" />
          </div>
          <span className="text-warning mt-2 font-mono text-2xl font-bold">
            ~{diff.tables_altered.length}
          </span>
          <span className="text-muted-foreground mt-0.5 text-[11px]">
            Schema type divergences
          </span>
        </Button>

        {/* Identical Tables */}
        <div className="border-border/70 bg-card flex flex-col items-start rounded-xl border p-3.5 text-left shadow-xs">
          <div className="flex w-full items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold">
              Identical Tables
            </span>
            <CheckCircle2 className="text-primary h-4 w-4" />
          </div>
          <span className="text-foreground mt-2 font-mono text-2xl font-bold">
            {diff.tables_same.length}
          </span>
          <span className="text-muted-foreground mt-0.5 text-[11px]">
            100% schema parity
          </span>
        </div>
      </div>

      {/* ── Toolbar & Filter Strip ── */}
      <div className="border-border/70 bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          <span className="text-foreground text-xs font-semibold">View:</span>
          <div className="flex items-center gap-1">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="h-7 px-2.5 text-xs"
            >
              All Tables
            </Button>
            <Button
              variant={filter === "diffs" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("diffs")}
              className="h-7 px-2.5 text-xs"
            >
              Differences Only
            </Button>
            <Button
              variant={filter === "added" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("added")}
              className="h-7 px-2.5 text-xs"
            >
              Added ({diff.tables_added.length})
            </Button>
            <Button
              variant={filter === "altered" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("altered")}
              className="h-7 px-2.5 text-xs"
            >
              Altered ({diff.tables_altered.length})
            </Button>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyMigrationDdl}
          className="h-7 gap-1.5 text-xs font-semibold"
        >
          {copiedMigrationSql ? (
            <Check className="text-success h-3.5 w-3.5" />
          ) : (
            <FileCode className="text-primary h-3.5 w-3.5" />
          )}
          <span>
            {copiedMigrationSql ? "Copied SQL" : "Export Migration SQL"}
          </span>
        </Button>
      </div>

      {/* ── Side-by-Side Detailed Comparison ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column: Tables Diff Directory */}
        <div className="border-border/70 bg-card space-y-2 overflow-hidden rounded-xl border p-3 shadow-xs lg:col-span-4">
          <span className="text-muted-foreground block px-1 text-xs font-semibold tracking-wider uppercase">
            Comparison Directory
          </span>

          <div className="space-y-1">
            {/* Added Tables List */}
            {diff.tables_added.map((tableName) => (
              <div
                key={`add-${tableName}`}
                className="border-success/20 bg-success/5 flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 font-mono">
                  <PlusCircle className="text-success h-3.5 w-3.5 shrink-0" />
                  <span className="text-foreground font-semibold">
                    {tableName}
                  </span>
                </div>
                <Badge className="border-success/20 bg-success/10 text-success text-[10px]">
                  + New in Target
                </Badge>
              </div>
            ))}

            {/* Altered Tables List */}
            {alteredList.map((td) => {
              const isSelected = selectedTableDiff?.name === td.name
              return (
                <Button
                  key={`alt-${td.name}`}
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedTableDiff(td)}
                  className={cn(
                    "flex h-auto w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-all duration-150",
                    isSelected
                      ? "border-warning bg-warning/10 shadow-xs"
                      : "border-border/60 hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2 font-mono">
                    <AlertCircle className="text-warning h-3.5 w-3.5 shrink-0" />
                    <span className="text-foreground font-semibold">
                      {td.name}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-warning/30 text-warning text-[10px]"
                  >
                    ~ {td.column_diffs?.length || 0} Diffs
                  </Badge>
                </Button>
              )
            })}

            {/* Same Tables List (if filter allows) */}
            {filter === "all" &&
              diff.tables_same.map((tableName) => (
                <div
                  key={`same-${tableName}`}
                  className="border-border/50 bg-muted/10 flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                >
                  <div className="text-muted-foreground flex items-center gap-2 font-mono">
                    <CheckCircle2 className="text-muted-foreground/60 h-3.5 w-3.5 shrink-0" />
                    <span>{tableName}</span>
                  </div>
                  <span className="text-muted-foreground/70 text-[10px]">
                    Identical
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Right Column: Column-by-Column Side-by-Side Inspector */}
        <div className="border-border/70 bg-card overflow-hidden rounded-xl border shadow-xs lg:col-span-8">
          {selectedTableDiff ? (
            <div>
              {/* Header */}
              <div className="border-border/60 bg-muted/30 flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <Database className="text-primary h-4 w-4" />
                  <span className="text-foreground font-mono text-xs font-bold">
                    Table Schema Diff: {selectedTableDiff.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-muted-foreground">{sourceDbName}</span>
                  <ArrowRight className="text-primary h-3.5 w-3.5" />
                  <span className="text-foreground font-semibold">
                    {targetDbName}
                  </span>
                </div>
              </div>

              {/* Diff Columns Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-border/60 bg-muted/50 text-muted-foreground border-b text-[11px] font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Column Name</th>
                      <th className="px-3 py-2.5">Diff Status</th>
                      <th className="px-3 py-2.5">Source Type</th>
                      <th className="px-3 py-2.5">Target Universal</th>
                      <th className="px-3 py-2.5">Conversion Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border/50 divide-y font-mono">
                    {selectedTableDiff.column_diffs?.map((cd) => {
                      const isAdded = cd.diff_type === "added"
                      const isAltered = cd.diff_type === "altered"

                      return (
                        <tr
                          key={cd.name}
                          className={cn(
                            "transition-colors",
                            isAdded && "bg-success/5",
                            isAltered && "bg-warning/5"
                          )}
                        >
                          <td className="text-foreground px-3 py-2.5 font-semibold">
                            {cd.name}
                          </td>

                          <td className="px-3 py-2.5 font-sans">
                            {isAdded ? (
                              <Badge className="border-success/20 bg-success/10 text-success text-[10px]">
                                + Added
                              </Badge>
                            ) : isAltered ? (
                              <Badge className="border-warning/20 bg-warning/10 text-warning text-[10px]">
                                ~ Altered
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Identical
                              </Badge>
                            )}
                          </td>

                          <td className="text-muted-foreground px-3 py-2.5">
                            {cd.source_column ? (
                              <div className="flex items-center gap-1.5">
                                <span>{cd.source_column.data_type}</span>
                                <SeasonTypeBadge
                                  type={cd.source_column.season_type}
                                />
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40 italic">
                                None
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-2.5">
                            {cd.target_column ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-foreground">
                                  {cd.target_column.data_type}
                                </span>
                                <SeasonTypeBadge
                                  type={cd.target_column.season_type}
                                />
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40 italic">
                                None
                              </span>
                            )}
                          </td>

                          <td className="text-muted-foreground px-3 py-2.5 font-sans text-xs">
                            {cd.alter_details && cd.alter_details.length > 0 ? (
                              <span className="text-warning text-[11px]">
                                {cd.alter_details.join("; ")}
                              </span>
                            ) : isAdded ? (
                              <span className="text-success text-[11px]">
                                Will be migrated to target schema
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60 text-[11px]">
                                Direct type map compatible
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
          ) : (
            <div className="text-muted-foreground p-12 text-center">
              <Layers className="text-muted-foreground/40 mx-auto mb-2 h-8 w-8" />
              <p className="text-foreground text-sm font-semibold">
                Select an Altered Table
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Choose a table from the left directory to inspect side-by-side
                column discrepancies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
