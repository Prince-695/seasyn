package registry

import (
	"fmt"
	"sync"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

type adapterRegistry struct {
	mu       sync.RWMutex
	adapters map[domain.DBType]ports.DatabaseAdapter
}

func NewAdapterRegistry() ports.AdapterRegistry {
	return &adapterRegistry{
		adapters: make(map[domain.DBType]ports.DatabaseAdapter),
	}
}

func (r *adapterRegistry) Register(dbType domain.DBType, adapter ports.DatabaseAdapter) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.adapters[dbType] = adapter
}

func (r *adapterRegistry) Get(dbType domain.DBType) (ports.DatabaseAdapter, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	adapter, ok := r.adapters[dbType]
	if !ok {
		return nil, apperrors.BadRequest(fmt.Sprintf("unsupported database engine: %s", dbType))
	}
	return adapter, nil
}
