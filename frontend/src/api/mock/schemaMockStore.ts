import type {
  DatabaseSchema,
  TableSchema,
  QueryResult,
  SchemaDiff,
  TableRowQueryParams,
  SeasonType,
} from "@/types/schema"
import type { ApiResponse } from "../types"

// ─── Local In-Memory Mock Database Store ────────────────────────────────────

interface MockStore {
  [connId: string]: {
    schema: DatabaseSchema
    rows: Record<string, Record<string, unknown>[]>
  }
}

const mockDbStore: MockStore = {}

export function getOrCreateMockDb(
  connId: string,
  dbType = "postgres",
  dbName = "production_db"
): { schema: DatabaseSchema; rows: Record<string, Record<string, unknown>[]> } {
  if (mockDbStore[connId]) {
    return mockDbStore[connId]
  }

  // Pre-seed realistic tables and data
  const usersCols = [
    {
      name: "id",
      data_type: "uuid",
      season_type: "uuid" as SeasonType,
      is_nullable: false,
      is_primary_key: true,
      is_foreign_key: false,
      default_value: "gen_random_uuid()",
    },
    {
      name: "email",
      data_type: "varchar(255)",
      season_type: "string" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
    },
    {
      name: "full_name",
      data_type: "varchar(100)",
      season_type: "string" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
    },
    {
      name: "role",
      data_type: "varchar(32)",
      season_type: "enum" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
      default_value: "'member'",
    },
    {
      name: "is_active",
      data_type: "boolean",
      season_type: "bool" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
      default_value: "true",
    },
    {
      name: "created_at",
      data_type: "timestamptz",
      season_type: "timestamp" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
      default_value: "now()",
    },
    {
      name: "metadata",
      data_type: "jsonb",
      season_type: "json" as SeasonType,
      is_nullable: true,
      is_primary_key: false,
      is_foreign_key: false,
    },
  ]

  const ordersCols = [
    {
      name: "id",
      data_type: "uuid",
      season_type: "uuid" as SeasonType,
      is_nullable: false,
      is_primary_key: true,
      is_foreign_key: false,
      default_value: "gen_random_uuid()",
    },
    {
      name: "user_id",
      data_type: "uuid",
      season_type: "uuid" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: true,
      foreign_table: "users",
      foreign_column: "id",
    },
    {
      name: "order_number",
      data_type: "varchar(64)",
      season_type: "string" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
    },
    {
      name: "amount",
      data_type: "numeric(10,2)",
      season_type: "decimal" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
    },
    {
      name: "status",
      data_type: "varchar(32)",
      season_type: "enum" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
      default_value: "'pending'",
    },
    {
      name: "created_at",
      data_type: "timestamptz",
      season_type: "timestamp" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
      default_value: "now()",
    },
  ]

  const productsCols = [
    {
      name: "id",
      data_type: "int8",
      season_type: "int" as SeasonType,
      is_nullable: false,
      is_primary_key: true,
      is_foreign_key: false,
    },
    {
      name: "sku",
      data_type: "varchar(64)",
      season_type: "string" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
    },
    {
      name: "title",
      data_type: "varchar(255)",
      season_type: "string" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
    },
    {
      name: "price",
      data_type: "numeric(8,2)",
      season_type: "decimal" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
    },
    {
      name: "stock_quantity",
      data_type: "int4",
      season_type: "int" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
      default_value: "0",
    },
    {
      name: "is_featured",
      data_type: "boolean",
      season_type: "bool" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
      default_value: "false",
    },
  ]

  const auditCols = [
    {
      name: "id",
      data_type: "uuid",
      season_type: "uuid" as SeasonType,
      is_nullable: false,
      is_primary_key: true,
      is_foreign_key: false,
    },
    {
      name: "action",
      data_type: "varchar(64)",
      season_type: "string" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
    },
    {
      name: "actor_email",
      data_type: "varchar(255)",
      season_type: "string" as SeasonType,
      is_nullable: true,
      is_primary_key: false,
      is_foreign_key: false,
    },
    {
      name: "payload",
      data_type: "jsonb",
      season_type: "json" as SeasonType,
      is_nullable: true,
      is_primary_key: false,
      is_foreign_key: false,
    },
    {
      name: "ip_address",
      data_type: "varchar(45)",
      season_type: "string" as SeasonType,
      is_nullable: true,
      is_primary_key: false,
      is_foreign_key: false,
    },
    {
      name: "recorded_at",
      data_type: "timestamptz",
      season_type: "timestamp" as SeasonType,
      is_nullable: false,
      is_primary_key: false,
      is_foreign_key: false,
      default_value: "now()",
    },
  ]

  const tables: TableSchema[] = [
    {
      name: "users",
      schema: "public",
      columns: usersCols,
      primary_keys: ["id"],
      indexes: [
        {
          name: "idx_users_email",
          columns: ["email"],
          is_unique: true,
          is_primary: false,
        },
        {
          name: "idx_users_role",
          columns: ["role"],
          is_unique: false,
          is_primary: false,
        },
      ],
      constraints: [
        {
          name: "users_email_key",
          type: "UNIQUE",
          columns: ["email"],
        },
      ],
      row_count: 4,
      size_bytes: 49152,
    },
    {
      name: "orders",
      schema: "public",
      columns: ordersCols,
      primary_keys: ["id"],
      indexes: [
        {
          name: "idx_orders_user_id",
          columns: ["user_id"],
          is_unique: false,
          is_primary: false,
        },
        {
          name: "idx_orders_status",
          columns: ["status"],
          is_unique: false,
          is_primary: false,
        },
      ],
      constraints: [
        {
          name: "orders_order_number_key",
          type: "UNIQUE",
          columns: ["order_number"],
        },
        {
          name: "fk_orders_user",
          type: "FOREIGN KEY",
          columns: ["user_id"],
          foreign_table: "users",
          foreign_columns: ["id"],
        },
      ],
      row_count: 2,
      size_bytes: 32768,
    },
    {
      name: "products",
      schema: "public",
      columns: productsCols,
      primary_keys: ["id"],
      indexes: [
        {
          name: "idx_products_sku",
          columns: ["sku"],
          is_unique: true,
          is_primary: false,
        },
        {
          name: "idx_products_price",
          columns: ["price"],
          is_unique: false,
          is_primary: false,
        },
      ],
      constraints: [
        {
          name: "products_sku_key",
          type: "UNIQUE",
          columns: ["sku"],
        },
      ],
      row_count: 3,
      size_bytes: 24576,
    },
    {
      name: "audit_logs",
      schema: "public",
      columns: auditCols,
      primary_keys: ["id"],
      indexes: [
        {
          name: "idx_audit_recorded_at",
          columns: ["recorded_at"],
          is_unique: false,
          is_primary: false,
        },
      ],
      constraints: [],
      row_count: 1,
      size_bytes: 16384,
    },
  ]

  const initialUsers: Record<string, unknown>[] = [
    {
      id: "a1b2c3d4-e5f6-7890-abcd-111111111111",
      email: "alex.mercer@cyberdyne.io",
      full_name: "Alex Mercer",
      role: "owner",
      is_active: true,
      created_at: "2026-08-15T09:30:00Z",
      metadata: { department: "Engineering", tier: "enterprise" },
    },
    {
      id: "b2c3d4e5-f6a7-8901-bcde-222222222222",
      email: "elena.rostova@cyberdyne.io",
      full_name: "Elena Rostova",
      role: "admin",
      is_active: true,
      created_at: "2026-08-18T14:12:00Z",
      metadata: { department: "DevOps", on_call: true },
    },
    {
      id: "c3d4e5f6-a7b8-9012-cdef-333333333333",
      email: "dev.marcus@matrix.corp",
      full_name: "Marcus Vance",
      role: "member",
      is_active: false,
      created_at: "2026-08-20T10:00:00Z",
      metadata: { department: "QA", contractor: true },
    },
    {
      id: "d4e5f6a7-b8c9-0123-defa-444444444444",
      email: "samantha.carter@stargate.mil",
      full_name: "Samantha Carter",
      role: "admin",
      is_active: true,
      created_at: "2026-08-22T16:45:00Z",
      metadata: { department: "Platform", access: "full" },
    },
  ]

  const initialProducts: Record<string, unknown>[] = [
    {
      id: 101,
      sku: "PROD-A100",
      title: "Universal Schema Connector",
      price: 299.0,
      stock_quantity: 450,
      is_featured: true,
    },
    {
      id: 102,
      sku: "PROD-B250",
      title: "Zero-Downtime CDC Streamer",
      price: 799.0,
      stock_quantity: 120,
      is_featured: true,
    },
    {
      id: 103,
      sku: "PROD-C300",
      title: "AES-256 Secret Vault License",
      price: 149.0,
      stock_quantity: 999,
      is_featured: false,
    },
  ]

  const initialOrders: Record<string, unknown>[] = [
    {
      id: "f1a2b3c4-d5e6-7890-1234-555555555555",
      user_id: "a1b2c3d4-e5f6-7890-abcd-111111111111",
      order_number: "ORD-2026-8941",
      amount: 1498.0,
      status: "completed",
      created_at: "2026-08-25T11:20:00Z",
    },
    {
      id: "e2b3c4d5-e6f7-8901-2345-666666666666",
      user_id: "b2c3d4e5-f6a7-8901-bcde-222222222222",
      order_number: "ORD-2026-9012",
      amount: 299.0,
      status: "processing",
      created_at: "2026-08-28T15:10:00Z",
    },
  ]

  const initialAudit: Record<string, unknown>[] = [
    {
      id: "9a8b7c6d-5e4f-3210-fedc-777777777777",
      action: "connection.introspect",
      actor_email: "sarah.connor@cyberdyne.io",
      payload: { target: "production_db", duration_ms: 42 },
      ip_address: "192.168.1.100",
      recorded_at: "2026-09-04T12:00:00Z",
    },
  ]

  const result = {
    schema: {
      db_type: dbType,
      database_name: dbName,
      tables,
      inspected_at: new Date().toISOString(),
    },
    rows: {
      users: initialUsers,
      products: initialProducts,
      orders: initialOrders,
      audit_logs: initialAudit,
    },
  }

  mockDbStore[connId] = result
  return result
}

