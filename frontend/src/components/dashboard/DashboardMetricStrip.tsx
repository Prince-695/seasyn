import { Zap, Activity, Server, FolderKanban } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  primaryValue: string | number
  subtitle: string
}

function MetricCard({
  title,
  icon: Icon,
  iconBg,
  iconColor,
  primaryValue,
  subtitle,
}: MetricCardProps) {
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium uppercase">
          {title}
        </span>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2.5">
        <p className="text-foreground font-mono text-2xl font-medium">
          {primaryValue}
        </p>
        <p className="text-muted-foreground mt-0.5 text-[11px]">{subtitle}</p>
      </div>
    </div>
  )
}

interface DashboardMetricStripProps {
  runningPipelines: number
  totalPipelines: number
  totalRowsSynced: number
  totalDatabases: number
  totalProjects: number
  orgName: string
}

export function DashboardMetricStrip({
  runningPipelines,
  totalPipelines,
  totalRowsSynced,
  totalDatabases,
  totalProjects,
  orgName,
}: DashboardMetricStripProps) {
  const metrics: MetricCardProps[] = [
    {
      title: "Active Pipelines",
      icon: Zap,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      primaryValue:
        runningPipelines > 0
          ? `${runningPipelines} active`
          : `${totalPipelines} total`,
      subtitle:
        runningPipelines > 0
          ? "In-flight live replication"
          : "Configured migration jobs",
    },
    {
      title: "Synced Records",
      icon: Activity,
      iconBg: "bg-info/10",
      iconColor: "text-info",
      primaryValue:
        totalRowsSynced > 0 ? totalRowsSynced.toLocaleString() : "0 rec",
      subtitle: "Zero data loss in-flight",
    },
    {
      title: "Databases",
      icon: Server,
      iconBg: "bg-success/10",
      iconColor: "text-success",
      primaryValue: totalDatabases,
      subtitle: "Verified database adapters",
    },
    {
      title: "Projects",
      icon: FolderKanban,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      primaryValue: totalProjects,
      subtitle: `Workspaces in ${orgName}`,
    },
  ]

  return (
    <div className="border-border bg-card/60 overflow-hidden rounded-xl border shadow-xs">
      <div className="divide-border/60 grid grid-cols-2 divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="border-border/60 bg-muted/20 text-muted-foreground border-t px-5 py-2.5 text-[11px]">
        Telemetry metrics for organization{" "}
        <span className="text-foreground font-medium">{orgName}</span>.
        Synchronized in real-time across all database adapters.
      </div>
    </div>
  )
}
