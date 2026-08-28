package migration_test

import (
	"testing"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/services/migration"
)

func TestProgressHub_SubscribeBroadcastUnsubscribe(t *testing.T) {
	hub := migration.NewProgressHub()
	jobID := "job-test-123"

	// 1. Subscribe two listeners
	ch1 := hub.Subscribe(jobID)
	ch2 := hub.Subscribe(jobID)

	if count := hub.SubscriberCount(jobID); count != 2 {
		t.Fatalf("expected 2 subscribers, got %d", count)
	}

	// 2. Broadcast event
	event := domain.MigrationProgress{
		JobID:        jobID,
		State:        domain.MigrationStatusRunning,
		MigratedRows: 50,
		TotalRows:    100,
		Percentage:   50.0,
		Message:      "Halfway done",
		Timestamp:    time.Now(),
	}

	hub.Broadcast(jobID, event)

	// Verify both channels received the event
	select {
	case e1 := <-ch1:
		if e1.MigratedRows != 50 || e1.Percentage != 50.0 {
			t.Errorf("ch1 received incorrect event: %+v", e1)
		}
	case <-time.After(100 * time.Millisecond):
		t.Errorf("ch1 timed out waiting for event")
	}

	select {
	case e2 := <-ch2:
		if e2.MigratedRows != 50 || e2.Percentage != 50.0 {
			t.Errorf("ch2 received incorrect event: %+v", e2)
		}
	case <-time.After(100 * time.Millisecond):
		t.Errorf("ch2 timed out waiting for event")
	}

	// 3. Unsubscribe ch1
	hub.Unsubscribe(jobID, ch1)
	if count := hub.SubscriberCount(jobID); count != 1 {
		t.Errorf("expected 1 subscriber after unsubscribe, got %d", count)
	}

	// 4. Close job hub
	hub.Close(jobID)
	if count := hub.SubscriberCount(jobID); count != 0 {
		t.Errorf("expected 0 subscribers after close, got %d", count)
	}
}
