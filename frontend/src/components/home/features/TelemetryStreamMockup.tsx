import { useState, useEffect } from "react"
import { Activity } from "lucide-react"

const TOTAL_RECORDS = 3000000
const INITIAL_RECORDS = 2450000

interface MetricBadge {
  title: string
  value: string
  tag: string
  tagBg: string
  tagColor: string
}

export const TelemetryStreamMockup = () => {
  const [syncedRecords, setSyncedRecords] = useState(INITIAL_RECORDS)
  const [rate, setRate] = useState(125480)
  const [latency, setLatency] = useState("0.4")
  const [ram, setRam] = useState(38)

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncedRecords((prev) => {
        const increment = Math.floor(Math.random() * 1400) + 1200
        const next = prev + increment
        if (next >= TOTAL_RECORDS - 8000) {
          return INITIAL_RECORDS
        }
        return next
      })

      setRate(124800 + Math.floor(Math.random() * 1600))
      setLatency((0.35 + Math.random() * 0.15).toFixed(1))
      setRam(Math.random() > 0.65 ? 39 : 38)
    }, 240)

    return () => clearInterval(interval)
  }, [])

  const progressPercent = Math.min(
    100,
    (syncedRecords / TOTAL_RECORDS) * 100
  ).toFixed(1)

  const metricBadges: MetricBadge[] = [
    {
      title: "RAM Overhead",
      value: `${ram} MB`,
      tag: "Adaptive",
      tagBg: "bg-accent/15",
      tagColor: "text-accent",
    },
    {
      title: "P99 Latency",
      value: `${latency} ms`,
      tag: "Real-time",
      tagBg: "bg-primary/15",
      tagColor: "text-primary",
    },
  ]

  return (
    <div className="bg-muted/40 dark:bg-muted/15 border-border/40 relative flex h-full min-h-42.5 w-full items-center justify-center overflow-hidden rounded-xl border p-3">
      <div className="bg-card border-border flex w-full max-w-md flex-col gap-2.5 rounded-lg border p-3.5 shadow-sm">
        {/* Header with Live Throughput */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-primary h-4 w-4 animate-pulse" />
            <span className="text-foreground text-xs font-semibold">
              Live Migration Stream
            </span>
          </div>
          <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold">
            <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
            {rate.toLocaleString()} rec/s
          </span>
        </div>

        {/* Progress Bar */}
        <div className="bg-muted/60 relative h-2.5 w-full overflow-hidden rounded-full">
          <div
            style={{ width: `${progressPercent}%` }}
            className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
          />
        </div>

        <div className="text-muted-foreground flex items-center justify-between text-[11px]">
          <span>Synchronizing records</span>
          <span className="text-foreground font-mono font-medium">
            {syncedRecords.toLocaleString()} / {TOTAL_RECORDS.toLocaleString()}
          </span>
        </div>

        {/* Metric Badges mapped from array */}
        <div className="grid grid-cols-2 gap-2">
          {metricBadges.map((badge) => (
            <div
              key={badge.title}
              className="bg-muted/40 border-border/50 rounded-lg border p-2"
            >
              <span className="text-muted-foreground block text-[9px] font-semibold tracking-wider uppercase">
                {badge.title}
              </span>
              <div className="mt-0.5 flex items-center justify-between">
                <span className="text-foreground font-mono text-xs font-bold">
                  {badge.value}
                </span>
                <span
                  className={`py-0.2 rounded px-1.5 text-[9px] font-bold ${badge.tagBg} ${badge.tagColor}`}
                >
                  {badge.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
