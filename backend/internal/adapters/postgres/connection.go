package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

// Connection wraps an active PostgreSQL database connection.
type Connection struct {
	db           *sql.DB
	databaseName string
}

func (c *Connection) Ping(ctx context.Context) error {
	return c.db.PingContext(ctx)
}

func (c *Connection) Close() error {
	return c.db.Close()
}

func (c *Connection) ListTables(ctx context.Context) ([]string, error) {
	query := `
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
		ORDER BY table_name ASC;
	`
	rows, err := c.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list tables: %w", err)
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		tables = append(tables, name)
	}
	return tables, nil
}

func (c *Connection) GetTableSchema(ctx context.Context, tableName string) (*domain.TableSchema, error) {
	// 1. Fetch Columns
	colQuery := `
		SELECT 
			column_name, 
			data_type, 
			is_nullable, 
			column_default, 
			character_maximum_length
		FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = $1
		ORDER BY ordinal_position ASC;
	`
	colRows, err := c.db.QueryContext(ctx, colQuery, tableName)
	if err != nil {
		return nil, fmt.Errorf("query table columns: %w", err)
	}
	defer colRows.Close()

	var columns []domain.ColumnSchema
	for colRows.Next() {
		var col domain.ColumnSchema
		var isNullableStr string
		var defaultVal sql.NullString
		var maxLen sql.NullInt64

		if err := colRows.Scan(&col.Name, &col.DataType, &isNullableStr, &defaultVal, &maxLen); err != nil {
			return nil, fmt.Errorf("scan column: %w", err)
		}

		col.IsNullable = strings.ToUpper(isNullableStr) == "YES"
		col.SeasonType = MapPostgresType(col.DataType)
		if defaultVal.Valid {
			val := defaultVal.String
			col.DefaultValue = &val
		}
		if maxLen.Valid {
			l := int(maxLen.Int64)
			col.MaxLength = &l
		}

		columns = append(columns, col)
	}

	if len(columns) == 0 {
		return nil, apperrors.NotFound(fmt.Sprintf("table '%s' not found or has no columns", tableName))
	}

	// 2. Fetch Primary Keys
	pkQuery := `
		SELECT kcu.column_name
		FROM information_schema.table_constraints tc
		JOIN information_schema.key_column_usage kcu 
			ON tc.constraint_name = kcu.constraint_name 
			AND tc.table_schema = kcu.table_schema
		WHERE tc.table_schema = 'public' 
		  AND tc.table_name = $1 
		  AND tc.constraint_type = 'PRIMARY KEY';
	`
	pkRows, err := c.db.QueryContext(ctx, pkQuery, tableName)
	if err != nil {
		return nil, fmt.Errorf("query primary keys: %w", err)
	}
	defer pkRows.Close()

	pkSet := make(map[string]bool)
	var primaryKeys []string
	for pkRows.Next() {
		var pkCol string
		if err := pkRows.Scan(&pkCol); err == nil {
			primaryKeys = append(primaryKeys, pkCol)
			pkSet[pkCol] = true
		}
	}

	// Mark PKs on columns
	for i := range columns {
		if pkSet[columns[i].Name] {
			columns[i].IsPrimaryKey = true
		}
	}

	// 3. Fetch Foreign Keys
	fkQuery := `
		SELECT
			kcu.column_name,
			ccu.table_name AS foreign_table_name,
			ccu.column_name AS foreign_column_name,
			tc.constraint_name
		FROM information_schema.table_constraints AS tc
		JOIN information_schema.key_column_usage AS kcu
			ON tc.constraint_name = kcu.constraint_name
			AND tc.table_schema = kcu.table_schema
		JOIN information_schema.constraint_column_usage AS ccu
			ON ccu.constraint_name = tc.constraint_name
			AND ccu.table_schema = tc.table_schema
		WHERE tc.constraint_type = 'FOREIGN KEY'
		  AND tc.table_schema = 'public'
		  AND tc.table_name = $1;
	`
	fkRows, err := c.db.QueryContext(ctx, fkQuery, tableName)
	var constraints []domain.ConstraintSchema
	if err == nil {
		defer fkRows.Close()
		for fkRows.Next() {
			var colName, foreignTable, foreignCol, constraintName string
			if err := fkRows.Scan(&colName, &foreignTable, &foreignCol, &constraintName); err == nil {
				// Mark column
				for i := range columns {
					if columns[i].Name == colName {
						columns[i].IsForeignKey = true
						columns[i].ForeignTable = foreignTable
						columns[i].ForeignColumn = foreignCol
					}
				}
				constraints = append(constraints, domain.ConstraintSchema{
					Name:           constraintName,
					Type:           "FOREIGN KEY",
					Columns:        []string{colName},
					ForeignTable:   foreignTable,
					ForeignColumns: []string{foreignCol},
				})
			}
		}
	}

	// 4. Fetch Indexes
	indexQuery := `
		SELECT indexname, indexdef 
		FROM pg_indexes 
		WHERE schemaname = 'public' AND tablename = $1;
	`
	idxRows, err := c.db.QueryContext(ctx, indexQuery, tableName)
	var indexes []domain.IndexSchema
	if err == nil {
		defer idxRows.Close()
		for idxRows.Next() {
			var idxName, idxDef string
			if err := idxRows.Scan(&idxName, &idxDef); err == nil {
				isUnique := strings.Contains(strings.ToUpper(idxDef), "UNIQUE INDEX")
				isPrimary := strings.HasSuffix(idxName, "_pkey") || strings.Contains(idxName, "pkey")
				indexes = append(indexes, domain.IndexSchema{
					Name:      idxName,
					IsUnique:  isUnique,
					IsPrimary: isPrimary,
				})
			}
		}
	}

	// 5. Estimate row count
	var rowCount int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s", sanitizeIdentifier(tableName))
	_ = c.db.QueryRowContext(ctx, countQuery).Scan(&rowCount)

	return &domain.TableSchema{
		Name:        tableName,
		Columns:     columns,
		PrimaryKeys: primaryKeys,
		Constraints: constraints,
		Indexes:     indexes,
		RowCount:    rowCount,
	}, nil
}

