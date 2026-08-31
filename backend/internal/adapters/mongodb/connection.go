package mongodb

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// Connection wraps an active MongoDB database connection.
type Connection struct {
	client       *mongo.Client
	databaseName string
}

func (c *Connection) Ping(ctx context.Context) error {
	return c.client.Ping(ctx, readpref.Primary())
}

func (c *Connection) Close() error {
	return c.client.Disconnect(context.Background())
}

func (c *Connection) getDB() *mongo.Database {
	return c.client.Database(c.databaseName)
}

func (c *Connection) ListTables(ctx context.Context) ([]string, error) {
	collections, err := c.getDB().ListCollectionNames(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("list collections: %w", err)
	}
	return collections, nil
}

func (c *Connection) GetTableSchema(ctx context.Context, tableName string) (*domain.TableSchema, error) {
	coll := c.getDB().Collection(tableName)

	// Sample up to 20 documents to infer fields and types
	cursor, err := coll.Find(ctx, bson.M{}, options.Find().SetLimit(20))
	if err != nil {
		return nil, fmt.Errorf("sample collection documents: %w", err)
	}
	defer cursor.Close(ctx)

	fieldTypes := make(map[string]domain.SeasonType)
	var sampleDocs []bson.M
	if err := cursor.All(ctx, &sampleDocs); err != nil {
		return nil, fmt.Errorf("decode sample documents: %w", err)
	}

	for _, doc := range sampleDocs {
		for k, v := range doc {
			if _, exists := fieldTypes[k]; !exists || fieldTypes[k] == domain.SeasonTypeUnknown {
				fieldTypes[k] = inferBsonSeasonType(v)
			}
		}
	}

	// Always ensure _id is present as Primary Key
	if _, ok := fieldTypes["_id"]; !ok {
		fieldTypes["_id"] = domain.SeasonTypeString
	}

	var columns []domain.ColumnSchema
	for fieldName, seasonType := range fieldTypes {
		isPK := fieldName == "_id"
		columns = append(columns, domain.ColumnSchema{
			Name:         fieldName,
			DataType:     string(seasonType),
			SeasonType:   seasonType,
			IsPrimaryKey: isPK,
			IsNullable:   !isPK,
		})
	}

	count, _ := coll.EstimatedDocumentCount(ctx)

	return &domain.TableSchema{
		Name:        tableName,
		Columns:     columns,
		PrimaryKeys: []string{"_id"},
		RowCount:    count,
	}, nil
}

func (c *Connection) GetSchema(ctx context.Context) (*domain.DatabaseSchema, error) {
	tables, err := c.ListTables(ctx)
	if err != nil {
		return nil, err
	}

	var tableSchemas []domain.TableSchema
	for _, tableName := range tables {
		ts, err := c.GetTableSchema(ctx, tableName)
		if err != nil {
			continue
		}
		tableSchemas = append(tableSchemas, *ts)
	}

	return &domain.DatabaseSchema{
		DatabaseName: c.databaseName,
		DBType:       domain.DBTypeMongoDB,
		Tables:       tableSchemas,
	}, nil
}

