import type { DBType } from "./index"

export interface QuotaUsage {
  used: number
  max: number
  percentage: number
}

export interface OrgQuotasSummary {
  projects: QuotaUsage
  members: QuotaUsage
  user_orgs: QuotaUsage
}

export interface ProjectConnectionQuota {
  used: number
  max: number
  sources_count: number
  targets_count: number
}

export interface EngineDistributionItem {
  db_type: DBType
  count: number
  percentage: number
}

export interface MigrationHealthSummary {
  total_jobs: number
  completed: number
  failed: number
  cancelled: number
  running: number
  success_rate: number
  total_rows_migrated: number
}

export interface DailyVelocityPoint {
  date: string
  rows_migrated: number
  jobs_count: number
}

export interface TopologyNode {
  id: string
  name: string
  role: "source" | "target"
  db_type: DBType
  status: string
}

export interface TopologyEdge {
  source_id: string
  target_id: string
  total_rows_transferred: number
  active_pipelines: number
}

export interface TableSyncStat {
  table_name: string
  rows_migrated: number
  sync_runs: number
}

export interface ActivityHeatmapPoint {
  date: string
  events_count: number
}

export interface DurationBucket {
  bucket: string
  count: number
  percentage: number
}

export interface ErrorClassification {
  error_type: string
  count: number
}

export interface MigrationIntelligenceSummary {
  total_pipelines: number
  total_rows_synced: number
  avg_throughput_rps: number
  avg_duration_seconds: number
}

export interface OrgAnalyticsOverview {
  quotas: OrgQuotasSummary
  engine_distribution: EngineDistributionItem[]
  migration_health: MigrationHealthSummary
  velocity_timeline: DailyVelocityPoint[]
}

export interface ProjectAnalytics {
  connection_quota: ProjectConnectionQuota
  topology_nodes: TopologyNode[]
  topology_edges: TopologyEdge[]
  top_tables: TableSyncStat[]
  activity_heatmap: ActivityHeatmapPoint[]
}

export interface MigrationAnalytics {
  summary: MigrationIntelligenceSummary
  duration_distribution: DurationBucket[]
  error_breakdown: ErrorClassification[]
}
