import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { EngineIcon } from "@/components/connections/EngineIcon"
import type {
  OrgQuotasSummary,
  EngineDistributionItem,
  DailyVelocityPoint,
} from "@/types/analytics"

interface QuotaBarProps {
  label: string
  used: number
  max: number
  percentage: number
  barColor: string
}

function QuotaBar({ label, used, max, percentage, barColor }: QuotaBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-mono font-semibold">
          {used} / {max}
        </span>
      </div>
      <div className="border-border/60 bg-muted/30 mt-1.5 h-1.5 w-full overflow-hidden rounded-xs border">
        <div
          className={`h-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  )
}

function ActivityLineGraph({
  points,
  maxRows,
}: {
  points: DailyVelocityPoint[]
  maxRows: number
}) {
  const w = 280
  const h = 56
  const pad = 6
  const graphW = w - pad * 2
  const graphH = h - pad * 2

  const coords = points.map((p, i) => {
    const x =
      points.length === 1 ? w / 2 : pad + (i / (points.length - 1)) * graphW
    const y =
      maxRows > 0 ? h - pad - (p.rows_migrated / maxRows) * graphH : h - pad
    return { x, y }
  })

  const pathD = coords.reduce(
    (acc, c, i) => `${acc} ${i === 0 ? "M" : "L"} ${c.x} ${c.y}`,
    ""
  )
  const areaD =
    coords.length > 0
      ? `${pathD} L ${coords[coords.length - 1].x} ${h - pad} L ${coords[0].x} ${h - pad} Z`
      : ""

  return (
    <div className="space-y-1.5">
      <div className="w-full">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-16 w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <line
            x1={pad}
            y1={h - pad}
            x2={w - pad}
            y2={h - pad}
            className="stroke-border stroke-1"
            strokeDasharray="2 2"
          />
          <line
            x1={pad}
            y1={h / 2}
            x2={w - pad}
            y2={h / 2}
            className="stroke-border/40 stroke-1"
            strokeDasharray="2 2"
          />

          {areaD && (
            <motion.path
              d={areaD}
              className="fill-primary/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
          )}

          {pathD && (
            <motion.path
              d={pathD}
              fill="none"
              className="stroke-primary stroke-[1.75]"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
          )}

          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={1.75}
              className="fill-primary stroke-card stroke-1"
            />
          ))}
        </svg>
      </div>

      <div className="border-border/60 text-muted-foreground flex items-center justify-between border-t pt-1 font-mono text-[10px]">
        <span>14 days ago</span>
        <span>Today</span>
      </div>
    </div>
  )
}

interface DashboardAnalyticsCardsProps {
  orgName: string
  successRate: number
  quotas: OrgQuotasSummary
  connectionsCount: number
  engineDistribution?: EngineDistributionItem[]
  completedMigrations: number
  velocityTimeline?: DailyVelocityPoint[]
}

export function DashboardAnalyticsCards({
  orgName,
  successRate,
  quotas,
  connectionsCount,
  engineDistribution,
  completedMigrations,
  velocityTimeline,
}: DashboardAnalyticsCardsProps) {
  const quotaItems: QuotaBarProps[] = [
    {
      label: "Projects",
      used: quotas.projects.used,
      max: quotas.projects.max,
      percentage: quotas.projects.percentage,
      barColor: "bg-primary",
    },
    {
      label: "Team Members",
      used: quotas.members.used,
      max: quotas.members.max,
      percentage: quotas.members.percentage,
      barColor: "bg-info",
    },
  ]

  const timelinePoints = velocityTimeline?.slice(-14) ?? []
  const maxRows = Math.max(
    ...(velocityTimeline?.map((p) => p.rows_migrated) ?? []),
    1
  )

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Card 1: Limits */}
      <div className="border-border bg-card/60 rounded-xl border p-4 shadow-xs">
        <div className="border-border/60 flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-foreground text-sm font-semibold sm:text-base">
              Workspace Limits
            </h3>
            <p className="text-muted-foreground text-xs">
              Resource usage for {orgName}
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            {successRate.toFixed(0)}% Success
          </Badge>
        </div>
        <div className="mt-3 space-y-3 text-xs">
          {quotaItems.map((item) => (
            <QuotaBar key={item.label} {...item} />
          ))}
        </div>
      </div>

      {/* Card 2: Engines */}
      <div className="border-border bg-card/60 rounded-xl border p-4 shadow-xs">
        <div className="border-border/60 flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-foreground text-sm font-semibold sm:text-base">
              Database Engines
            </h3>
            <p className="text-muted-foreground text-xs">
              Infrastructure mix in workspace
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            {connectionsCount} Total
          </Badge>
        </div>
        <div className="mt-3 space-y-2">
          {engineDistribution && engineDistribution.length > 0 ? (
            engineDistribution.map((item) => (
              <div
                key={item.db_type}
                className="border-border/60 bg-muted/20 flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <EngineIcon engine={item.db_type} className="h-3.5 w-3.5" />
                  <span className="text-foreground text-xs font-medium capitalize">
                    {item.db_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {item.count} {item.count === 1 ? "db" : "dbs"}
                  </span>
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 font-mono text-[10px]"
                  >
                    {item.percentage.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground py-4 text-center text-xs">
              No databases connected yet.
            </p>
          )}
        </div>
      </div>

      {/* Card 3: Sync Activity Line Graph */}
      <div className="border-border bg-card/60 rounded-xl border p-4 shadow-xs">
        <div className="border-border/60 flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-foreground text-sm font-semibold sm:text-base">
              Sync Activity
            </h3>
            <p className="text-muted-foreground text-xs">
              Past 30 days data transfer
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-success/30 bg-success/10 text-success font-mono text-[10px]"
          >
            {completedMigrations} Completed
          </Badge>
        </div>
        <div className="mt-3">
          {timelinePoints.length > 0 ? (
            <ActivityLineGraph points={timelinePoints} maxRows={maxRows} />
          ) : (
            <p className="text-muted-foreground py-4 text-center text-xs">
              No sync activity recorded in the past 30 days.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
