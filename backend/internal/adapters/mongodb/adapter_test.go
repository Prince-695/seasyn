package mongodb

import (
	"strings"
	"testing"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestInferBsonSeasonType(t *testing.T) {
	oid := primitive.NewObjectID()
	now := time.Now()

	tests := []struct {
		name     string
		input    interface{}
		expected domain.SeasonType
	}{
		{"bool", true, domain.SeasonTypeBool},
		{"int", 42, domain.SeasonTypeInt},
		{"int64", int64(100), domain.SeasonTypeInt},
		{"float", 3.14, domain.SeasonTypeFloat},
		{"string", "hello", domain.SeasonTypeString},
		{"timestamp", now, domain.SeasonTypeTimestamp},
		{"objectID", oid, domain.SeasonTypeString},
		{"array", []interface{}{1, 2, 3}, domain.SeasonTypeArray},
		{"jsonMap", map[string]interface{}{"a": "b"}, domain.SeasonTypeJSON},
		{"nil", nil, domain.SeasonTypeUnknown},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := inferBsonSeasonType(tt.input)
			if got != tt.expected {
				t.Errorf("inferBsonSeasonType(%v) = %v, want %v", tt.input, got, tt.expected)
			}
		})
	}
}

func TestPrepareForBsonInsert(t *testing.T) {
	data := map[string]interface{}{
		"id":   "uuid-12345",
		"name": "Test User",
	}

	doc := prepareForBsonInsert(data)
	if doc["_id"] != "uuid-12345" {
		t.Errorf("expected _id to be uuid-12345, got %v", doc["_id"])
	}
}

func TestBuildBsonFilter(t *testing.T) {
	oid := primitive.NewObjectID()
	pk := map[string]interface{}{
		"id": oid.Hex(),
	}

	filter := buildBsonFilter(pk)
	if filter["_id"] != oid {
		t.Errorf("expected filter _id to be parsed ObjectID, got %v", filter["_id"])
	}
}

func TestBuildMongoURI(t *testing.T) {
	// Case 1: Atlas cluster host without URI
	atlasConn := domain.DatabaseConnection{
		Host:     "cluster0.fwpju1g.mongodb.net",
		Port:     27017,
		Username: "adminUser",
		Database: "myDatabase",
	}
	atlasURI := buildMongoURI(atlasConn, "SecretPass@123", "")
	expectedPrefix := "mongodb+srv://adminUser:SecretPass%40123@cluster0.fwpju1g.mongodb.net/myDatabase"
	if !strings.HasPrefix(atlasURI, expectedPrefix) {
		t.Errorf("expected Atlas URI starting with %q, got %q", expectedPrefix, atlasURI)
	}
	if strings.Contains(atlasURI, ":27017") {
		t.Errorf("Atlas URI must not contain port :27017, got %q", atlasURI)
	}

	// Case 2: Atlas URI with accidental mongodb:// and port :27017
	dirtyURI := "mongodb://user:pass@cluster0.fwpju1g.mongodb.net:27017/prodDB"
	correctedURI := buildMongoURI(domain.DatabaseConnection{}, "", dirtyURI)
	expectedCorrected := "mongodb+srv://user:pass@cluster0.fwpju1g.mongodb.net/prodDB"
	if correctedURI != expectedCorrected {
		t.Errorf("expected %q, got %q", expectedCorrected, correctedURI)
	}

	// Case 3: Local MongoDB
	localConn := domain.DatabaseConnection{
		Host:     "127.0.0.1",
		Port:     27017,
		Username: "root",
		Database: "testdb",
	}
	localURI := buildMongoURI(localConn, "localpass", "")
	expectedLocal := "mongodb://root:localpass@127.0.0.1:27017/testdb"
	if localURI != expectedLocal {
		t.Errorf("expected %q, got %q", expectedLocal, localURI)
	}
}
