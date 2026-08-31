package mongodb

import (
	"context"
	"fmt"
	"net/url"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// Adapter connects to MongoDB databases.
type Adapter struct{}

func NewAdapter() ports.DatabaseAdapter {
	return &Adapter{}
}

func (a *Adapter) Connect(ctx context.Context, conn domain.DatabaseConnection, plainPassword, plainURI string) (ports.DatabaseConnection, error) {
	var uri string
	dbName := conn.Database

	if plainURI != "" {
		uri = plainURI
		// Extract db name from URI if not explicitly provided
		if dbName == "" {
			if u, err := url.Parse(plainURI); err == nil && len(u.Path) > 1 {
				dbName = u.Path[1:]
			}
		}
	} else {
		port := conn.Port
		if port == 0 {
			port = 27017
		}
		if conn.Username != "" && plainPassword != "" {
			escapedUser := url.QueryEscape(conn.Username)
			escapedPass := url.QueryEscape(plainPassword)
			uri = fmt.Sprintf("mongodb://%s:%s@%s:%d/%s", escapedUser, escapedPass, conn.Host, port, conn.Database)
		} else {
			uri = fmt.Sprintf("mongodb://%s:%d/%s", conn.Host, port, conn.Database)
		}
	}

	if dbName == "" {
		dbName = "admin"
	}

	clientOptions := options.Client().ApplyURI(uri).SetTimeout(10 * time.Second)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, apperrors.BadRequest(fmt.Sprintf("invalid MongoDB connection: %v", err))
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := client.Ping(pingCtx, readpref.Primary()); err != nil {
		_ = client.Disconnect(context.Background())
		return nil, apperrors.BadRequest(fmt.Sprintf("failed to connect to MongoDB: %v", err))
	}

	return &Connection{
		client:       client,
		databaseName: dbName,
	}, nil
}
