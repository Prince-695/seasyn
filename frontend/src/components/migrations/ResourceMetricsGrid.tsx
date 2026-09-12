import {
  HardDrive,
  Cpu,
  Layers,
  Activity,
  Database,
  Server,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { MigrationResourceStats } from "@/lib/migrationMetrics"
import { cn } from "@/lib/utils"

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

  return (
    <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-2", className)}>
      {/* 1. Storage & Data Payload Footprint */}
      <div className="border-border/60 bg-card/40 rounded-xl border p-4 shadow-2xs backdrop-blur-xs">
        <div className="border-border/40 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="border-border/50 bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg border">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-foreground text-xs font-bold">
                Storage & Data Footprint
              </h3>
              <p className="text-muted-foreground text-[10px]">
                Payload volume and table chunk serialization
              </p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            {stats.formattedAvgRowBytes} / row avg
          </Badge>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          {/* Transferred Bytes */}
          <div className="border-border/40 bg-muted/20 rounded-lg border p-2.5">
            <span className="text-muted-foreground block text-[10px] font-medium uppercase">
              Transferred Volume
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-foreground font-mono text-base font-bold">
                {stats.formattedMigratedBytes}
              </span>
              <span className="text-muted-foreground/70 font-mono text-[10px]">
                / {stats.formattedTotalBytes}
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-[10px]">
              {stats.transferRateFormatted !== "0 B/s"
                ? `Syncing at ${stats.transferRateFormatted}`
                : "Cumulative bytes committed"}
            </p>
          </div>

          {/* Batch Footprint */}
          <div className="border-border/40 bg-muted/20 rounded-lg border p-2.5">
            <span className="text-muted-foreground block text-[10px] font-medium uppercase">
              Batch Chunk Size
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-foreground font-mono text-base font-bold">
                {stats.batchSize.toLocaleString()}
              </span>
              <span className="text-muted-foreground/70 text-[10px]">
                rows/chunk
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-[10px]">
              Batch payload: ~{stats.formattedBatchPayload}
            </p>
          </div>

          {/* Batches Progress */}
          <div className="border-border/40 bg-muted/20 rounded-lg border p-2.5">
            <span className="text-muted-foreground flex items-center justify-between text-[10px] font-medium uppercase">
              <span>Batch Execution</span>
              <Layers className="text-muted-foreground/60 h-3 w-3" />
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-foreground font-mono text-base font-bold">
                {stats.completedBatches}
              </span>
              <span className="text-muted-foreground font-mono text-[10px]">
                of {stats.totalBatches} completed
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-[10px]">
              Atomic transaction boundary
            </p>
          </div>

          {/* Estimated Table Footprint */}
          <div className="border-border/40 bg-muted/20 rounded-lg border p-2.5">
            <span className="text-muted-foreground flex items-center justify-between text-[10px] font-medium uppercase">
              <span>Total Table Footprint</span>
              <Database className="text-muted-foreground/60 h-3 w-3" />
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-foreground font-mono text-base font-bold">
                {stats.formattedTotalBytes}
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-[10px]">
              Calculated from schema types
            </p>
          </div>
        </div>
      </div>

      {/* 2. Compute, Buffer & Stream Diagnostics */}
      <div className="border-border/60 bg-card/40 rounded-xl border p-4 shadow-2xs backdrop-blur-xs">
        <div className="border-border/40 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="border-border/50 bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg border">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-foreground text-xs font-bold">
                Compute & Buffer Diagnostics
              </h3>
              <p className="text-muted-foreground text-[10px]">
                In-memory worker concurrency and channel pressure
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("border font-mono text-[10px]", pressureColor)}
          >
            Buffer: {stats.bufferPressure}
          </Badge>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          {/* Stream Buffer Load */}
          <div className="border-border/40 bg-muted/20 rounded-lg border p-2.5">
            <div className="text-muted-foreground flex items-center justify-between text-[10px] font-medium uppercase">
              <span>Buffer Pressure</span>
              <span className="font-mono">{stats.bufferPressurePercent}%</span>
            </div>
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
            <p className="text-muted-foreground mt-1 text-[10px]">
              Zero queue backpressure
            </p>
          </div>

          {/* Active Memory Buffer */}
          <div className="border-border/40 bg-muted/20 rounded-lg border p-2.5">
            <span className="text-muted-foreground flex items-center justify-between text-[10px] font-medium uppercase">
              <span>In-Flight Buffer RAM</span>
              <Server className="text-muted-foreground/60 h-3 w-3" />
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-foreground font-mono text-base font-bold">
                {stats.formattedInFlightMemory}
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-[10px]">
              Worker chunk heap allocation
            </p>
          </div>

          {/* Concurrency Model */}
          <div className="border-border/40 bg-muted/20 rounded-lg border p-2.5">
            <span className="text-muted-foreground flex items-center justify-between text-[10px] font-medium uppercase">
              <span>Pipeline Concurrency</span>
              <Activity className="text-muted-foreground/60 h-3 w-3" />
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-foreground font-mono text-base font-bold">
                1 Worker
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-[10px]">
              Sequential atomic stream
            </p>
          </div>

          {/* Channel Protocol & Latency */}
          <div className="border-border/40 bg-muted/20 rounded-lg border p-2.5">
            <span className="text-muted-foreground flex items-center justify-between text-[10px] font-medium uppercase">
              <span>Telemetry Channel</span>
              <span
                className={cn(
                  "font-mono text-[9px] font-semibold",
                  isConnected ? "text-success" : "text-muted-foreground"
                )}
              >
                {isConnected ? "SSE Active" : "SSE Closed"}
              </span>
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-foreground font-mono text-base font-bold">
                {stats.latencyMs} ms
              </span>
              <span className="text-muted-foreground text-[10px]">ping</span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-[10px]">
              HTTP/2 Server-Sent Events
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
