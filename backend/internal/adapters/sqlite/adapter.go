package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	_ "modernc.org/sqlite"
)

// Adapter connects to SQLite databases.
type Adapter struct{}

func NewAdapter() ports.DatabaseAdapter {
	return &Adapter{}
}

func (a *Adapter) Connect(ctx context.Context, conn domain.DatabaseConnection, plainPassword, plainURI string) (ports.DatabaseConnection, error) {
	filePath := conn.FilePath
	if plainURI != "" {
		filePath = plainURI
	}
	if filePath == "" {
		filePath = ":memory:"
	}

	db, err := sql.Open("sqlite", filePath)
	if err != nil {
		return nil, apperrors.BadRequest(fmt.Sprintf("invalid SQLite connection config: %v", err))
	}

	db.SetMaxOpenConns(1) // SQLite single-writer safety
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(60 * time.Second)

	pingCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	if err := db.PingContext(pingCtx); err != nil {
		db.Close()
		return nil, apperrors.BadRequest(fmt.Sprintf("failed to connect to SQLite: %v", err))
	}

	return &Connection{
		db:       db,
		filePath: filePath,
	}, nil
}
