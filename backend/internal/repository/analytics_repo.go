package repository

import (
	"context"
	"sort"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"gorm.io/gorm"
)

type analyticsRepo struct {
	db *gorm.DB
}

// NewAnalyticsRepository creates a new AnalyticsRepository backed by GORM.
func NewAnalyticsRepository(db *gorm.DB) ports.AnalyticsRepository {
	return &analyticsRepo{db: db}
}

func (r *analyticsRepo) GetOrgAnalyticsOverview(ctx context.Context, orgID, userID string) (*domain.OrgAnalyticsOverview, error) {
	// 1. Quotas
	var projCount int64
	_ = r.db.WithContext(ctx).Model(&ProjectModel{}).Where("organization_id = ?", orgID).Count(&projCount).Error

	var memberCount int64
	_ = r.db.WithContext(ctx).Model(&OrgMemberModel{}).Where("organization_id = ?", orgID).Count(&memberCount).Error

	var userOrgCount int64
	_ = r.db.WithContext(ctx).Model(&OrgMemberModel{}).Where("user_id = ?", userID).Count(&userOrgCount).Error

	projPct := float64(projCount) / 5.0 * 100.0
	if projPct > 100 {
		projPct = 100
	}
	memPct := float64(memberCount) / 5.0 * 100.0
	if memPct > 100 {
		memPct = 100
	}
	userOrgPct := float64(userOrgCount) / 3.0 * 100.0
	if userOrgPct > 100 {
		userOrgPct = 100
	}

	quotas := domain.OrgQuotasSummary{
		Projects: domain.QuotaUsage{Used: projCount, Max: 5, Percentage: projPct},
		Members:  domain.QuotaUsage{Used: memberCount, Max: 5, Percentage: memPct},
		UserOrgs: domain.QuotaUsage{Used: userOrgCount, Max: 3, Percentage: userOrgPct},
	}

	// 2. Engine Distribution across organization connections
	type dbTypeCount struct {
		DBType string `gorm:"column:db_type"`
		Count  int64  `gorm:"column:count"`
	}
	var engineCounts []dbTypeCount
	_ = r.db.WithContext(ctx).Table("database_connections").
		Joins("JOIN projects ON database_connections.project_id = projects.id").
		Where("projects.organization_id = ?", orgID).
		Select("database_connections.db_type as db_type, count(*) as count").
		Group("database_connections.db_type").
		Scan(&engineCounts).Error

	var totalConns int64
	for _, ec := range engineCounts {
		totalConns += ec.Count
	}

	var engineDist []domain.EngineDistributionItem
	for _, ec := range engineCounts {
		pct := 0.0
		if totalConns > 0 {
			pct = float64(ec.Count) / float64(totalConns) * 100.0
		}
		engineDist = append(engineDist, domain.EngineDistributionItem{
			DBType:     domain.DBType(ec.DBType),
			Count:      ec.Count,
			Percentage: pct,
		})
	}

	// 3. Migration health & 30-day velocity timeline
	var jobs []MigrationJobModel
	_ = r.db.WithContext(ctx).Where("organization_id = ?", orgID).Order("created_at ASC").Find(&jobs).Error

	var (
		totalJobs         int64
		completedJobs     int64
		failedJobs        int64
		cancelledJobs     int64
		runningJobs       int64
		totalRowsMigrated int64
	)

	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	timelineMap := make(map[string]*domain.DailyVelocityPoint)

	for _, j := range jobs {
		totalJobs++
		totalRowsMigrated += j.MigratedRows

		switch domain.MigrationStatus(j.Status) {
		case domain.MigrationStatusCompleted:
			completedJobs++
		case domain.MigrationStatusFailed:
			failedJobs++
		case domain.MigrationStatusCancelled:
			cancelledJobs++
		case domain.MigrationStatusRunning:
			runningJobs++
		}

		if j.CreatedAt.After(thirtyDaysAgo) {
			dayKey := j.CreatedAt.Format("2006-01-02")
			pt, exists := timelineMap[dayKey]
			if !exists {
				pt = &domain.DailyVelocityPoint{Date: dayKey}
				timelineMap[dayKey] = pt
			}
			pt.RowsMigrated += j.MigratedRows
			pt.JobsCount++
		}
	}

	var successRate float64
	if totalJobs > 0 {
		successRate = float64(completedJobs) / float64(totalJobs) * 100.0
	}

	health := domain.MigrationHealthSummary{
		TotalJobs:         totalJobs,
		Completed:         completedJobs,
		Failed:            failedJobs,
		Cancelled:         cancelledJobs,
		Running:           runningJobs,
		SuccessRate:       successRate,
		TotalRowsMigrated: totalRowsMigrated,
	}

	var timeline []domain.DailyVelocityPoint
	for _, pt := range timelineMap {
		timeline = append(timeline, *pt)
	}
	sort.Slice(timeline, func(i, j int) bool {
		return timeline[i].Date < timeline[j].Date
	})

	return &domain.OrgAnalyticsOverview{
		Quotas:             quotas,
		EngineDistribution: engineDist,
		MigrationHealth:    health,
		VelocityTimeline:   timeline,
	}, nil
}

