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
      <div className="bg-muted/50 mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
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
      {/* Card 1: Workspace Limits & Quotas */}
      <div className="border-border/70 bg-card/50 rounded-2xl border p-4 shadow-xs backdrop-blur-xs">
        <div className="border-border/50 flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-foreground text-sm font-bold tracking-tight sm:text-base">
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

      {/* Card 2: Connected Database Types */}
      <div className="border-border/70 bg-card/50 rounded-2xl border p-4 shadow-xs backdrop-blur-xs">
        <div className="border-border/50 flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-foreground text-sm font-bold tracking-tight sm:text-base">
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
                className="border-border/40 bg-muted/20 flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs"
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

      {/* Card 3: 30-Day Activity Trend */}
      <div className="border-border/70 bg-card/50 rounded-2xl border p-4 shadow-xs backdrop-blur-xs">
        <div className="border-border/50 flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-foreground text-sm font-bold tracking-tight sm:text-base">
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
            <div className="space-y-2">
              <div className="flex h-16 items-end justify-between gap-1 pt-2">
                {timelinePoints.map((point) => {
                  const heightPct = Math.max(
                    12,
                    Math.round((point.rows_migrated / maxRows) * 100)
                  )
                  return (
                    <div
                      key={point.date}
                      className="group relative flex h-full flex-1 flex-col items-center justify-end"
                      title={`${point.date}: ${point.rows_migrated.toLocaleString()} rows (${point.jobs_count} jobs)`}
                    >
                      <div
                        className="bg-primary/80 hover:bg-primary w-full rounded-t transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="border-border/40 text-muted-foreground flex items-center justify-between border-t pt-1.5 font-mono text-[10px]">
                <span>14 days ago</span>
                <span>Today</span>
              </div>
            </div>
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
