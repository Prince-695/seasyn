import type { ReactNode } from "react"
import {
  HardDrive,
  Cpu,
  Layers,
  Activity,
  Database,
  Server,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { MigrationResourceStats } from "@/lib/migrationMetrics"
import { cn } from "@/lib/utils"

interface StatCellProps {
  label: string
  rightHeader?: ReactNode
  value: ReactNode
  subValue?: ReactNode
  caption: string
  customContent?: ReactNode
}

function StatCell({
  label,
  rightHeader,
  value,
  subValue,
  caption,
  customContent,
}: StatCellProps) {
  return (
    <div className="border-border/40 bg-muted/20 rounded-lg border p-2.5">
      <div className="text-muted-foreground flex items-center justify-between text-[10px] font-medium uppercase">
        <span>{label}</span>
        {rightHeader}
      </div>
      {customContent ? (
        customContent
      ) : (
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-foreground font-mono text-base font-bold">
            {value}
          </span>
          {subValue && (
            <span className="text-muted-foreground/70 font-mono text-[10px]">
              {subValue}
            </span>
          )}
        </div>
      )}
      <p className="text-muted-foreground mt-0.5 text-[10px]">{caption}</p>
    </div>
  )
}

interface MetricPanelProps {
  title: string
  subtitle: string
  icon: LucideIcon
  badge: ReactNode
  cells: StatCellProps[]
}

function MetricPanel({
  title,
  subtitle,
  icon: Icon,
  badge,
  cells,
}: MetricPanelProps) {
  return (
    <div className="border-border/60 bg-card/40 rounded-xl border p-4 shadow-2xs backdrop-blur-xs">
      <div className="border-border/40 flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="border-border/50 bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg border">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-foreground text-sm font-bold">{title}</h3>
            <p className="text-muted-foreground text-[10px]">{subtitle}</p>
          </div>
        </div>
        {badge}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        {cells.map((cell) => (
          <StatCell key={cell.label} {...cell} />
        ))}
      </div>
    </div>
  )
}

interface ResourceMetricsGridProps {
  stats: MigrationResourceStats
  isConnected?: boolean
  className?: string
}

export function ResourceMetricsGrid({
  stats,
  isConnected = false,
  className,
}: ResourceMetricsGridProps) {
  const pressureColor =
    stats.bufferPressure === "Optimal"
      ? "text-success bg-success/10 border-success/30"
      : stats.bufferPressure === "Nominal"
        ? "text-primary bg-primary/10 border-primary/30"
        : "text-warning bg-warning/10 border-warning/30"

  const transferCells: StatCellProps[] = [
    {
      label: "Data Moved",
      value: stats.formattedMigratedBytes,
      subValue: `/ ${stats.formattedTotalBytes}`,
      caption:
        stats.transferRateFormatted !== "0 B/s"
          ? `Transferring at ${stats.transferRateFormatted}`
          : "Total data committed",
    },
    {
      label: "Batch Size",
      value: stats.batchSize.toLocaleString(),
      subValue: "rows/batch",
      caption: `~${stats.formattedBatchPayload} per batch`,
    },
    {
      label: "Batches Done",
      rightHeader: <Layers className="text-muted-foreground/60 h-3 w-3" />,
      value: stats.completedBatches,
      subValue: `of ${stats.totalBatches}`,
      caption: "Processed in safe chunks",
    },
    {
      label: "Estimated Table Size",
      rightHeader: <Database className="text-muted-foreground/60 h-3 w-3" />,
      value: stats.formattedTotalBytes,
      caption: "Total expected size",
    },
  ]

  const performanceCells: StatCellProps[] = [
    {
      label: "System Load",
      rightHeader: <span className="font-mono">{stats.bufferPressurePercent}%</span>,
      value: "",
      caption: "Running smoothly",
      customContent: (
        <div className="bg-muted/60 mt-2 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              stats.bufferPressure === "Optimal"
                ? "bg-success"
                : stats.bufferPressure === "Nominal"
                  ? "bg-primary"
                  : "bg-warning"
            )}
            style={{ width: `${stats.bufferPressurePercent}%` }}
          />
        </div>
      ),
    },
    {
      label: "Memory Used",
      rightHeader: <Server className="text-muted-foreground/60 h-3 w-3" />,
      value: stats.formattedInFlightMemory,
      caption: "Temporary stream buffer",
    },
    {
      label: "Transfer Mode",
      rightHeader: <Activity className="text-muted-foreground/60 h-3 w-3" />,
      value: "Direct Sync",
      caption: "Direct database to database",
    },
    {
      label: "Live Connection",
      rightHeader: (
        <span
          className={cn(
            "font-mono text-[9px] font-semibold",
            isConnected ? "text-success" : "text-muted-foreground"
          )}
        >
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      ),
      value: `${stats.latencyMs} ms`,
      subValue: "ping",
      caption: "Real-time live updates",
    },
  ]

  return (
    <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-2", className)}>
      <MetricPanel
        title="Data & Transfer Details"
        subtitle="Batch size and storage volume"
        icon={HardDrive}
        badge={
          <Badge variant="outline" className="font-mono text-[10px]">
            ~{stats.formattedAvgRowBytes} / row
          </Badge>
        }
        cells={transferCells}
      />
      <MetricPanel
        title="System Performance"
        subtitle="Memory usage and stream health"
        icon={Cpu}
        badge={
          <Badge
            variant="outline"
            className={cn("border font-mono text-[10px]", pressureColor)}
          >
            Status: {stats.bufferPressure}
          </Badge>
        }
        cells={performanceCells}
      />
    </div>
  )
}
