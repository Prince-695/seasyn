package migration

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/Prince-695/seasyn/backend/pkg/crypto"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

// Streamer moves rows from a source database to a destination database in batched channel pipelines.
type Streamer struct {
	projectRepo ports.ProjectRepository
	registry    ports.AdapterRegistry
	encryptor   *crypto.Encryptor
	hub         *ProgressHub
}

// NewStreamer creates a new Streamer with the required dependencies.
func NewStreamer(
	projectRepo ports.ProjectRepository,
	registry ports.AdapterRegistry,
	encryptor *crypto.Encryptor,
	hub *ProgressHub,
) *Streamer {
	return &Streamer{
		projectRepo: projectRepo,
		registry:    registry,
		encryptor:   encryptor,
		hub:         hub,
	}
}

// Stream executes the migration by reading from the source and writing to the destination in batches.
// It sends progress events to the ProgressHub after each successful batch.
// This function blocks until the migration completes, fails, or the context is cancelled.
func (s *Streamer) Stream(ctx context.Context, job domain.MigrationJob) error {
	// 1. Resolve source connection metadata
	srcConnMeta, err := s.projectRepo.GetConnectionByID(ctx, job.SourceConnID)
	if err != nil {
		return fmt.Errorf("source connection: %w", err)
	}

	// 2. Resolve destination connection metadata
	dstConnMeta, err := s.projectRepo.GetConnectionByID(ctx, job.TargetConnID)
	if err != nil {
		return fmt.Errorf("target connection: %w", err)
	}

	// 3. Decrypt source credentials
	srcPass, err := s.encryptor.Decrypt(srcConnMeta.EncryptedPassword)
	if err != nil {
		return fmt.Errorf("decrypt source password: %w", err)
	}
	srcURI, err := s.encryptor.Decrypt(srcConnMeta.URI)
	if err != nil {
		return fmt.Errorf("decrypt source URI: %w", err)
	}

	// 4. Decrypt destination credentials
	dstPass, err := s.encryptor.Decrypt(dstConnMeta.EncryptedPassword)
	if err != nil {
		return fmt.Errorf("decrypt target password: %w", err)
	}
	dstURI, err := s.encryptor.Decrypt(dstConnMeta.URI)
	if err != nil {
		return fmt.Errorf("decrypt target URI: %w", err)
	}

	// 5. Get adapters
	srcAdapter, err := s.registry.Get(srcConnMeta.DBType)
	if err != nil {
		return fmt.Errorf("source adapter: %w", err)
	}
	dstAdapter, err := s.registry.Get(dstConnMeta.DBType)
	if err != nil {
		return fmt.Errorf("target adapter: %w", err)
	}

	// 6. Open source connection
	srcConn, err := srcAdapter.Connect(ctx, *srcConnMeta, srcPass, srcURI)
	if err != nil {
		return fmt.Errorf("connect to source: %w", err)
	}
	defer srcConn.Close()

	// 7. Open destination connection
	dstConn, err := dstAdapter.Connect(ctx, *dstConnMeta, dstPass, dstURI)
	if err != nil {
		return fmt.Errorf("connect to target: %w", err)
	}
	defer dstConn.Close()

	// 7b. Auto-provision target table schema if relational target and table does not exist
	if dstConnMeta.DBType != domain.DBTypeMongoDB {
		tables, _ := dstConn.ListTables(ctx)
		targetExists := false
		for _, t := range tables {
			if strings.EqualFold(t, job.TargetTable) {
				targetExists = true
				break
			}
		}
		if !targetExists {
			srcSchema, err := srcConn.GetTableSchema(ctx, job.SourceTable)
			if err == nil && srcSchema != nil {
				transformed := TransformSchema(*srcSchema, srcConnMeta.DBType, dstConnMeta.DBType)
				transformed.TableName = job.TargetTable
				ddl := GenerateTargetDDL(transformed)
				if ddl != "" {
					_ = dstConn.ExecDDL(ctx, ddl)
				}
			}
		}
	}

	// 8. Stream rows via channel pipeline
	batchSize := job.BatchSize
	if batchSize < 10 {
		batchSize = 500
	}

	rowCh, errCh := srcConn.StreamRows(ctx, job.SourceTable, batchSize)

	var migrated int64

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()

		case batch, ok := <-rowCh:
			if !ok {
				// Channel closed — all rows streamed
				s.hub.Broadcast(job.ID, domain.MigrationProgress{
					JobID:        job.ID,
					State:        domain.MigrationStatusCompleted,
					MigratedRows: migrated,
					TotalRows:    job.TotalRows,
					Percentage:   100,
					Message:      "Migration completed successfully",
					Timestamp:    time.Now(),
				})
				return nil
			}

			// Write batch to destination
			if err := dstConn.BulkInsert(ctx, job.TargetTable, batch.Rows); err != nil {
				return fmt.Errorf("batch %d: %w", batch.Index, err)
			}

			migrated += int64(len(batch.Rows))

			// Calculate percentage
			var pct float64
			if job.TotalRows > 0 {
				pct = float64(migrated) / float64(job.TotalRows) * 100
				if pct > 100 {
					pct = 100
				}
			}

			// Broadcast progress
			s.hub.Broadcast(job.ID, domain.MigrationProgress{
				JobID:        job.ID,
				State:        domain.MigrationStatusRunning,
				MigratedRows: migrated,
				TotalRows:    job.TotalRows,
				Percentage:   pct,
				Message:      fmt.Sprintf("Batch %d processed (%d rows)", batch.Index+1, len(batch.Rows)),
				Timestamp:    time.Now(),
			})

		case streamErr, ok := <-errCh:
			if ok && streamErr != nil {
				return fmt.Errorf("source stream error: %w", streamErr)
			}
		}
	}
}

// CountSourceRows opens a temporary connection to the source DB and counts total rows in the table.
func (s *Streamer) CountSourceRows(ctx context.Context, job domain.MigrationJob) (int64, error) {
	srcConnMeta, err := s.projectRepo.GetConnectionByID(ctx, job.SourceConnID)
	if err != nil {
		return 0, err
	}

	srcPass, _ := s.encryptor.Decrypt(srcConnMeta.EncryptedPassword)
	srcURI, _ := s.encryptor.Decrypt(srcConnMeta.URI)

	srcAdapter, err := s.registry.Get(srcConnMeta.DBType)
	if err != nil {
		return 0, err
	}

	srcConn, err := srcAdapter.Connect(ctx, *srcConnMeta, srcPass, srcURI)
	if err != nil {
		return 0, apperrors.BadRequest(fmt.Sprintf("cannot connect to source: %v", err))
	}
	defer srcConn.Close()

	result, err := srcConn.QueryRows(ctx, job.SourceTable, domain.QueryRequest{Page: 1, Limit: 1})
	if err != nil {
		return 0, err
	}
	return result.TotalRows, nil
}
