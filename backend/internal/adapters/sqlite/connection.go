package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"strings"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

// Connection wraps an active SQLite database connection.
type Connection struct {
	db       *sql.DB
	filePath string
}

func (c *Connection) Ping(ctx context.Context) error {
	return c.db.PingContext(ctx)
}

func (c *Connection) Close() error {
	return c.db.Close()
}

func (c *Connection) ListTables(ctx context.Context) ([]string, error) {
	query := `
		SELECT name 
		FROM sqlite_master 
		WHERE type='table' AND name NOT LIKE 'sqlite_%' 
		ORDER BY name ASC;
	`
	rows, err := c.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list sqlite tables: %w", err)
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
	safeTable := sanitizeSQLiteIdentifier(tableName)
	pragmaQuery := fmt.Sprintf("PRAGMA table_info(\"%s\");", safeTable)

	rows, err := c.db.QueryContext(ctx, pragmaQuery)
	if err != nil {
		return nil, fmt.Errorf("pragma table_info: %w", err)
	}
	defer rows.Close()

	var columns []domain.ColumnSchema
	var primaryKeys []string

	for rows.Next() {
		var cid int
		var name, dType string
		var notNull int
		var dfltValue sql.NullString
		var pk int

		if err := rows.Scan(&cid, &name, &dType, &notNull, &dfltValue, &pk); err != nil {
			return nil, fmt.Errorf("scan pragma column: %w", err)
		}

		isPK := pk > 0
		if isPK {
			primaryKeys = append(primaryKeys, name)
		}

		col := domain.ColumnSchema{
			Name:         name,
			DataType:     dType,
			SeasonType:   MapSQLiteType(dType),
			IsNullable:   notNull == 0,
			IsPrimaryKey: isPK,
		}

		if dfltValue.Valid {
			val := dfltValue.String
			col.DefaultValue = &val
		}

		columns = append(columns, col)
	}

	if len(columns) == 0 {
		return nil, apperrors.NotFound(fmt.Sprintf("table '%s' not found or has no columns", tableName))
	}

	var rowCount int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM \"%s\"", safeTable)
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
		DatabaseName: c.filePath,
		DBType:       domain.DBTypeSQLite,
		Tables:       tableSchemas,
	}, nil
}

func (c *Connection) QueryRows(ctx context.Context, table string, req domain.QueryRequest) (*domain.QueryResult, error) {
	safeTable := fmt.Sprintf("\"%s\"", sanitizeSQLiteIdentifier(table))

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
		dir := "ASC"
		if strings.ToUpper(req.OrderDir) == "DESC" {
			dir = "DESC"
		}
		orderClause = fmt.Sprintf("ORDER BY \"%s\" %s", sanitizeSQLiteIdentifier(req.OrderBy), dir)
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

	safeTable := fmt.Sprintf("\"%s\"", sanitizeSQLiteIdentifier(table))
	var cols []string
	var placeholders []string
	var args []interface{}

	for k, v := range data {
		cols = append(cols, fmt.Sprintf("\"%s\"", sanitizeSQLiteIdentifier(k)))
		placeholders = append(placeholders, "?")
		args = append(args, v)
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", safeTable, strings.Join(cols, ", "), strings.Join(placeholders, ", "))
	res, err := c.db.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("insert row into sqlite: %w", err)
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

	safeTable := fmt.Sprintf("\"%s\"", sanitizeSQLiteIdentifier(table))
	var setClauses []string
	var args []interface{}

	for k, v := range data {
		setClauses = append(setClauses, fmt.Sprintf("\"%s\" = ?", sanitizeSQLiteIdentifier(k)))
		args = append(args, v)
	}

	var whereClauses []string
	for k, v := range primaryKey {
		whereClauses = append(whereClauses, fmt.Sprintf("\"%s\" = ?", sanitizeSQLiteIdentifier(k)))
		args = append(args, v)
	}

	query := fmt.Sprintf("UPDATE %s SET %s WHERE %s", safeTable, strings.Join(setClauses, ", "), strings.Join(whereClauses, " AND "))
	res, err := c.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("update row in sqlite: %w", err)
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

	safeTable := fmt.Sprintf("\"%s\"", sanitizeSQLiteIdentifier(table))
	var whereClauses []string
	var args []interface{}

	for k, v := range primaryKey {
		whereClauses = append(whereClauses, fmt.Sprintf("\"%s\" = ?", sanitizeSQLiteIdentifier(k)))
		args = append(args, v)
	}

	query := fmt.Sprintf("DELETE FROM %s WHERE %s", safeTable, strings.Join(whereClauses, " AND "))
	res, err := c.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("delete row in sqlite: %w", err)
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

		safeTable := fmt.Sprintf("\"%s\"", sanitizeSQLiteIdentifier(table))
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

	safeTable := fmt.Sprintf("\"%s\"", sanitizeSQLiteIdentifier(table))

	var cols []string
	for col := range rows[0] {
		cols = append(cols, col)
	}

	var safeCols []string
	for _, col := range cols {
		safeCols = append(safeCols, fmt.Sprintf("\"%s\"", sanitizeSQLiteIdentifier(col)))
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
		return fmt.Errorf("bulk insert into sqlite: %w", err)
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

func MapSQLiteType(dt string) domain.SeasonType {
	dt = strings.ToLower(strings.TrimSpace(dt))
	switch {
	case strings.Contains(dt, "int"):
		return domain.SeasonTypeInt
	case strings.Contains(dt, "char"), strings.Contains(dt, "text"), strings.Contains(dt, "clob"):
		return domain.SeasonTypeString
	case strings.Contains(dt, "bool"):
		return domain.SeasonTypeBool
	case strings.Contains(dt, "time"), strings.Contains(dt, "date"):
		return domain.SeasonTypeTimestamp
	case strings.Contains(dt, "real"), strings.Contains(dt, "floa"), strings.Contains(dt, "doub"):
		return domain.SeasonTypeFloat
	case strings.Contains(dt, "numeric"), strings.Contains(dt, "dec"):
		return domain.SeasonTypeDecimal
	case strings.Contains(dt, "json"):
		return domain.SeasonTypeJSON
	case strings.Contains(dt, "blob"):
		return domain.SeasonTypeBinary
	default:
		return domain.SeasonTypeString
	}
}

func sanitizeSQLiteIdentifier(ident string) string {
	ident = strings.ReplaceAll(ident, "\"", "")
	ident = strings.TrimSpace(ident)
	return ident
}
