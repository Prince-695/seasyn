package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"math"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"gorm.io/gorm"
)

type auditRepo struct {
	db *gorm.DB
}

// NewAuditRepository creates a new AuditRepository backed by GORM.
func NewAuditRepository(db *gorm.DB) ports.AuditRepository {
	return &auditRepo{db: db}
}

func (r *auditRepo) Create(ctx context.Context, log domain.AuditLog) error {
	var metaJSON string
	if log.Metadata != nil {
		if b, err := json.Marshal(log.Metadata); err == nil {
			metaJSON = string(b)
		}
	}

	model := AuditLogModel{
		OrgID:        log.OrgID,
		ProjectID:    log.ProjectID,
		UserID:       log.UserID,
		UserEmail:    log.UserEmail,
		Action:       string(log.Action),
		ResourceType: log.ResourceType,
		ResourceID:   log.ResourceID,
		Metadata:     metaJSON,
		IPAddress:    log.IPAddress,
		UserAgent:    log.UserAgent,
	}

	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return fmt.Errorf("create audit log: %w", err)
	}
	return nil
}

func (r *auditRepo) List(ctx context.Context, filter domain.AuditLogFilter) (*domain.AuditLogListResponse, error) {
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	query := r.db.WithContext(ctx).Model(&AuditLogModel{}).Where("org_id = ?", filter.OrgID)

	if filter.ProjectID != "" {
		query = query.Where("project_id = ?", filter.ProjectID)
	}
	if filter.UserID != "" {
		query = query.Where("user_id = ?", filter.UserID)
	}
	if filter.Action != "" {
		query = query.Where("action = ?", string(filter.Action))
	}

	var totalCount int64
	if err := query.Count(&totalCount).Error; err != nil {
		return nil, fmt.Errorf("count audit logs: %w", err)
	}

	var models []AuditLogModel
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&models).Error; err != nil {
		return nil, fmt.Errorf("list audit logs: %w", err)
	}

	var logs []domain.AuditLog
	for _, m := range models {
		logs = append(logs, m.ToDomain())
	}

	totalPages := int(math.Ceil(float64(totalCount) / float64(limit)))

	return &domain.AuditLogListResponse{
		Logs:       logs,
		TotalCount: totalCount,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}
