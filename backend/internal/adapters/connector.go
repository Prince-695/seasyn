package adapters

import (
	"context"
	"database/sql"
	"fmt"
	"net"
	"os"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	_ "github.com/jackc/pgx/v5/stdlib"
)

// Connector provides live connection diagnostics and ping capabilities for target databases.
type Connector struct{}

func NewConnector() *Connector {
	return &Connector{}
}

// TestConnection attempts to connect to the target database and measure round-trip latency.
func (c *Connector) TestConnection(ctx context.Context, req domain.TestConnectionRequest) (*domain.ConnectionTestResult, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	start := time.Now()

	switch req.DBType {
	case domain.DBTypePostgres:
		return c.testPostgres(ctx, req, start)
	case domain.DBTypeSQLite:
		return c.testSQLite(ctx, req, start)
	case domain.DBTypeMySQL:
		return c.testTCPPort(ctx, req, start, "MySQL")
	case domain.DBTypeMongoDB:
		return c.testTCPPort(ctx, req, start, "MongoDB")
	default:
		return &domain.ConnectionTestResult{
			Success:      false,
			ErrorMessage: fmt.Sprintf("unsupported database type: %s", req.DBType),
		}, nil
	}
}

func (c *Connector) testPostgres(ctx context.Context, req domain.TestConnectionRequest, start time.Time) (*domain.ConnectionTestResult, error) {
	sslMode := req.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}
	port := req.Port
	if port == 0 {
		port = 5432
	}

	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s connect_timeout=5",
		req.Host, port, req.Username, req.Password, req.Database, sslMode,
	)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return &domain.ConnectionTestResult{
			Success:      false,
			LatencyMs:    time.Since(start).Milliseconds(),
			ErrorMessage: fmt.Sprintf("failed to parse connection config: %v", err),
		}, nil
	}
	defer db.Close()

	if err := db.PingContext(ctx); err != nil {
		return &domain.ConnectionTestResult{
			Success:      false,
			LatencyMs:    time.Since(start).Milliseconds(),
			ErrorMessage: fmt.Sprintf("connection failed: %v", err),
		}, nil
	}

	var version string
	_ = db.QueryRowContext(ctx, "SELECT version()").Scan(&version)

	return &domain.ConnectionTestResult{
		Success:    true,
		LatencyMs:  time.Since(start).Milliseconds(),
		ServerInfo: version,
	}, nil
}

func (c *Connector) testSQLite(ctx context.Context, req domain.TestConnectionRequest, start time.Time) (*domain.ConnectionTestResult, error) {
	if req.FilePath == "" {
		return &domain.ConnectionTestResult{
			Success:      false,
			ErrorMessage: "SQLite file_path is required",
		}, nil
	}

	info, err := os.Stat(req.FilePath)
	if err != nil {
		if os.IsNotExist(err) {
			return &domain.ConnectionTestResult{
				Success:      false,
				LatencyMs:    time.Since(start).Milliseconds(),
				ErrorMessage: fmt.Sprintf("SQLite file does not exist: %s", req.FilePath),
			}, nil
		}
		return &domain.ConnectionTestResult{
			Success:      false,
			LatencyMs:    time.Since(start).Milliseconds(),
			ErrorMessage: fmt.Sprintf("cannot access SQLite file: %v", err),
		}, nil
	}

	return &domain.ConnectionTestResult{
		Success:    true,
		LatencyMs:  time.Since(start).Milliseconds(),
		ServerInfo: fmt.Sprintf("SQLite Database File (%d bytes)", info.Size()),
	}, nil
}

// testTCPPort checks host:port reachability for engines where native drivers may be optional.
func (c *Connector) testTCPPort(ctx context.Context, req domain.TestConnectionRequest, start time.Time, engineName string) (*domain.ConnectionTestResult, error) {
	addr := fmt.Sprintf("%s:%d", req.Host, req.Port)
	d := net.Dialer{Timeout: 5 * time.Second}

	conn, err := d.DialContext(ctx, "tcp", addr)
	if err != nil {
		return &domain.ConnectionTestResult{
			Success:      false,
			LatencyMs:    time.Since(start).Milliseconds(),
			ErrorMessage: fmt.Sprintf("unable to reach %s host at %s: %v", engineName, addr, err),
		}, nil
	}
	defer conn.Close()

	return &domain.ConnectionTestResult{
		Success:    true,
		LatencyMs:  time.Since(start).Milliseconds(),
		ServerInfo: fmt.Sprintf("%s host reachable at %s", engineName, addr),
	}, nil
}
