package mysql

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	_ "github.com/go-sql-driver/mysql"
)

// Adapter connects to MySQL databases.
type Adapter struct{}

func NewAdapter() ports.DatabaseAdapter {
	return &Adapter{}
}

func (a *Adapter) Connect(ctx context.Context, conn domain.DatabaseConnection, plainPassword, plainURI string) (ports.DatabaseConnection, error) {
	port := conn.Port
	if port == 0 {
		port = 3306
	}

	var dsn string
	if plainURI != "" {
		dsn = plainURI
	} else {
		// user:password@tcp(host:port)/dbname?parseTime=true&loc=Local&timeout=10s
		dsn = fmt.Sprintf(
			"%s:%s@tcp(%s:%d)/%s?parseTime=true&loc=Local&timeout=10s&multiStatements=true",
			conn.Username, plainPassword, conn.Host, port, conn.Database,
		)
	}

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, apperrors.BadRequest(fmt.Sprintf("invalid MySQL connection config: %v", err))
	}

	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(2)
	db.SetConnMaxLifetime(60 * time.Second)

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := db.PingContext(pingCtx); err != nil {
		db.Close()
		return nil, apperrors.BadRequest(fmt.Sprintf("failed to connect to MySQL: %v", err))
	}

	return &Connection{
		db:           db,
		databaseName: conn.Database,
	}, nil
}
