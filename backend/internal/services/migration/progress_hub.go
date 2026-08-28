package migration

import (
	"sync"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// ProgressHub is an in-memory pub/sub fan-out for broadcasting migration progress events to SSE clients.
type ProgressHub struct {
	mu          sync.RWMutex
	subscribers map[string][]chan domain.MigrationProgress // jobID -> list of client channels
}

// NewProgressHub creates a new ProgressHub instance.
func NewProgressHub() *ProgressHub {
	return &ProgressHub{
		subscribers: make(map[string][]chan domain.MigrationProgress),
	}
}

// Subscribe creates a buffered channel for a client to receive progress events for a specific job.
func (h *ProgressHub) Subscribe(jobID string) chan domain.MigrationProgress {
	ch := make(chan domain.MigrationProgress, 20)
	h.mu.Lock()
	h.subscribers[jobID] = append(h.subscribers[jobID], ch)
	h.mu.Unlock()
	return ch
}

// Unsubscribe removes a client channel from the subscriber list for a job.
func (h *ProgressHub) Unsubscribe(jobID string, ch chan domain.MigrationProgress) {
	h.mu.Lock()
	defer h.mu.Unlock()

	subs := h.subscribers[jobID]
	for i, sub := range subs {
		if sub == ch {
			h.subscribers[jobID] = append(subs[:i], subs[i+1:]...)
			close(ch)
			return
		}
	}
}

// Broadcast sends a progress event to all subscribers of a job.
// If a subscriber's channel is full (client too slow), the event is dropped for that client.
func (h *ProgressHub) Broadcast(jobID string, event domain.MigrationProgress) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, ch := range h.subscribers[jobID] {
		select {
		case ch <- event:
		default:
			// Client too slow — skip this event to avoid blocking the pipeline
		}
	}
}

// Close closes all subscriber channels for a job and removes the job from the hub.
// Call this when a migration completes, fails, or is cancelled.
func (h *ProgressHub) Close(jobID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	for _, ch := range h.subscribers[jobID] {
		close(ch)
	}
	delete(h.subscribers, jobID)
}

// SubscriberCount returns the number of active subscribers for a job.
func (h *ProgressHub) SubscriberCount(jobID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.subscribers[jobID])
}
