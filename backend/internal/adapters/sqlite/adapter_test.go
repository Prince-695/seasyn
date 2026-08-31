package sqlite

import (
	"context"
	"testing"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

func TestSQLiteAdapter_FullLifecycle(t *testing.T) {
	ctx := context.Background()
	adapter := NewAdapter()

	conn, err := adapter.Connect(ctx, domain.DatabaseConnection{
		FilePath: ":memory:",
	}, "", "")
	if err != nil {
		t.Fatalf("failed to connect to memory sqlite: %v", err)
	}
	defer conn.Close()

	if err := conn.Ping(ctx); err != nil {
		t.Fatalf("ping failed: %v", err)
	}

	// 1. Create table DDL
	createDDL := `
		CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			email TEXT UNIQUE,
			is_active INTEGER DEFAULT 1,
			balance REAL DEFAULT 0.0
		);
	`
	if err := conn.ExecDDL(ctx, createDDL); err != nil {
		t.Fatalf("exec DDL failed: %v", err)
	}

	// 2. List tables
	tables, err := conn.ListTables(ctx)
	if err != nil || len(tables) == 0 || tables[0] != "users" {
		t.Fatalf("list tables failed: %v, tables: %v", err, tables)
	}

	// 3. Introspect Schema
	schema, err := conn.GetTableSchema(ctx, "users")
	if err != nil {
		t.Fatalf("get table schema failed: %v", err)
	}
	if len(schema.Columns) != 5 {
		t.Errorf("expected 5 columns, got %d", len(schema.Columns))
	}

	// 4. Bulk Insert
	rows := []map[string]interface{}{
		{"name": "Alice", "email": "alice@test.com", "is_active": 1, "balance": 100.5},
		{"name": "Bob", "email": "bob@test.com", "is_active": 0, "balance": 50.0},
		{"name": "Charlie", "email": "charlie@test.com", "is_active": 1, "balance": 250.75},
	}
	if err := conn.BulkInsert(ctx, "users", rows); err != nil {
		t.Fatalf("bulk insert failed: %v", err)
	}

	// 5. Query Rows
	queryRes, err := conn.QueryRows(ctx, "users", domain.QueryRequest{
		Page:  1,
		Limit: 10,
	})
	if err != nil {
		t.Fatalf("query rows failed: %v", err)
	}
	if queryRes.TotalRows != 3 || len(queryRes.Rows) != 3 {
		t.Fatalf("expected 3 rows, got %d (total: %d)", len(queryRes.Rows), queryRes.TotalRows)
	}

	// 6. Stream Rows
	rowCh, errCh := conn.StreamRows(ctx, "users", 2)
	var streamedCount int
	for batch := range rowCh {
		streamedCount += len(batch.Rows)
	}
	if err := <-errCh; err != nil {
		t.Fatalf("stream rows error: %v", err)
	}
	if streamedCount != 3 {
		t.Fatalf("expected 3 streamed rows, got %d", streamedCount)
	}
}