func (r *analyticsRepo) GetProjectAnalytics(ctx context.Context, orgID, projectID string) (*domain.ProjectAnalytics, error) {
	// 1. Connection Quota
	var sourcesCount, targetsCount int64
	_ = r.db.WithContext(ctx).Model(&DatabaseConnectionModel{}).Where("project_id = ? AND is_source = ?", projectID, true).Count(&sourcesCount).Error
	_ = r.db.WithContext(ctx).Model(&DatabaseConnectionModel{}).Where("project_id = ? AND is_source = ?", projectID, false).Count(&targetsCount).Error

	connQuota := domain.ProjectConnectionQuota{
		Used:         sourcesCount + targetsCount,
		Max:          6,
		SourcesCount: sourcesCount,
		TargetsCount: targetsCount,
	}

	// 2. Topology Nodes
	var conns []DatabaseConnectionModel
	_ = r.db.WithContext(ctx).Where("project_id = ?", projectID).Find(&conns).Error

	var nodes []domain.TopologyNode
	for _, c := range conns {
		role := "target"
		if c.IsSource {
			role = "source"
		}
		nodes = append(nodes, domain.TopologyNode{
			ID:     c.ID,
			Name:   c.Name,
			Role:   role,
			DBType: domain.DBType(c.DBType),
			Status: "online",
		})
	}

	// 3. Topology Edges and Table Stats
	var jobs []MigrationJobModel
	_ = r.db.WithContext(ctx).Where("project_id = ?", projectID).Find(&jobs).Error

	type edgeKey struct {
		src string
		tgt string
	}
	edgesMap := make(map[edgeKey]*domain.TopologyEdge)
	tableStatsMap := make(map[string]*domain.TableSyncStat)

	fourteenDaysAgo := time.Now().AddDate(0, 0, -14)
	heatmapMap := make(map[string]*domain.ActivityHeatmapPoint)

	for _, j := range jobs {
		// Edges
		k := edgeKey{src: j.SourceConnID, tgt: j.TargetConnID}
		edge, exists := edgesMap[k]
		if !exists {
			edge = &domain.TopologyEdge{SourceID: j.SourceConnID, TargetID: j.TargetConnID}
			edgesMap[k] = edge
		}
		edge.TotalRowsTransferred += j.MigratedRows
		if domain.MigrationStatus(j.Status) == domain.MigrationStatusRunning {
			edge.ActivePipelines++
		}

		// Top Tables
		stat, tExists := tableStatsMap[j.SourceTable]
		if !tExists {
			stat = &domain.TableSyncStat{TableName: j.SourceTable}
			tableStatsMap[j.SourceTable] = stat
		}
		stat.RowsMigrated += j.MigratedRows
		stat.SyncRuns++

		// 14-day Heatmap
		if j.CreatedAt.After(fourteenDaysAgo) {
			dayKey := j.CreatedAt.Format("2006-01-02")
			hPoint, hExists := heatmapMap[dayKey]
			if !hExists {
				hPoint = &domain.ActivityHeatmapPoint{Date: dayKey}
				heatmapMap[dayKey] = hPoint
			}
			hPoint.EventsCount++
		}
	}

	var edges []domain.TopologyEdge
	for _, e := range edgesMap {
		edges = append(edges, *e)
	}

	var topTables []domain.TableSyncStat
	for _, s := range tableStatsMap {
		topTables = append(topTables, *s)
	}
	sort.Slice(topTables, func(i, j int) bool {
		return topTables[i].RowsMigrated > topTables[j].RowsMigrated
	})
	if len(topTables) > 5 {
		topTables = topTables[:5]
	}

	var heatmap []domain.ActivityHeatmapPoint
	for _, h := range heatmapMap {
		heatmap = append(heatmap, *h)
	}
	sort.Slice(heatmap, func(i, j int) bool {
		return heatmap[i].Date < heatmap[j].Date
	})

	return &domain.ProjectAnalytics{
		ConnectionQuota: connQuota,
		TopologyNodes:   nodes,
		TopologyEdges:   edges,
		TopTables:       topTables,
		ActivityHeatmap: heatmap,
	}, nil
}

