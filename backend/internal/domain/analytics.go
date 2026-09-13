package domain

// --- Quota Analytics ---

type QuotaUsage struct {
	Used       int64   `json:"used"`
	Max        int64   `json:"max"`
	Percentage float64 `json:"percentage"`
}

type OrgQuotasSummary struct {
	Projects QuotaUsage `json:"projects"`
	Members  QuotaUsage `json:"members"`
	UserOrgs QuotaUsage `json:"user_orgs"`
}

type ProjectConnectionQuota struct {
	Used         int64 `json:"used"`
	Max          int64 `json:"max"`
	SourcesCount int64 `json:"sources_count"`
	TargetsCount int64 `json:"targets_count"`
}

// --- Engine Distribution ---

type EngineDistributionItem struct {
	DBType     DBType  `json:"db_type"`
	Count      int64   `json:"count"`
	Percentage float64 `json:"percentage"`
}

// --- Migration Health & Timeline ---

type MigrationHealthSummary struct {
	TotalJobs         int64   `json:"total_jobs"`
	Completed         int64   `json:"completed"`
	Failed            int64   `json:"failed"`
	Cancelled         int64   `json:"cancelled"`
	Running           int64   `json:"running"`
	SuccessRate       float64 `json:"success_rate"`
	TotalRowsMigrated int64   `json:"total_rows_migrated"`
}

type DailyVelocityPoint struct {
	Date         string `json:"date"`
	RowsMigrated int64  `json:"rows_migrated"`
	JobsCount    int64  `json:"jobs_count"`
}

// --- Topology Visual Diagram ---

type TopologyNode struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Role   string `json:"role"` // "source" or "target"
	DBType DBType `json:"db_type"`
	Status string `json:"status"` // "online" or "active"
}

type TopologyEdge struct {
	SourceID             string `json:"source_id"`
	TargetID             string `json:"target_id"`
	TotalRowsTransferred int64  `json:"total_rows_transferred"`
	ActivePipelines      int64  `json:"active_pipelines"`
}

type TableSyncStat struct {
	TableName    string `json:"table_name"`
	RowsMigrated int64  `json:"rows_migrated"`
	SyncRuns     int64  `json:"sync_runs"`
}

type ActivityHeatmapPoint struct {
	Date        string `json:"date"`
	EventsCount int64  `json:"events_count"`
}

// --- Migration Intelligence & Duration Histogram ---

type DurationBucket struct {
	Bucket     string  `json:"bucket"` // "< 1 min", "1 - 5 mins", "5 - 15 mins", "> 15 mins"
	Count      int64   `json:"count"`
	Percentage float64 `json:"percentage"`
}

type ErrorClassification struct {
	ErrorType string `json:"error_type"`
	Count     int64  `json:"count"`
}

type MigrationIntelligenceSummary struct {
	TotalPipelines     int64   `json:"total_pipelines"`
	TotalRowsSynced    int64   `json:"total_rows_synced"`
	AvgThroughputRPS   float64 `json:"avg_throughput_rps"`
	AvgDurationSeconds float64 `json:"avg_duration_seconds"`
}

// --- Main API Response Payloads ---

type OrgAnalyticsOverview struct {
	Quotas             OrgQuotasSummary         `json:"quotas"`
	EngineDistribution []EngineDistributionItem `json:"engine_distribution"`
	MigrationHealth    MigrationHealthSummary   `json:"migration_health"`
	VelocityTimeline   []DailyVelocityPoint     `json:"velocity_timeline"`
}

type ProjectAnalytics struct {
	ConnectionQuota ProjectConnectionQuota `json:"connection_quota"`
	TopologyNodes   []TopologyNode         `json:"topology_nodes"`
	TopologyEdges   []TopologyEdge         `json:"topology_edges"`
	TopTables       []TableSyncStat        `json:"top_tables"`
	ActivityHeatmap []ActivityHeatmapPoint `json:"activity_heatmap"`
}

type MigrationAnalytics struct {
	Summary              MigrationIntelligenceSummary `json:"summary"`
	DurationDistribution []DurationBucket             `json:"duration_distribution"`
	ErrorBreakdown       []ErrorClassification        `json:"error_breakdown"`
}