func (c *Connection) GetSchema(ctx context.Context) (*domain.DatabaseSchema, error) {
	tables, err := c.ListTables(ctx)
	if err != nil {
		return nil, err
	}

	var tableSchemas []domain.TableSchema
	for _, t := range tables {
		ts, err := c.GetTableSchema(ctx, t)
		if err != nil {
			continue // Skip views or tables that cannot be inspected
		}
		tableSchemas = append(tableSchemas, *ts)
	}

	return &domain.DatabaseSchema{
		DBType:       domain.DBTypePostgres,
		DatabaseName: c.databaseName,
		Tables:       tableSchemas,
		InspectedAt:  time.Now(),
	}, nil
}

// --- Live Data Explorer (Query, Insert, Update, Delete) ---

func (c *Connection) QueryRows(ctx context.Context, table string, req domain.QueryRequest) (*domain.QueryResult, error) {
	page := req.Page
	if page < 1 {
		page = 1
	}
	limit := req.Limit
	if limit < 1 || limit > 500 {
		limit = 50
	}
	offset := (page - 1) * limit

	safeTable := sanitizeIdentifier(table)

	// Get total row count
	var totalRows int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s", safeTable)
	if err := c.db.QueryRowContext(ctx, countQuery).Scan(&totalRows); err != nil {
		return nil, fmt.Errorf("count rows: %w", err)
	}

	// Build query
	var query string
	if req.OrderBy != "" {
		safeOrderCol := sanitizeIdentifier(req.OrderBy)
		dir := "ASC"
		if strings.ToUpper(req.OrderDir) == "DESC" {
			dir = "DESC"
		}
		query = fmt.Sprintf("SELECT * FROM %s ORDER BY %s %s LIMIT $1 OFFSET $2", safeTable, safeOrderCol, dir)
	} else {
		query = fmt.Sprintf("SELECT * FROM %s LIMIT $1 OFFSET $2", safeTable)
	}

	rows, err := c.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("query rows: %w", err)
	}
	defer rows.Close()

	colNames, err := rows.Columns()
	if err != nil {
		return nil, fmt.Errorf("get column names: %w", err)
	}

	var resultRows []map[string]interface{}
	for rows.Next() {
		values := make([]interface{}, len(colNames))
		valuePtrs := make([]interface{}, len(colNames))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, fmt.Errorf("scan row: %w", err)
		}

		rowMap := make(map[string]interface{})
		for i, col := range colNames {
			val := values[i]
			if b, ok := val.([]byte); ok {
				rowMap[col] = string(b)
			} else {
				rowMap[col] = val
			}
		}
		resultRows = append(resultRows, rowMap)
	}

	totalPages := int(math.Ceil(float64(totalRows) / float64(limit)))

	return &domain.QueryResult{
		TableName:  table,
		Columns:    colNames,
		Rows:       resultRows,
		TotalRows:  totalRows,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (c *Connection) InsertRow(ctx context.Context, table string, data map[string]interface{}) (map[string]interface{}, error) {
	if len(data) == 0 {
		return nil, apperrors.BadRequest("no data provided for insert")
	}

	safeTable := sanitizeIdentifier(table)
	var cols []string
	var placeholders []string
	var args []interface{}

	idx := 1
	for col, val := range data {
		cols = append(cols, sanitizeIdentifier(col))
		placeholders = append(placeholders, fmt.Sprintf("$%d", idx))
		args = append(args, val)
		idx++
	}

	query := fmt.Sprintf(
		"INSERT INTO %s (%s) VALUES (%s) RETURNING *",
		safeTable,
		strings.Join(cols, ", "),
		strings.Join(placeholders, ", "),
	)

	rows, err := c.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("insert row: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return data, nil
	}

	colNames, _ := rows.Columns()
	values := make([]interface{}, len(colNames))
	valuePtrs := make([]interface{}, len(colNames))
	for i := range values {
		valuePtrs[i] = &values[i]
	}

	if err := rows.Scan(valuePtrs...); err != nil {
		return data, nil
	}

	resultMap := make(map[string]interface{})
	for i, col := range colNames {
		val := values[i]
		if b, ok := val.([]byte); ok {
			resultMap[col] = string(b)
		} else {
			resultMap[col] = val
		}
	}
	return resultMap, nil
}

func (c *Connection) UpdateRow(ctx context.Context, table string, primaryKey map[string]interface{}, data map[string]interface{}) error {
	if len(primaryKey) == 0 {
		return apperrors.BadRequest("primary_key is required for update")
	}
	if len(data) == 0 {
		return apperrors.BadRequest("no update data provided")
	}

	safeTable := sanitizeIdentifier(table)
	var setClauses []string
	var whereClauses []string
	var args []interface{}

	idx := 1
	for col, val := range data {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", sanitizeIdentifier(col), idx))
		args = append(args, val)
		idx++
	}

	for col, val := range primaryKey {
		whereClauses = append(whereClauses, fmt.Sprintf("%s = $%d", sanitizeIdentifier(col), idx))
		args = append(args, val)
		idx++
	}

	query := fmt.Sprintf(
		"UPDATE %s SET %s WHERE %s",
		safeTable,
		strings.Join(setClauses, ", "),
		strings.Join(whereClauses, " AND "),
	)

	res, err := c.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("update row: %w", err)
	}

	affected, _ := res.RowsAffected()
	if affected == 0 {
		return apperrors.NotFound("no row matched primary key for update")
	}
	return nil
}