func (r *analyticsRepo) GetMigrationAnalytics(ctx context.Context, orgID, projectID string) (*domain.MigrationAnalytics, error) {
	var jobs []MigrationJobModel
	_ = r.db.WithContext(ctx).Where("project_id = ?", projectID).Find(&jobs).Error

	var (
		totalPipelines   int64
		totalRowsSynced  int64
		totalDurationSec float64
		completedCount   int64
	)

	var bucketLess1Min, bucket1to5Min, bucket5to15Min, bucketOver15Min int64
	errorMap := make(map[string]int64)

	for _, j := range jobs {
		totalPipelines++
		totalRowsSynced += j.MigratedRows

		if domain.MigrationStatus(j.Status) == domain.MigrationStatusCompleted && j.StartedAt != nil && j.CompletedAt != nil {
			durSec := j.CompletedAt.Sub(*j.StartedAt).Seconds()
			if durSec > 0 {
				totalDurationSec += durSec
				completedCount++

				if durSec < 60 {
					bucketLess1Min++
				} else if durSec <= 300 {
					bucket1to5Min++
				} else if durSec <= 900 {
					bucket5to15Min++
				} else {
					bucketOver15Min++
				}
			}
		}

		if domain.MigrationStatus(j.Status) == domain.MigrationStatusFailed && j.ErrorMessage != "" {
			errorMap[j.ErrorMessage]++
		}
	}

	var avgDuration float64
	var avgRPS float64
	if completedCount > 0 && totalDurationSec > 0 {
		avgDuration = totalDurationSec / float64(completedCount)
		avgRPS = float64(totalRowsSynced) / totalDurationSec
	}

	summary := domain.MigrationIntelligenceSummary{
		TotalPipelines:     totalPipelines,
		TotalRowsSynced:    totalRowsSynced,
		AvgThroughputRPS:   avgRPS,
		AvgDurationSeconds: avgDuration,
	}

	totalBucketed := completedCount
	getPercentage := func(count int64) float64 {
		if totalBucketed == 0 {
			return 0
		}
		return float64(count) / float64(totalBucketed) * 100.0
	}

	durationDistribution := []domain.DurationBucket{
		{Bucket: "< 1 min", Count: bucketLess1Min, Percentage: getPercentage(bucketLess1Min)},
		{Bucket: "1 - 5 mins", Count: bucket1to5Min, Percentage: getPercentage(bucket1to5Min)},
		{Bucket: "5 - 15 mins", Count: bucket5to15Min, Percentage: getPercentage(bucket5to15Min)},
		{Bucket: "> 15 mins", Count: bucketOver15Min, Percentage: getPercentage(bucketOver15Min)},
	}

	var errorsList []domain.ErrorClassification
	for errType, count := range errorMap {
		errorsList = append(errorsList, domain.ErrorClassification{
			ErrorType: errType,
			Count:     count,
		})
	}
	sort.Slice(errorsList, func(i, j int) bool {
		return errorsList[i].Count > errorsList[j].Count
	})
	if len(errorsList) > 5 {
		errorsList = errorsList[:5]
	}

	return &domain.MigrationAnalytics{
		Summary:              summary,
		DurationDistribution: durationDistribution,
		ErrorBreakdown:       errorsList,
	}, nil
}
