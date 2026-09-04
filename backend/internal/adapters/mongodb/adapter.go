package mongodb

import (
	"context"
	"fmt"
	"net/url"
	"regexp"
	"strings"
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

// buildMongoURI intelligently constructs a MongoDB connection URI.
// For MongoDB Atlas (.mongodb.net), it mandates mongodb+srv:// and strips direct port numbers,
// because Atlas clusters resolve replica nodes via DNS SRV records.
func buildMongoURI(conn domain.DatabaseConnection, plainPassword, plainURI string) string {
	if plainURI != "" {
		uri := strings.TrimSpace(plainURI)
		// If user entered mongodb:// for an Atlas domain, auto-correct to mongodb+srv:// and strip port
		if strings.HasPrefix(uri, "mongodb://") && strings.Contains(uri, ".mongodb.net") {
			uri = strings.Replace(uri, "mongodb://", "mongodb+srv://", 1)
			re := regexp.MustCompile(`:\d+`)
			uri = re.ReplaceAllString(uri, "")
		}
		return uri
	}

	host := strings.TrimSpace(conn.Host)
	isAtlas := strings.Contains(host, ".mongodb.net")

	if isAtlas {
		// Strip accidental scheme or port in host
		host = strings.TrimPrefix(host, "mongodb+srv://")
		host = strings.TrimPrefix(host, "mongodb://")
		if idx := strings.Index(host, ":"); idx != -1 {
			host = host[:idx]
		}

		dbPart := strings.TrimSpace(conn.Database)
		if dbPart != "" {
			dbPart = "/" + dbPart
		}

		var uri string
		if conn.Username != "" && plainPassword != "" {
			escapedUser := url.QueryEscape(conn.Username)
			escapedPass := url.QueryEscape(plainPassword)
			uri = fmt.Sprintf("mongodb+srv://%s:%s@%s%s", escapedUser, escapedPass, host, dbPart)
		} else {
			uri = fmt.Sprintf("mongodb+srv://%s%s", host, dbPart)
		}

		if !strings.Contains(uri, "?") {
			if dbPart == "" {
				uri += "/?retryWrites=true&w=majority"
			} else {
				uri += "?retryWrites=true&w=majority"
			}
		}
		return uri
	}

	port := conn.Port
	if port == 0 {
		port = 27017
	}
	if conn.Username != "" && plainPassword != "" {
		escapedUser := url.QueryEscape(conn.Username)
		escapedPass := url.QueryEscape(plainPassword)
		return fmt.Sprintf("mongodb://%s:%s@%s:%d/%s", escapedUser, escapedPass, host, port, conn.Database)
	}
	return fmt.Sprintf("mongodb://%s:%d/%s", host, port, conn.Database)
}

func (a *Adapter) Connect(ctx context.Context, conn domain.DatabaseConnection, plainPassword, plainURI string) (ports.DatabaseConnection, error) {
	uri := buildMongoURI(conn, plainPassword, plainURI)
	dbName := conn.Database

	if dbName == "" {
		if u, err := url.Parse(uri); err == nil && len(u.Path) > 1 {
			dbName = strings.TrimPrefix(u.Path, "/")
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