// ─── Mock Fallback CRUD Handlers ─────────────────────────────────────────────

export const schemaMockStore = {
  getSchema: (connId: string): ApiResponse<DatabaseSchema> => {
    const mock = getOrCreateMockDb(connId)
    return {
      success: true,
      data: mock.schema,
      message: "Schema inspected successfully (mock)",
    }
  },

  listTables: (connId: string): ApiResponse<TableSchema[]> => {
    const mock = getOrCreateMockDb(connId)
    return {
      success: true,
      data: mock.schema.tables,
      message: "Tables retrieved successfully (mock)",
    }
  },

  getTable: (connId: string, tableName: string): ApiResponse<TableSchema> => {
    const mock = getOrCreateMockDb(connId)
    const found = mock.schema.tables.find((t) => t.name === tableName)
    if (!found) {
      throw new Error(`Table ${tableName} not found`)
    }
    return {
      success: true,
      data: found,
      message: "Table structure retrieved (mock)",
    }
  },

  getTableRows: (
    connId: string,
    tableName: string,
    params: TableRowQueryParams = {}
  ): ApiResponse<QueryResult> => {
    const mock = getOrCreateMockDb(connId)
    const table = mock.schema.tables.find((t) => t.name === tableName)
    let rows = [...(mock.rows[tableName] || [])]

    // Search filter
    if (params.search && params.search.trim()) {
      const term = params.search.toLowerCase()
      rows = rows.filter((r) =>
        Object.values(r).some((val) =>
          String(val ?? "")
            .toLowerCase()
            .includes(term)
        )
      )
    }

    // Sorting
    if (params.sort_by) {
      const field = params.sort_by
      const dir = params.sort_dir === "desc" ? -1 : 1
      rows.sort((a, b) => {
        const valA = a[field] ?? ""
        const valB = b[field] ?? ""
        if (valA < valB) return -1 * dir
        if (valA > valB) return 1 * dir
        return 0
      })
    }

    const page = params.page && params.page > 0 ? params.page : 1
    const limit = params.limit && params.limit > 0 ? params.limit : 25
    const totalRows = rows.length
    const totalPages = Math.max(1, Math.ceil(totalRows / limit))
    const pagedRows = rows.slice((page - 1) * limit, page * limit)

    return {
      success: true,
      data: {
        table_name: tableName,
        columns: table ? table.columns.map((c) => c.name) : [],
        rows: pagedRows,
        total_rows: totalRows,
        page,
        limit,
        total_pages: totalPages,
      },
      message: "Rows fetched (mock)",
    }
  },

  insertRow: (
    connId: string,
    tableName: string,
    rowData: Record<string, unknown>
  ): ApiResponse<Record<string, unknown>> => {
    const mock = getOrCreateMockDb(connId)
    if (!mock.rows[tableName]) mock.rows[tableName] = []

    const newRecord = { ...rowData }
    if (!newRecord.id && !newRecord._id) {
      newRecord.id = `mock-${Date.now()}`
    }
    mock.rows[tableName].unshift(newRecord)

    const table = mock.schema.tables.find((t) => t.name === tableName)
    if (table) table.row_count += 1

    return {
      success: true,
      data: newRecord,
      message: "Row inserted successfully (mock)",
    }
  },

  updateRow: (
    connId: string,
    tableName: string,
    rowData: Record<string, unknown>,
    primaryKeys: Record<string, unknown>
  ): ApiResponse<Record<string, unknown>> => {
    const mock = getOrCreateMockDb(connId)
    const rows = mock.rows[tableName] || []
    const idx = rows.findIndex((r) =>
      Object.entries(primaryKeys).every(([k, v]) => String(r[k]) === String(v))
    )

    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...rowData }
    }

    return {
      success: true,
      data: rows[idx] || rowData,
      message: "Row updated successfully (mock)",
    }
  },

  deleteRow: (
    connId: string,
    tableName: string,
    primaryKeys: Record<string, unknown>
  ): ApiResponse<null> => {
    const mock = getOrCreateMockDb(connId)
    if (mock.rows[tableName]) {
      mock.rows[tableName] = mock.rows[tableName].filter(
        (r) =>
          !Object.entries(primaryKeys).every(
            ([k, v]) => String(r[k]) === String(v)
          )
      )
      const table = mock.schema.tables.find((t) => t.name === tableName)
      if (table && table.row_count > 0) table.row_count -= 1
    }

    return {
      success: true,
      data: null,
      message: "Row deleted successfully (mock)",
    }
  },

  generateDiff: (
    sourceConnId: string,
    targetConnId: string
  ): ApiResponse<SchemaDiff> => {
    const sourceMock = getOrCreateMockDb(sourceConnId, "postgres", "source_db")
    const targetMock = getOrCreateMockDb(targetConnId, "mongodb", "target_db")

    const sourceTables = sourceMock.schema.tables
    const targetTables = targetMock.schema.tables.slice(0, 2)

    const sourceNames = sourceTables.map((t) => t.name)
    const targetNames = targetTables.map((t) => t.name)

    const tablesAdded = sourceNames.filter(
      (name) => !targetNames.includes(name)
    )
    const tablesRemoved = targetNames.filter(
      (name) => !sourceNames.includes(name)
    )
    const commonNames = sourceNames.filter((name) => targetNames.includes(name))

    const tablesAltered = commonNames.map((name) => {
      const src = sourceTables.find((t) => t.name === name)!
      const tgt = targetTables.find((t) => t.name === name)!

      const colDiffs = src.columns.map((c) => {
        const matchingTgt = tgt.columns.find((tc) => tc.name === c.name)
        if (!matchingTgt) {
          return {
            name: c.name,
            diff_type: "added" as const,
            source_column: c,
          }
        }
        if (matchingTgt.season_type !== c.season_type) {
          return {
            name: c.name,
            diff_type: "altered" as const,
            source_column: c,
            target_column: matchingTgt,
            alter_details: [
              `Type divergence: ${c.data_type} (${c.season_type}) ➔ ${matchingTgt.data_type} (${matchingTgt.season_type})`,
            ],
          }
        }
        return {
          name: c.name,
          diff_type: "altered" as const,
          source_column: c,
          target_column: matchingTgt,
        }
      })

      return {
        name,
        diff_type: "altered" as const,
        source_table: src,
        target_table: tgt,
        column_diffs: colDiffs,
        added_indexes: src.indexes?.map((i) => i.name) || [],
        removed_indexes: [],
      }
    })

    const diff: SchemaDiff = {
      source_connection_id: sourceConnId,
      target_connection_id: targetConnId,
      source_db_type: sourceMock.schema.db_type,
      target_db_type: targetMock.schema.db_type,
      tables_added: tablesAdded,
      tables_removed: tablesRemoved,
      tables_altered: tablesAltered,
      tables_same: commonNames.slice(1),
      generated_at: new Date().toISOString(),
    }

    return {
      success: true,
      data: diff,
      message: "Schema diff generated (mock)",
    }
  },
}
