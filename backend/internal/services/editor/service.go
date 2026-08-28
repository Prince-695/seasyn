package editor

import (
	"context"
	"fmt"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/Prince-695/seasyn/backend/pkg/crypto"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

type schemaService struct {
	projectRepo ports.ProjectRepository
	orgRepo     ports.OrgRepository
	registry    ports.AdapterRegistry
	encryptor   *crypto.Encryptor
}

func NewSchemaService(
	projectRepo ports.ProjectRepository,
	orgRepo ports.OrgRepository,
	registry ports.AdapterRegistry,
	encryptor *crypto.Encryptor,
) ports.SchemaService {
	return &schemaService{
		projectRepo: projectRepo,
		orgRepo:     orgRepo,
		registry:    registry,
		encryptor:   encryptor,
	}
}

// requireRole checks that the user has at least minRole in the organization
func (s *schemaService) requireRole(ctx context.Context, orgID, userID string, minRole domain.OrgRole) error {
	member, err := s.orgRepo.GetMember(ctx, orgID, userID)
	if err != nil {
		return apperrors.Forbidden("You are not a member of this organization")
	}
	order := map[domain.OrgRole]int{
		domain.OrgRoleViewer: 0,
		domain.OrgRoleMember: 1,
		domain.OrgRoleAdmin:  2,
		domain.OrgRoleOwner:  3,
	}
	if order[member.Role] < order[minRole] {
		return apperrors.Forbidden("You do not have permission to perform this action")
	}
	return nil
}

// openConnection verifies RBAC, decrypts credentials, and returns an active DatabaseConnection
func (s *schemaService) openConnection(ctx context.Context, userID, orgID, projectID, connID string, minRole domain.OrgRole) (ports.DatabaseConnection, *domain.DatabaseConnection, error) {
	if err := s.requireRole(ctx, orgID, userID, minRole); err != nil {
		return nil, nil, err
	}

	p, err := s.projectRepo.GetProjectByID(ctx, projectID)
	if err != nil {
		return nil, nil, err
	}
	if p.OrganizationID != orgID {
		return nil, nil, apperrors.Forbidden("Project does not belong to this organization")
	}

	conn, err := s.projectRepo.GetConnectionByID(ctx, connID)
	if err != nil {
		return nil, nil, err
	}
	if conn.ProjectID != projectID {
		return nil, nil, apperrors.Forbidden("Connection does not belong to this project")
	}

	// Decrypt credentials
	plainPass, err := s.encryptor.Decrypt(conn.EncryptedPassword)
	if err != nil {
		return nil, nil, apperrors.Internal(fmt.Sprintf("Failed to decrypt database password: %v", err))
	}
	plainURI, err := s.encryptor.Decrypt(conn.URI)
	if err != nil {
		return nil, nil, apperrors.Internal(fmt.Sprintf("Failed to decrypt database URI: %v", err))
	}

	adapter, err := s.registry.Get(conn.DBType)
	if err != nil {
		return nil, nil, err
	}

	activeConn, err := adapter.Connect(ctx, *conn, plainPass, plainURI)
	if err != nil {
		return nil, nil, err
	}

	return activeConn, conn, nil
}

// --- Schema Inspection ---

func (s *schemaService) InspectDatabase(ctx context.Context, userID, orgID, projectID, connID string) (*domain.DatabaseSchema, error) {
	dbConn, _, err := s.openConnection(ctx, userID, orgID, projectID, connID, domain.OrgRoleViewer)
	if err != nil {
		return nil, err
	}
	defer dbConn.Close()

	return dbConn.GetSchema(ctx)
}

func (s *schemaService) ListTables(ctx context.Context, userID, orgID, projectID, connID string) ([]string, error) {
	dbConn, _, err := s.openConnection(ctx, userID, orgID, projectID, connID, domain.OrgRoleViewer)
	if err != nil {
		return nil, err
	}
	defer dbConn.Close()

	return dbConn.ListTables(ctx)
}

func (s *schemaService) InspectTable(ctx context.Context, userID, orgID, projectID, connID, tableName string) (*domain.TableSchema, error) {
	dbConn, _, err := s.openConnection(ctx, userID, orgID, projectID, connID, domain.OrgRoleViewer)
	if err != nil {
		return nil, err
	}
	defer dbConn.Close()

	return dbConn.GetTableSchema(ctx, tableName)
}

// --- Schema Diff Engine ---

func (s *schemaService) CompareSchemas(ctx context.Context, userID, orgID, projectID string, req domain.CompareSchemaRequest) (*domain.SchemaDiff, error) {
	srcConn, srcMeta, err := s.openConnection(ctx, userID, orgID, projectID, req.SourceConnectionID, domain.OrgRoleViewer)
	if err != nil {
		return nil, fmt.Errorf("source connection error: %w", err)
	}
	defer srcConn.Close()

	dstConn, dstMeta, err := s.openConnection(ctx, userID, orgID, projectID, req.TargetConnectionID, domain.OrgRoleViewer)
	if err != nil {
		return nil, fmt.Errorf("target connection error: %w", err)
	}
	defer dstConn.Close()

	srcSchema, err := srcConn.GetSchema(ctx)
	if err != nil {
		return nil, fmt.Errorf("inspect source schema: %w", err)
	}

	dstSchema, err := dstConn.GetSchema(ctx)
	if err != nil {
		return nil, fmt.Errorf("inspect target schema: %w", err)
	}

	return CalculateSchemaDiff(req.SourceConnectionID, req.TargetConnectionID, srcMeta.DBType, dstMeta.DBType, srcSchema, dstSchema), nil
}

// CalculateSchemaDiff performs a deterministic comparison between source and target schemas
func CalculateSchemaDiff(srcID, dstID string, srcDBType, dstDBType domain.DBType, src, dst *domain.DatabaseSchema) *domain.SchemaDiff {
	diff := &domain.SchemaDiff{
		SourceConnID: srcID,
		TargetConnID: dstID,
		SourceDBType: srcDBType,
		TargetDBType: dstDBType,
		GeneratedAt:  time.Now(),
	}

	srcTableMap := make(map[string]domain.TableSchema)
	for _, t := range src.Tables {
		srcTableMap[t.Name] = t
	}

	dstTableMap := make(map[string]domain.TableSchema)
	for _, t := range dst.Tables {
		dstTableMap[t.Name] = t
	}

	// 1. Check Source Tables
	for srcName, srcTable := range srcTableMap {
		dstTable, existsInDst := dstTableMap[srcName]
		if !existsInDst {
			diff.TablesAdded = append(diff.TablesAdded, srcName)
			continue
		}

		// Table exists in both — compute structural column/index diffs
		tDiff := compareTableSchemas(srcTable, dstTable)
		if tDiff.DiffType == "altered" {
			diff.TablesAltered = append(diff.TablesAltered, tDiff)
		} else {
			diff.TablesSame = append(diff.TablesSame, srcName)
		}
	}

	// 2. Check Removed Tables (present in target but not in source)
	for dstName := range dstTableMap {
		if _, existsInSrc := srcTableMap[dstName]; !existsInSrc {
			diff.TablesRemoved = append(diff.TablesRemoved, dstName)
		}
	}

	return diff
}

func compareTableSchemas(src, dst domain.TableSchema) domain.TableDiff {
	tDiff := domain.TableDiff{
		Name:        src.Name,
		DiffType:    "identical",
		SourceTable: &src,
		TargetTable: &dst,
	}

	srcColMap := make(map[string]domain.ColumnSchema)
	for _, c := range src.Columns {
		srcColMap[c.Name] = c
	}

	dstColMap := make(map[string]domain.ColumnSchema)
	for _, c := range dst.Columns {
		dstColMap[c.Name] = c
	}

	isAltered := false

	// Check added & altered columns
	for colName, srcCol := range srcColMap {
		dstCol, exists := dstColMap[colName]
		if !exists {
			tDiff.ColumnDiffs = append(tDiff.ColumnDiffs, domain.ColumnDiff{
				Name:         colName,
				DiffType:     "added",
				SourceColumn: &srcCol,
			})
			isAltered = true
			continue
		}

		// Check changes
		var alterDetails []string
		if srcCol.SeasonType != dstCol.SeasonType {
			alterDetails = append(alterDetails, fmt.Sprintf("type changed from %s (%s) to %s (%s)", dstCol.SeasonType, dstCol.DataType, srcCol.SeasonType, srcCol.DataType))
		}
		if srcCol.IsNullable != dstCol.IsNullable {
			alterDetails = append(alterDetails, fmt.Sprintf("nullable changed from %v to %v", dstCol.IsNullable, srcCol.IsNullable))
		}
		if srcCol.IsPrimaryKey != dstCol.IsPrimaryKey {
			alterDetails = append(alterDetails, fmt.Sprintf("primary key changed from %v to %v", dstCol.IsPrimaryKey, srcCol.IsPrimaryKey))
		}

		if len(alterDetails) > 0 {
			tDiff.ColumnDiffs = append(tDiff.ColumnDiffs, domain.ColumnDiff{
				Name:         colName,
				DiffType:     "altered",
				SourceColumn: &srcCol,
				TargetColumn: &dstCol,
				AlterDetails: alterDetails,
			})
			isAltered = true
		}
	}

	// Check removed columns
	for colName, dstCol := range dstColMap {
		if _, exists := srcColMap[colName]; !exists {
			tDiff.ColumnDiffs = append(tDiff.ColumnDiffs, domain.ColumnDiff{
				Name:         colName,
				DiffType:     "removed",
				TargetColumn: &dstCol,
			})
			isAltered = true
		}
	}

	if isAltered {
		tDiff.DiffType = "altered"
	}

	return tDiff
}

// --- Live Data Explorer (Query, Insert, Update, Delete) ---

func (s *schemaService) QueryTableRows(ctx context.Context, userID, orgID, projectID, connID, tableName string, req domain.QueryRequest) (*domain.QueryResult, error) {
	dbConn, _, err := s.openConnection(ctx, userID, orgID, projectID, connID, domain.OrgRoleViewer)
	if err != nil {
		return nil, err
	}
	defer dbConn.Close()

	return dbConn.QueryRows(ctx, tableName, req)
}

func (s *schemaService) InsertTableRow(ctx context.Context, userID, orgID, projectID, connID, tableName string, req domain.InsertRowRequest) (map[string]interface{}, error) {
	dbConn, _, err := s.openConnection(ctx, userID, orgID, projectID, connID, domain.OrgRoleMember)
	if err != nil {
		return nil, err
	}
	defer dbConn.Close()

	return dbConn.InsertRow(ctx, tableName, req.Data)
}

func (s *schemaService) UpdateTableRow(ctx context.Context, userID, orgID, projectID, connID, tableName string, req domain.UpdateRowRequest) error {
	dbConn, _, err := s.openConnection(ctx, userID, orgID, projectID, connID, domain.OrgRoleMember)
	if err != nil {
		return err
	}
	defer dbConn.Close()

	return dbConn.UpdateRow(ctx, tableName, req.PrimaryKey, req.Data)
}

func (s *schemaService) DeleteTableRow(ctx context.Context, userID, orgID, projectID, connID, tableName string, req domain.DeleteRowRequest) error {
	dbConn, _, err := s.openConnection(ctx, userID, orgID, projectID, connID, domain.OrgRoleMember)
	if err != nil {
		return err
	}
	defer dbConn.Close()

	return dbConn.DeleteRow(ctx, tableName, req.PrimaryKey)
}
