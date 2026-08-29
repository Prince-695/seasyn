package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	"gorm.io/gorm"
)

type orgRepo struct {
	db *gorm.DB
}

func NewOrgRepository(db *gorm.DB) ports.OrgRepository {
	return &orgRepo{db: db}
}

func (r *orgRepo) Create(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	model := OrgModel{
		Name:        org.Name,
		Slug:        org.Slug,
		Description: org.Description,
		OwnerID:     org.OwnerID,
	}
	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return nil, fmt.Errorf("create org: %w", err)
	}
	return model.ToDomain(), nil
}

func (r *orgRepo) GetByID(ctx context.Context, id string) (*domain.Organization, error) {
	var model OrgModel
	err := r.db.WithContext(ctx).First(&model, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperrors.NotFound("organization")
	}
	if err != nil {
		return nil, fmt.Errorf("get org by id: %w", err)
	}
	return model.ToDomain(), nil
}

func (r *orgRepo) GetBySlug(ctx context.Context, slug string) (*domain.Organization, error) {
	var model OrgModel
	err := r.db.WithContext(ctx).Where("slug = ?", slug).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperrors.NotFound("organization")
	}
	if err != nil {
		return nil, fmt.Errorf("get org by slug: %w", err)
	}
	return model.ToDomain(), nil
}

func (r *orgRepo) Update(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	updates := map[string]any{
		"name":        org.Name,
		"description": org.Description,
	}
	if err := r.db.WithContext(ctx).
		Model(&OrgModel{}).
		Where("id = ?", org.ID).
		Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("update org: %w", err)
	}
	return r.GetByID(ctx, org.ID)
}

func (r *orgRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&OrgModel{}).Error
}

func (r *orgRepo) SlugExists(ctx context.Context, slug string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&OrgModel{}).Where("slug = ?", slug).Count(&count).Error
	return count > 0, err
}

func (r *orgRepo) AddMember(ctx context.Context, orgID, userID, invitedBy string, role domain.OrgRole) error {
	var inv *string
	if invitedBy != "" {
		inv = &invitedBy
	}
	member := OrgMemberModel{
		OrganizationID: orgID,
		UserID:         userID,
		Role:           string(role),
		InvitedBy:      inv,
	}
	return r.db.WithContext(ctx).Create(&member).Error
}

func (r *orgRepo) GetMember(ctx context.Context, orgID, userID string) (*domain.OrganizationMember, error) {
	var m OrgMemberModel
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND user_id = ?", orgID, userID).
		First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperrors.NotFound("member")
	}
	if err != nil {
		return nil, fmt.Errorf("get member: %w", err)
	}
	return m.ToDomain(), nil
}

func (r *orgRepo) UpdateMemberRole(ctx context.Context, orgID, userID string, role domain.OrgRole) error {
	return r.db.WithContext(ctx).
		Model(&OrgMemberModel{}).
		Where("organization_id = ? AND user_id = ?", orgID, userID).
		Update("role", string(role)).Error
}

func (r *orgRepo) RemoveMember(ctx context.Context, orgID, userID string) error {
	return r.db.WithContext(ctx).
		Where("organization_id = ? AND user_id = ?", orgID, userID).
		Delete(&OrgMemberModel{}).Error
}

func (r *orgRepo) ListMembers(ctx context.Context, orgID string) ([]*domain.OrgMemberDetail, error) {
	type row struct {
		UserID    string
		Email     string
		FirstName string
		LastName  string
		Username  *string
		Role      string
		JoinedAt  interface{}
	}

	var rows []row
	err := r.db.WithContext(ctx).
		Table("organization_members om").
		Select("om.user_id, u.email, u.first_name, u.last_name, u.username, om.role, om.joined_at").
		Joins("JOIN users u ON u.id = om.user_id").
		Where("om.organization_id = ?", orgID).
		Order("om.joined_at ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("list members: %w", err)
	}

	details := make([]*domain.OrgMemberDetail, 0, len(rows))
	for _, r := range rows {
		uname := ""
		if r.Username != nil {
			uname = *r.Username
		}
		joinedAt, _ := r.JoinedAt.(interface {
			GoTime() interface{ GoTime() interface{} }
		})
		_ = joinedAt

		details = append(details, &domain.OrgMemberDetail{
			UserID:    r.UserID,
			Email:     r.Email,
			FirstName: r.FirstName,
			LastName:  r.LastName,
			Username:  uname,
			Role:      domain.OrgRole(r.Role),
		})
	}
	return details, nil
}

func (r *orgRepo) ListUserOrgs(ctx context.Context, userID string) ([]*domain.OrgWithRole, error) {
	type row struct {
		ID          string
		Name        string
		Slug        string
		Description string
		OwnerID     string
		Role        string
	}

	var rows []row
	err := r.db.WithContext(ctx).
		Table("organization_members om").
		Select("o.id, o.name, o.slug, o.description, o.owner_id, om.role").
		Joins("JOIN organizations o ON o.id = om.organization_id").
		Where("om.user_id = ? AND o.deleted_at IS NULL", userID).
		Order("o.created_at DESC").
		Scan(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("list user orgs: %w", err)
	}

	orgs := make([]*domain.OrgWithRole, 0, len(rows))
	for _, r := range rows {
		orgs = append(orgs, &domain.OrgWithRole{
			Organization: domain.Organization{
				ID:          r.ID,
				Name:        r.Name,
				Slug:        r.Slug,
				Description: r.Description,
				OwnerID:     r.OwnerID,
			},
			Role: domain.OrgRole(r.Role),
		})
	}
	return orgs, nil
}

func (r *orgRepo) CountOwnerOrgs(ctx context.Context, userID string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&OrgModel{}).
		Where("owner_id = ?", userID).
		Count(&count).Error
	return count, err
}