func (c *Connection) DeleteRow(ctx context.Context, table string, primaryKey map[string]interface{}) error {
	if len(primaryKey) == 0 {
		return apperrors.BadRequest("primary_key is required for delete")
	}

	safeTable := sanitizeIdentifier(table)
	var whereClauses []string
	var args []interface{}

	idx := 1
	for col, val := range primaryKey {
		whereClauses = append(whereClauses, fmt.Sprintf("%s = $%d", sanitizeIdentifier(col), idx))
		args = append(args, val)
		idx++
	}

	query := fmt.Sprintf("DELETE FROM %s WHERE %s", safeTable, strings.Join(whereClauses, " AND "))
	res, err := c.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("delete row: %w", err)
	}

	affected, _ := res.RowsAffected()
	if affected == 0 {
		return apperrors.NotFound("no row matched primary key for delete")
	}
	return nil
}

// --- Migration Streaming (StreamRows + BulkInsert) ---

func (c *Connection) StreamRows(ctx context.Context, table string, batchSize int) (<-chan domain.RowBatch, <-chan error) {
	rowCh := make(chan domain.RowBatch, 4)
	errCh := make(chan error, 1)

	if batchSize < 10 {
		batchSize = 500
	}

	go func() {
		defer close(rowCh)
		defer close(errCh)

		safeTable := sanitizeIdentifier(table)
		var totalRows int64
		_ = c.db.QueryRowContext(ctx, fmt.Sprintf("SELECT COUNT(*) FROM %s", safeTable)).Scan(&totalRows)

		offset := 0
		batchIndex := 0

		for {
			select {
			case <-ctx.Done():
				errCh <- ctx.Err()
				return
			default:
			}

			query := fmt.Sprintf("SELECT * FROM %s ORDER BY ctid LIMIT $1 OFFSET $2", safeTable)
			rows, err := c.db.QueryContext(ctx, query, batchSize, offset)
			if err != nil {
				errCh <- fmt.Errorf("stream rows batch %d: %w", batchIndex, err)
				return
			}

			colNames, err := rows.Columns()
			if err != nil {
				rows.Close()
				errCh <- fmt.Errorf("get column names: %w", err)
				return
			}

			var batch []map[string]interface{}
			for rows.Next() {
				values := make([]interface{}, len(colNames))
				valuePtrs := make([]interface{}, len(colNames))
				for i := range values {
					valuePtrs[i] = &values[i]
				}

				if err := rows.Scan(valuePtrs...); err != nil {
					rows.Close()
					errCh <- fmt.Errorf("scan row in batch %d: %w", batchIndex, err)
					return
				}

				rowMap := make(map[string]interface{})
				for i, col := range colNames {
					val := values[i]
					if b, ok := val.([]byte); ok {
						rowMap[col] = string(b)
					} else {
						rowMap[col] = val
					}
				}
				batch = append(batch, rowMap)
			}
			rows.Close()

			if len(batch) == 0 {
				return // No more rows
			}

			isLast := len(batch) < batchSize
			rowCh <- domain.RowBatch{
				Index:  batchIndex,
				Rows:   batch,
				IsLast: isLast,
			}

			if isLast {
				return
			}

			offset += batchSize
			batchIndex++
		}
	}()

	return rowCh, errCh
}

