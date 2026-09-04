import { Zap, Clock, Activity, Radio } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { MigrationStatus } from "@/types/migration"
import { cn } from "@/lib/utils"

interface ThroughputGaugeProps {
  rowsPerSecond: number
  status: MigrationStatus
  etaFormatted: string | null
  isConnected: boolean
  className?: string
}

export function ThroughputGauge({
  rowsPerSecond,
  status,
  etaFormatted,
  isConnected,
  className,
}: ThroughputGaugeProps) {
  const isStreaming = status === "running"

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-3", className)}>
      {/* 1. Live Speedometer */}
      <Card className="border-border/70 bg-card/60 relative overflow-hidden p-4 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            Throughput Speed
          </span>
          <div className="flex items-center gap-1.5">
            {isStreaming && (
              <span className="relative flex h-2 w-2">
                <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                <span className="bg-success relative inline-flex h-2 w-2 rounded-full"></span>
              </span>
            )}
            <Zap
              className={cn(
                "h-3.5 w-3.5",
                isStreaming ? "text-warning" : "text-muted-foreground"
              )}
            />
          </div>
        </div>

        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-foreground font-mono text-2xl font-bold tracking-tight">
            {isStreaming ? rowsPerSecond.toLocaleString() : "0"}
          </span>
          <span className="text-muted-foreground text-xs font-medium">
            rows/sec
          </span>
        </div>

        <p className="text-muted-foreground mt-1 text-[11px]">
          {isStreaming ? "Dynamic streaming rate" : "Pipeline currently idle"}
        </p>
      </Card>

      {/* 2. Estimated Time Remaining */}
      <Card className="border-border/70 bg-card/60 relative overflow-hidden p-4 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            Est. Remaining
          </span>
          <Clock className="text-muted-foreground h-3.5 w-3.5" />
        </div>

        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-foreground font-mono text-2xl font-bold tracking-tight">
            {isStreaming && etaFormatted
              ? etaFormatted
              : status === "completed"
                ? "Finished"
                : "--"}
          </span>
        </div>

        <p className="text-muted-foreground mt-1 text-[11px]">
          {isStreaming
            ? "Calculated from current throughput"
            : status === "completed"
              ? "All rows synced successfully"
              : "Awaiting active stream"}
        </p>
      </Card>

      {/* 3. SSE Stream Connection Health */}
      <Card className="border-border/70 bg-card/60 relative overflow-hidden p-4 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            Telemetry Channel
          </span>
          <Radio
            className={cn(
              "h-3.5 w-3.5",
              isConnected
                ? "text-success animate-pulse"
                : "text-muted-foreground"
            )}
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Activity
            className={cn(
              "h-5 w-5",
              isConnected ? "text-success" : "text-muted-foreground"
            )}
          />
          <span className="text-foreground font-mono text-sm font-semibold">
            {isConnected
              ? "SSE Stream Connected"
              : status === "completed"
                ? "Stream Closed (Done)"
                : "Disconnected"}
          </span>
        </div>

        <p className="text-muted-foreground mt-1 text-[11px]">
          Server-Sent Events event stream
        </p>
      </Card>
    </div>
  )
}
