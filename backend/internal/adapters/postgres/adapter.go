package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	_ "github.com/jackc/pgx/v5/stdlib"
)

// Adapter connects to PostgreSQL databases.
type Adapter struct{}

func NewAdapter() ports.DatabaseAdapter {
	return &Adapter{}
}

func (a *Adapter) Connect(ctx context.Context, conn domain.DatabaseConnection, plainPassword, plainURI string) (ports.DatabaseConnection, error) {
	sslMode := conn.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}
	port := conn.Port
	if port == 0 {
		port = 5432
	}

	var dsn string
	if plainURI != "" {
		dsn = plainURI
	} else {
		dsn = fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s connect_timeout=10",
			conn.Host, port, conn.Username, plainPassword, conn.Database, sslMode,
		)
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, apperrors.BadRequest(fmt.Sprintf("invalid PostgreSQL connection string: %v", err))
	}

	// Pool settings
	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(2)
	db.SetConnMaxLifetime(60 * time.Second)

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := db.PingContext(pingCtx); err != nil {
		db.Close()
		return nil, apperrors.BadRequest(fmt.Sprintf("failed to connect to PostgreSQL: %v", err))
	}

	return &Connection{
		db:           db,
		databaseName: conn.Database,
	}, nil
}