func (c *Connection) QueryRows(ctx context.Context, table string, req domain.QueryRequest) (*domain.QueryResult, error) {
	coll := c.getDB().Collection(table)

	if req.Page < 1 {
		req.Page = 1
	}
	if req.Limit < 1 {
		req.Limit = 50
	}

	totalRows, err := coll.CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("count documents: %w", err)
	}

	skip := int64((req.Page - 1) * req.Limit)
	limit := int64(req.Limit)

	findOptions := options.Find().SetSkip(skip).SetLimit(limit)
	if req.OrderBy != "" {
		sortDir := 1
		if req.OrderDir == "desc" || req.OrderDir == "DESC" {
			sortDir = -1
		}
		findOptions.SetSort(bson.D{{Key: req.OrderBy, Value: sortDir}})
	}

	cursor, err := coll.Find(ctx, bson.M{}, findOptions)
	if err != nil {
		return nil, fmt.Errorf("query collection: %w", err)
	}
	defer cursor.Close(ctx)

	var rawDocs []bson.M
	if err := cursor.All(ctx, &rawDocs); err != nil {
		return nil, fmt.Errorf("decode collection documents: %w", err)
	}

	var rows []map[string]interface{}
	colSet := make(map[string]struct{})

	for _, doc := range rawDocs {
		cleanDoc := normalizeBsonDoc(doc)
		rows = append(rows, cleanDoc)
		for k := range cleanDoc {
			colSet[k] = struct{}{}
		}
	}

	var columns []string
	if _, ok := colSet["_id"]; ok {
		columns = append(columns, "_id")
	}
	for col := range colSet {
		if col != "_id" {
			columns = append(columns, col)
		}
	}

	totalPages := int(math.Ceil(float64(totalRows) / float64(req.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &domain.QueryResult{
		TableName:  table,
		Columns:    columns,
		Rows:       rows,
		TotalRows:  totalRows,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

func (c *Connection) InsertRow(ctx context.Context, table string, data map[string]interface{}) (map[string]interface{}, error) {
	coll := c.getDB().Collection(table)
	doc := prepareForBsonInsert(data)

	res, err := coll.InsertOne(ctx, doc)
	if err != nil {
		return nil, fmt.Errorf("insert document: %w", err)
	}

	if _, ok := doc["_id"]; !ok {
		doc["_id"] = res.InsertedID
	}

	return normalizeBsonDoc(doc), nil
}

func (c *Connection) UpdateRow(ctx context.Context, table string, primaryKey map[string]interface{}, data map[string]interface{}) error {
	coll := c.getDB().Collection(table)
	filter := buildBsonFilter(primaryKey)
	updateDoc := bson.M{"$set": prepareForBsonInsert(data)}

	res, err := coll.UpdateOne(ctx, filter, updateDoc)
	if err != nil {
		return fmt.Errorf("update document: %w", err)
	}
	if res.MatchedCount == 0 {
		return apperrors.NotFound("document matching primary key not found")
	}
	return nil
}

func (c *Connection) DeleteRow(ctx context.Context, table string, primaryKey map[string]interface{}) error {
	coll := c.getDB().Collection(table)
	filter := buildBsonFilter(primaryKey)

	res, err := coll.DeleteOne(ctx, filter)
	if err != nil {
		return fmt.Errorf("delete document: %w", err)
	}
	if res.DeletedCount == 0 {
		return apperrors.NotFound("document matching primary key not found")
	}
	return nil
}

func (c *Connection) StreamRows(ctx context.Context, table string, batchSize int) (<-chan domain.RowBatch, <-chan error) {
	rowCh := make(chan domain.RowBatch, 4)
	errCh := make(chan error, 1)

	go func() {
		defer close(rowCh)
		defer close(errCh)

		coll := c.getDB().Collection(table)
		cursor, err := coll.Find(ctx, bson.M{}, options.Find().SetBatchSize(int32(batchSize)))
		if err != nil {
			errCh <- fmt.Errorf("stream collection: %w", err)
			return
		}
		defer cursor.Close(ctx)

		var batch []map[string]interface{}
		batchIndex := 0

		for cursor.Next(ctx) {
			var doc bson.M
			if err := cursor.Decode(&doc); err != nil {
				errCh <- fmt.Errorf("decode streamed document: %w", err)
				return
			}
			batch = append(batch, normalizeBsonDoc(doc))

			if len(batch) >= batchSize {
				rowCh <- domain.RowBatch{
					Index:  batchIndex,
					Rows:   batch,
					IsLast: false,
				}
				batch = nil
				batchIndex++
			}
		}

		if err := cursor.Err(); err != nil {
			errCh <- fmt.Errorf("cursor iteration error: %w", err)
			return
		}

		// Final batch
		rowCh <- domain.RowBatch{
			Index:  batchIndex,
			Rows:   batch,
			IsLast: true,
		}
	}()

	return rowCh, errCh
}

func (c *Connection) BulkInsert(ctx context.Context, table string, rows []map[string]interface{}) error {
	if len(rows) == 0 {
		return nil
	}

	coll := c.getDB().Collection(table)
	var docs []interface{}
	for _, row := range rows {
		docs = append(docs, prepareForBsonInsert(row))
	}

	_, err := coll.InsertMany(ctx, docs)
	if err != nil {
		return fmt.Errorf("bulk insert into mongo: %w", err)
	}
	return nil
}

func (c *Connection) ExecDDL(ctx context.Context, ddl string) error {
	// MongoDB creates collections implicitly on insert
	return nil
}

// Helpers

func inferBsonSeasonType(v interface{}) domain.SeasonType {
	if v == nil {
		return domain.SeasonTypeUnknown
	}
	switch v.(type) {
	case bool:
		return domain.SeasonTypeBool
	case int, int32, int64:
		return domain.SeasonTypeInt
	case float32, float64:
		return domain.SeasonTypeFloat
	case string:
		return domain.SeasonTypeString
	case time.Time, primitive.DateTime:
		return domain.SeasonTypeTimestamp
	case primitive.ObjectID:
		return domain.SeasonTypeString
	case []interface{}, primitive.A:
		return domain.SeasonTypeArray
	case map[string]interface{}, bson.M, bson.D:
		return domain.SeasonTypeJSON
	default:
		return domain.SeasonTypeString
	}
}

func normalizeBsonDoc(doc bson.M) map[string]interface{} {
	out := make(map[string]interface{})
	for k, v := range doc {
		switch val := v.(type) {
		case primitive.ObjectID:
			out[k] = val.Hex()
		case primitive.DateTime:
			out[k] = val.Time().Format(time.RFC3339)
		default:
			out[k] = val
		}
	}
	return out
}

func prepareForBsonInsert(data map[string]interface{}) bson.M {
	doc := bson.M{}
	for k, v := range data {
		if k == "id" {
			// If target collection doesn't specify _id, map "id" to "_id"
			if _, hasId := data["_id"]; !hasId {
				doc["_id"] = v
				continue
			}
		}
		doc[k] = v
	}
	return doc
}

func buildBsonFilter(primaryKey map[string]interface{}) bson.M {
	filter := bson.M{}
	for k, v := range primaryKey {
		key := k
		if key == "id" {
			key = "_id"
		}
		if strVal, ok := v.(string); ok && key == "_id" {
			if oid, err := primitive.ObjectIDFromHex(strVal); err == nil {
				filter[key] = oid
				continue
			}
		}
		filter[key] = v
	}
	return filter
}
