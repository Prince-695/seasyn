import { useState, useMemo, useRef, useEffect } from "react"
import { Terminal, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { MigrationJob, MigrationStatus } from "@/types/migration"
import { generateMigrationLogs } from "@/lib/migrationMetrics"
import { cn } from "@/lib/utils"

interface MigrationTerminalLogProps {
  job: MigrationJob
  status: MigrationStatus
  totalRows: number
  migratedRows: number
  errorMessage?: string | null
  className?: string
}

type FilterLevel = "ALL" | "INFO" | "BATCH" | "SUCCESS" | "ERROR"

export function MigrationTerminalLog({
  job,
  status,
  totalRows,
  migratedRows,
  errorMessage,
  className,
}: MigrationTerminalLogProps) {
  const [copied, setCopied] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterLevel>("ALL")
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Dynamically generate customized logs for this specific migration
  const allLogs = useMemo(() => {
    return generateMigrationLogs(
      job,
      totalRows,
      migratedRows,
      status,
      errorMessage
    )
  }, [job, totalRows, migratedRows, status, errorMessage])

  const filteredLogs = useMemo(() => {
    if (activeFilter === "ALL") return allLogs
    return allLogs.filter((log) => log.level === activeFilter)
  }, [allLogs, activeFilter])

  // Auto-scroll to bottom as new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLogs.length])

  const handleCopy = async () => {
    const text = allLogs
      .map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`)
      .join("\n")
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        "border-code-border bg-code-bg text-code-foreground overflow-hidden rounded-xl border shadow-sm backdrop-blur-xs",
        className
      )}
    >
      {/* Console Header */}
      <div className="border-code-border bg-muted/30 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="bg-mac-close h-2.5 w-2.5 rounded-full" />
            <span className="bg-mac-minimize h-2.5 w-2.5 rounded-full" />
            <span className="bg-mac-maximize h-2.5 w-2.5 rounded-full" />
          </div>
          <div className="text-foreground ml-2 flex items-center gap-1.5 text-xs font-semibold">
            <Terminal className="text-muted-foreground h-3.5 w-3.5" />
            <span>Execution Terminal & Audit Trail</span>
          </div>
          <Badge
            variant="outline"
            className="text-muted-foreground bg-muted/40 border-code-border font-mono text-[10px]"
          >
            {job.source_table} ➔ {job.target_table}
          </Badge>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Level Filter Pills */}
          <div className="border-border/60 bg-muted/50 flex items-center gap-1 rounded-md border p-0.5 text-[10px]">
            {(["ALL", "INFO", "BATCH", "ERROR"] as FilterLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setActiveFilter(lvl)}
                className={cn(
                  "cursor-pointer rounded px-2 py-0.5 font-mono transition-colors",
                  activeFilter === lvl
                    ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Copy Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/60 h-6 gap-1 px-2 text-[11px]"
          >
            {copied ? (
              <Check className="text-success h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
      </div>

      {/* Terminal Output Body */}
      <div
        ref={logContainerRef}
        className="max-h-60 min-h-40 overflow-y-auto p-3.5 font-mono text-xs leading-relaxed"
      >
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="hover:bg-muted/30 flex items-start gap-2.5 rounded-xs px-1 py-1 transition-colors"
          >
            <span className="text-muted-foreground/60 shrink-0 text-[11px]">
              [{log.timestamp}]
            </span>
            <span
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold",
                log.level === "INFO" &&
                  "border-info/30 bg-info/10 text-info border",
                log.level === "STREAM" &&
                  "border-primary/30 bg-primary/10 text-primary border",
                log.level === "BATCH" &&
                  "border-secondary/30 bg-secondary/10 text-secondary border",
                log.level === "SUCCESS" &&
                  "border-success/30 bg-success/10 text-success border",
                log.level === "WARN" &&
                  "border-warning/30 bg-warning/10 text-warning border",
                log.level === "ERROR" &&
                  "border-destructive/30 bg-destructive/10 text-destructive border"
              )}
            >
              {log.level}
            </span>
            <span
              className={cn(
                "text-foreground/90 text-[11px] break-all",
                log.level === "SUCCESS" && "text-success font-medium",
                log.level === "ERROR" && "text-destructive font-medium"
              )}
            >
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