func (c *Connection) BulkInsert(ctx context.Context, table string, rows []map[string]interface{}) error {
	if len(rows) == 0 {
		return nil
	}

	safeTable := sanitizeIdentifier(table)

	// Use column order from first row
	var cols []string
	for col := range rows[0] {
		cols = append(cols, col)
	}

	var safeCols []string
	for _, col := range cols {
		safeCols = append(safeCols, sanitizeIdentifier(col))
	}

	// Build multi-row INSERT: INSERT INTO table (c1, c2) VALUES ($1, $2), ($3, $4), ...
	var valueGroups []string
	var args []interface{}
	idx := 1

	for _, row := range rows {
		var placeholders []string
		for _, col := range cols {
			placeholders = append(placeholders, fmt.Sprintf("$%d", idx))
			args = append(args, row[col])
			idx++
		}
		valueGroups = append(valueGroups, "("+strings.Join(placeholders, ", ")+")")
	}

	query := fmt.Sprintf(
		"INSERT INTO %s (%s) VALUES %s",
		safeTable,
		strings.Join(safeCols, ", "),
		strings.Join(valueGroups, ", "),
	)

	_, err := c.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("bulk insert: %w", err)
	}
	return nil
}

// sanitizeIdentifier prevents SQL injection on table and column identifiers by double quoting.
func sanitizeIdentifier(ident string) string {
	ident = strings.ReplaceAll(ident, "\"", "")
	ident = strings.TrimSpace(ident)
	return fmt.Sprintf("\"%s\"", ident)
}

