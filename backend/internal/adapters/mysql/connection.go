package mysql

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"strings"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

// Connection wraps an active MySQL database connection.
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
		WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
		ORDER BY table_name ASC;
	`
	rows, err := c.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list mysql tables: %w", err)
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
	colQuery := `
		SELECT 
			column_name, 
			data_type, 
			is_nullable, 
			column_default, 
			character_maximum_length,
			column_key
		FROM information_schema.columns
		WHERE table_schema = DATABASE() AND table_name = ?
		ORDER BY ordinal_position ASC;
	`
	colRows, err := c.db.QueryContext(ctx, colQuery, tableName)
	if err != nil {
		return nil, fmt.Errorf("query mysql columns: %w", err)
	}
	defer colRows.Close()

	var columns []domain.ColumnSchema
	var primaryKeys []string

	for colRows.Next() {
		var col domain.ColumnSchema
		var isNullableStr string
		var defaultVal sql.NullString
		var maxLen sql.NullInt64
		var colKey string

		if err := colRows.Scan(&col.Name, &col.DataType, &isNullableStr, &defaultVal, &maxLen, &colKey); err != nil {
			return nil, fmt.Errorf("scan column: %w", err)
		}

		col.IsNullable = strings.ToUpper(isNullableStr) == "YES"
		col.SeasonType = MapMySQLType(col.DataType)
		col.IsPrimaryKey = strings.ToUpper(colKey) == "PRI"
		if col.IsPrimaryKey {
			primaryKeys = append(primaryKeys, col.Name)
		}

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

	// Approximate row count
	var rowCount int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM `%s`", sanitizeMySQLIdentifier(tableName))
	_ = c.db.QueryRowContext(ctx, countQuery).Scan(&rowCount)

	return &domain.TableSchema{
		Name:        tableName,
		Columns:     columns,
		PrimaryKeys: primaryKeys,
		RowCount:    rowCount,
	}, nil
}

func (c *Connection) GetSchema(ctx context.Context) (*domain.DatabaseSchema, error) {
	tables, err := c.ListTables(ctx)
	if err != nil {
		return nil, err
	}

	var tableSchemas []domain.TableSchema
	for _, tableName := range tables {
		ts, err := c.GetTableSchema(ctx, tableName)
		if err != nil {
			continue
		}
		tableSchemas = append(tableSchemas, *ts)
	}

	return &domain.DatabaseSchema{
		DatabaseName: c.databaseName,
		DBType:       domain.DBTypeMySQL,
		Tables:       tableSchemas,
	}, nil
}

func (c *Connection) QueryRows(ctx context.Context, table string, req domain.QueryRequest) (*domain.QueryResult, error) {
	schema, err := c.GetTableSchema(ctx, table)
	if err != nil {
		return nil, err
	}

	safeTable := fmt.Sprintf("`%s`", sanitizeMySQLIdentifier(table))

	var totalRows int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s", safeTable)
	if err := c.db.QueryRowContext(ctx, countQuery).Scan(&totalRows); err != nil {
		return nil, fmt.Errorf("count rows: %w", err)
	}

	if req.Page < 1 {
		req.Page = 1
	}
	if req.Limit < 1 {
		req.Limit = 50
	}

	offset := (req.Page - 1) * req.Limit

	var orderClause string
	if req.OrderBy != "" {
		validCol := false
		for _, col := range schema.Columns {
			if col.Name == req.OrderBy {
				validCol = true
				break
			}
		}
		if validCol {
			dir := "ASC"
			if strings.ToUpper(req.OrderDir) == "DESC" {
				dir = "DESC"
			}
			orderClause = fmt.Sprintf("ORDER BY `%s` %s", sanitizeMySQLIdentifier(req.OrderBy), dir)
		}
	}

	query := fmt.Sprintf("SELECT * FROM %s %s LIMIT %d OFFSET %d", safeTable, orderClause, req.Limit, offset)
	rows, err := c.db.QueryContext(ctx, query)
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

	totalPages := int(math.Ceil(float64(totalRows) / float64(req.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &domain.QueryResult{
		TableName:  table,
		Columns:    colNames,
		Rows:       resultRows,
		TotalRows:  totalRows,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

func (c *Connection) InsertRow(ctx context.Context, table string, data map[string]interface{}) (map[string]interface{}, error) {
	if len(data) == 0 {
		return nil, apperrors.BadRequest("no data provided for insert")
	}

	safeTable := fmt.Sprintf("`%s`", sanitizeMySQLIdentifier(table))
	var cols []string
	var placeholders []string
	var args []interface{}

	for k, v := range data {
		cols = append(cols, fmt.Sprintf("`%s`", sanitizeMySQLIdentifier(k)))
		placeholders = append(placeholders, "?")
		args = append(args, v)
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", safeTable, strings.Join(cols, ", "), strings.Join(placeholders, ", "))
	res, err := c.db.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("insert row into mysql: %w", err)
	}

	if id, err := res.LastInsertId(); err == nil && id > 0 {
		if _, ok := data["id"]; !ok {
			data["id"] = id
		}
	}

	return data, nil
}

func (c *Connection) UpdateRow(ctx context.Context, table string, primaryKey map[string]interface{}, data map[string]interface{}) error {
	if len(data) == 0 || len(primaryKey) == 0 {
		return apperrors.BadRequest("missing primary key or update payload")
	}

	safeTable := fmt.Sprintf("`%s`", sanitizeMySQLIdentifier(table))
	var setClauses []string
	var args []interface{}

	for k, v := range data {
		setClauses = append(setClauses, fmt.Sprintf("`%s` = ?", sanitizeMySQLIdentifier(k)))
		args = append(args, v)
	}

	var whereClauses []string
	for k, v := range primaryKey {
		whereClauses = append(whereClauses, fmt.Sprintf("`%s` = ?", sanitizeMySQLIdentifier(k)))
		args = append(args, v)
	}

	query := fmt.Sprintf("UPDATE %s SET %s WHERE %s", safeTable, strings.Join(setClauses, ", "), strings.Join(whereClauses, " AND "))
	res, err := c.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("update row in mysql: %w", err)
	}

	if rowsAffected, _ := res.RowsAffected(); rowsAffected == 0 {
		return apperrors.NotFound("row matching primary key not found")
	}
	return nil
}

func (c *Connection) DeleteRow(ctx context.Context, table string, primaryKey map[string]interface{}) error {
	if len(primaryKey) == 0 {
		return apperrors.BadRequest("missing primary key")
	}

	safeTable := fmt.Sprintf("`%s`", sanitizeMySQLIdentifier(table))
	var whereClauses []string
	var args []interface{}

	for k, v := range primaryKey {
		whereClauses = append(whereClauses, fmt.Sprintf("`%s` = ?", sanitizeMySQLIdentifier(k)))
		args = append(args, v)
	}

	query := fmt.Sprintf("DELETE FROM %s WHERE %s", safeTable, strings.Join(whereClauses, " AND "))
	res, err := c.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("delete row in mysql: %w", err)
	}

	if rowsAffected, _ := res.RowsAffected(); rowsAffected == 0 {
		return apperrors.NotFound("row matching primary key not found")
	}
	return nil
}

func (c *Connection) StreamRows(ctx context.Context, table string, batchSize int) (<-chan domain.RowBatch, <-chan error) {
	rowCh := make(chan domain.RowBatch, 4)
	errCh := make(chan error, 1)

	go func() {
		defer close(rowCh)
		defer close(errCh)

		safeTable := fmt.Sprintf("`%s`", sanitizeMySQLIdentifier(table))
		offset := 0
		batchIndex := 0

		for {
			query := fmt.Sprintf("SELECT * FROM %s LIMIT %d OFFSET %d", safeTable, batchSize, offset)
			rows, err := c.db.QueryContext(ctx, query)
			if err != nil {
				errCh <- fmt.Errorf("stream batch %d: %w", batchIndex, err)
				return
			}

			colNames, err := rows.Columns()
			if err != nil {
				rows.Close()
				errCh <- fmt.Errorf("get columns: %w", err)
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
					errCh <- fmt.Errorf("scan row: %w", err)
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
				return
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

	safeTable := fmt.Sprintf("`%s`", sanitizeMySQLIdentifier(table))

	var cols []string
	for col := range rows[0] {
		cols = append(cols, col)
	}

	var safeCols []string
	for _, col := range cols {
		safeCols = append(safeCols, fmt.Sprintf("`%s`", sanitizeMySQLIdentifier(col)))
	}

	var valueGroups []string
	var args []interface{}

	for _, row := range rows {
		var placeholders []string
		for _, col := range cols {
			placeholders = append(placeholders, "?")
			args = append(args, row[col])
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
		return fmt.Errorf("bulk insert into mysql: %w", err)
	}
	return nil
}

func (c *Connection) ExecDDL(ctx context.Context, ddl string) error {
	if strings.TrimSpace(ddl) == "" {
		return nil
	}
	_, err := c.db.ExecContext(ctx, ddl)
	return err
}

func MapMySQLType(dt string) domain.SeasonType {
	dt = strings.ToLower(strings.TrimSpace(dt))
	switch {
	case strings.Contains(dt, "tinyint(1)"), strings.Contains(dt, "bool"), strings.Contains(dt, "boolean"):
		return domain.SeasonTypeBool
	case strings.Contains(dt, "int"):
		return domain.SeasonTypeInt
	case strings.Contains(dt, "datetime"), strings.Contains(dt, "timestamp"), strings.Contains(dt, "date"):
		return domain.SeasonTypeTimestamp
	case strings.Contains(dt, "float"), strings.Contains(dt, "double"):
		return domain.SeasonTypeFloat
	case strings.Contains(dt, "decimal"), strings.Contains(dt, "numeric"):
		return domain.SeasonTypeDecimal
	case strings.Contains(dt, "json"):
		return domain.SeasonTypeJSON
	case strings.Contains(dt, "blob"), strings.Contains(dt, "binary"):
		return domain.SeasonTypeBinary
	case strings.Contains(dt, "enum"):
		return domain.SeasonTypeEnum
	default:
		return domain.SeasonTypeString
	}
}

func sanitizeMySQLIdentifier(ident string) string {
	ident = strings.ReplaceAll(ident, "`", "")
	ident = strings.TrimSpace(ident)
	return ident
}
