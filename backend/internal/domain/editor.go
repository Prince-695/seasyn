package domain

// QueryRequest describes a safe structured editor read with pagination and sorting.
type QueryRequest struct {
	Page     int    `json:"page" validate:"min=1" example:"1"`
	Limit    int    `json:"limit" validate:"min=1,max=500" example:"50"`
	OrderBy  string `json:"order_by,omitempty" example:"created_at"`
	OrderDir string `json:"order_dir,omitempty" validate:"omitempty,oneof=asc desc ASC DESC" example:"desc"`
}

// QueryResult represents the paginated dataset returned for table inspection.
type QueryResult struct {
	TableName  string                   `json:"table_name"`
	Columns    []string                 `json:"columns"`
	Rows       []map[string]interface{} `json:"rows"`
	TotalRows  int64                    `json:"total_rows"`
	Page       int                      `json:"page"`
	Limit      int                      `json:"limit"`
	TotalPages int                      `json:"total_pages"`
}

// InsertRowRequest contains the column-value pairs for creating a row.
type InsertRowRequest struct {
	Data map[string]interface{} `json:"data" validate:"required"`
}

// UpdateRowRequest contains primary key identifiers and updated column-value pairs.
type UpdateRowRequest struct {
	PrimaryKey map[string]interface{} `json:"primary_key" validate:"required"`
	Data       map[string]interface{} `json:"data" validate:"required"`
}

// DeleteRowRequest contains primary key identifiers for target row deletion.
type DeleteRowRequest struct {
	PrimaryKey map[string]interface{} `json:"primary_key" validate:"required"`
}
