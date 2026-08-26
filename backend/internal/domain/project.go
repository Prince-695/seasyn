package domain

import "time"

// Project represents a database migration project inside an organization.
type Project struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organization_id"`
	Name           string    `json:"name"`
	Slug           string    `json:"slug"`
	Description    string    `json:"description,omitempty"`
	Environment    string    `json:"environment,omitempty"` // e.g. "development", "staging", "production"
	CreatedBy      string    `json:"created_by"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// ProjectDetail contains project info along with its configured database connections.
type ProjectDetail struct {
	Project
	Connections []PublicDatabaseConnection `json:"connections,omitempty"`
}

// --- Project Request DTOs ---

type CreateProjectRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=100" minLength:"2" maxLength:"100" example:"Main Service DB"`
	Slug        string `json:"slug" validate:"omitempty,min=2,max=50" minLength:"2" maxLength:"50" example:"main-service-db"`
	Description string `json:"description" validate:"max=500" maxLength:"500" example:"Primary PostgreSQL backend for main service"`
	Environment string `json:"environment" validate:"omitempty,oneof=development staging production" example:"production"`
}

type UpdateProjectRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=100" minLength:"2" maxLength:"100" example:"Main Service DB Updated"`
	Description string `json:"description" validate:"max=500" maxLength:"500" example:"Updated description"`
	Environment string `json:"environment" validate:"omitempty,oneof=development staging production" example:"production"`
}
