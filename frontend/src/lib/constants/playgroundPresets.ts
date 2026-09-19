export type ConversionDirection = "sql-to-nosql" | "nosql-to-sql"

export type DataType =
  | "UUID"
  | "VARCHAR"
  | "INT"
  | "NUMERIC"
  | "BOOLEAN"
  | "TIMESTAMP"
  | "JSONB"
  | "ARRAY"

export interface SchemaField {
  id: string
  name: string
  type: DataType
  value: string
  isPrimary?: boolean
}

export interface PresetTemplate {
  id: string
  name: string
  iconType: "shopping-bag" | "user" | "activity"
  description: string
  tableName: string
  collectionName: string
  sqlFields: SchemaField[]
  nosqlJson: string
  nosqlFields: SchemaField[]
}

export interface ConversionResult {
  formattedPayload: string
  tableColumns?: Array<{ name: string; type: DataType; isPrimary?: boolean }>
  tableRow?: Record<string, string>
  stats: {
    throughput: string
    latency: string
    checksum: string
    recordsProcessed: number
    typeAccuracy: string
  }
}

export const SQL_DATA_TYPES: DataType[] = [
  "UUID",
  "VARCHAR",
  "INT",
  "NUMERIC",
  "BOOLEAN",
  "TIMESTAMP",
  "JSONB",
]

export const NOSQL_DATA_TYPES: DataType[] = [
  "UUID",
  "VARCHAR",
  "INT",
  "NUMERIC",
  "BOOLEAN",
  "TIMESTAMP",
  "JSONB",
  "ARRAY",
]

const field = (
  id: string,
  name: string,
  type: DataType,
  value: string,
  isPrimary = false
): SchemaField => ({ id, name, type, value, isPrimary })

export const PLAYGROUND_PRESETS: PresetTemplate[] = [
  {
    id: "ecommerce-orders",
    name: "E-Commerce Orders",
    iconType: "shopping-bag",
    description:
      "Relational order tables with foreign keys converted to nested line-item documents.",
    tableName: "orders",
    collectionName: "orders",
    sqlFields: [
      field(
        "f1",
        "order_id",
        "UUID",
        "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        true
      ),
      field(
        "f2",
        "customer_id",
        "UUID",
        "a98b3c1d-1234-4567-89ab-cdef01234567"
      ),
      field("f3", "total_amount", "NUMERIC", "249.50"),
      field(
        "f4",
        "item_metadata",
        "JSONB",
        '{"sku":"PRO-99","quantity":2,"unitPrice":124.75}'
      ),
      field("f5", "is_fulfilled", "BOOLEAN", "true"),
      field("f6", "created_at", "TIMESTAMP", "2026-09-15T10:30:00.000Z"),
    ],
    nosqlJson: JSON.stringify(
      {
        _id: "66e6b8f3a0c4c4781290a1b2",
        order_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        customer_id: "a98b3c1d-1234-4567-89ab-cdef01234567",
        total_amount: 249.5,
        items: [{ sku: "PRO-99", quantity: 2, price: 124.75 }],
        is_fulfilled: true,
        created_at: "2026-09-15T10:30:00.000Z",
      },
      null,
      2
    ),
    nosqlFields: [
      field(
        "nf1",
        "order_id",
        "UUID",
        "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        true
      ),
      field(
        "nf2",
        "customer_id",
        "UUID",
        "a98b3c1d-1234-4567-89ab-cdef01234567"
      ),
      field("nf3", "total_amount", "NUMERIC", "249.50"),
      field(
        "nf4",
        "items",
        "JSONB",
        '[{"sku":"PRO-99","quantity":2,"price":124.75}]'
      ),
      field("nf5", "is_fulfilled", "BOOLEAN", "true"),
      field("nf6", "created_at", "TIMESTAMP", "2026-09-15T10:30:00.000Z"),
    ],
  },
  {
    id: "user-accounts",
    name: "User & Auth Profiles",
    iconType: "user",
    description:
      "UUID credentials, security flags, and role arrays mapped to typed subtrees.",
    tableName: "users",
    collectionName: "users",
    sqlFields: [
      field(
        "f1",
        "user_id",
        "UUID",
        "7b13a8ef-92e1-432d-94c0-2f16d7a46821",
        true
      ),
      field("f2", "username", "VARCHAR", "alex_dev"),
      field("f3", "email", "VARCHAR", "alex.turner@company.io"),
      field("f4", "login_attempts", "INT", "0"),
      field(
        "f5",
        "security_settings",
        "JSONB",
        '{"mfaEnabled":true,"role":"admin"}'
      ),
      field("f6", "last_login_at", "TIMESTAMP", "2026-09-15T14:22:18.000Z"),
    ],
    nosqlJson: JSON.stringify(
      {
        _id: "7b13a8ef-92e1-432d-94c0-2f16d7a46821",
        user_id: "7b13a8ef-92e1-432d-94c0-2f16d7a46821",
        username: "alex_dev",
        email: "alex.turner@company.io",
        login_attempts: 0,
        security_settings: { mfaEnabled: true, role: "admin", sessionLimit: 5 },
        last_login_at: "2026-09-15T14:22:18.000Z",
      },
      null,
      2
    ),
    nosqlFields: [
      field(
        "nf1",
        "user_id",
        "UUID",
        "7b13a8ef-92e1-432d-94c0-2f16d7a46821",
        true
      ),
      field("nf2", "username", "VARCHAR", "alex_dev"),
      field("nf3", "email", "VARCHAR", "alex.turner@company.io"),
      field("nf4", "login_attempts", "INT", "0"),
      field(
        "nf5",
        "security_settings",
        "JSONB",
        '{"mfaEnabled":true,"role":"admin"}'
      ),
      field("nf6", "last_login_at", "TIMESTAMP", "2026-09-15T14:22:18.000Z"),
    ],
  },
  {
    id: "iot-telemetry",
    name: "IoT Sensor Events",
    iconType: "activity",
    description:
      "High-frequency relational metrics converted to flexible time-series MongoDB documents.",
    tableName: "sensor_telemetry",
    collectionName: "telemetry_events",
    sqlFields: [
      field("f1", "sensor_id", "VARCHAR", "EDGE-SENSOR-US-WEST-09", true),
      field("f2", "temperature_celsius", "NUMERIC", "42.85"),
      field("f3", "humidity_percent", "NUMERIC", "58.20"),
      field("f4", "voltage_level", "NUMERIC", "3.29"),
      field("f5", "alert_flags", "ARRAY", '["TEMP_WARNING", "FAN_HIGH"]'),
      field("f6", "recorded_at", "TIMESTAMP", "2026-09-15T18:45:00.000Z"),
    ],
    nosqlJson: JSON.stringify(
      {
        _id: "66e6c1a8d4e5f6001234abcd",
        sensor_id: "EDGE-SENSOR-US-WEST-09",
        temperature_celsius: 42.85,
        humidity_percent: 58.2,
        voltage_level: 3.29,
        alert_flags: ["TEMP_WARNING", "FAN_HIGH"],
        recorded_at: "2026-09-15T18:45:00.000Z",
      },
      null,
      2
    ),
    nosqlFields: [
      field("nf1", "sensor_id", "VARCHAR", "EDGE-SENSOR-US-WEST-09", true),
      field("nf2", "temperature_celsius", "NUMERIC", "42.85"),
      field("nf3", "humidity_percent", "NUMERIC", "58.20"),
      field("nf4", "voltage_level", "NUMERIC", "3.29"),
      field("nf5", "alert_flags", "ARRAY", '["TEMP_WARNING", "FAN_HIGH"]'),
      field("nf6", "recorded_at", "TIMESTAMP", "2026-09-15T18:45:00.000Z"),
    ],
  },
]

function formatValueByType(val: string, type: DataType): unknown {
  switch (type) {
    case "INT": {
      const p = parseInt(val, 10)
      return isNaN(p) ? 0 : p
    }
    case "NUMERIC": {
      const p = parseFloat(val)
      return isNaN(p) ? 0.0 : p
    }
    case "BOOLEAN":
      return val.toLowerCase() === "true" || val === "1"
    case "JSONB":
    case "ARRAY":
      try {
        return JSON.parse(val)
      } catch {
        return val
      }
    default:
      return val
  }
}

export function convertSqlToNoSql(
  _collectionName: string,
  fields: SchemaField[]
): ConversionResult {
  const doc: Record<string, unknown> = {
    _id: 'ObjectId("66e6b8f3a0c4c4781290a1b2")',
  }

  fields.forEach((f) => {
    const formatted = formatValueByType(f.value, f.type)
    if (f.type === "UUID") doc[f.name] = `UUID("${f.value}")`
    else if (f.type === "TIMESTAMP") doc[f.name] = `ISODate("${f.value}")`
    else if (f.type === "NUMERIC") doc[f.name] = `NumberDecimal("${f.value}")`
    else doc[f.name] = formatted
  })

  const rawJson = JSON.stringify(doc, null, 2)
  const cleanPayload = rawJson.replace(
    /"(ObjectId\([^)]+\)|UUID\([^)]+\)|ISODate\([^)]+\)|NumberDecimal\([^)]+\))"/g,
    "$1"
  )

  return {
    formattedPayload: cleanPayload,
    stats: {
      throughput: "134,820 rec/s",
      latency: "0.24 ms",
      checksum: "SHA-256: e3b0c44298fc1c149afbf4c8996fb924",
      recordsProcessed: 1,
      typeAccuracy: "100%",
    },
  }
}

export function convertNoSqlToSql(
  tableName: string,
  fields: SchemaField[]
): ConversionResult {
  const columnNames = fields.map((f) => f.name).join(", ")
  const valuesFormatted = fields
    .map((f) => {
      if (f.type === "INT" || f.type === "NUMERIC" || f.type === "BOOLEAN") {
        return f.value
      }
      if (f.type === "JSONB") return `'${f.value.replace(/'/g, "''")}'::jsonb`
      return `'${f.value.replace(/'/g, "''")}'`
    })
    .join(", ")

  const tableColumns = fields.map((f) => ({
    name: f.name,
    type: f.type,
    isPrimary: f.isPrimary,
  }))

  const tableRow: Record<string, string> = {}
  fields.forEach((f) => {
    tableRow[f.name] = f.value
  })

  const insertStatement = `-- PostgreSQL Target Record Insert\nINSERT INTO ${tableName || "records"} (\n  ${columnNames}\n)\nVALUES (\n  ${valuesFormatted}\n);`

  return {
    formattedPayload: insertStatement,
    tableColumns,
    tableRow,
    stats: {
      throughput: "128,450 rec/s",
      latency: "0.19 ms",
      checksum: "SHA-256: 8f434346648f6b96df89dda901c5176b",
      recordsProcessed: 1,
      typeAccuracy: "100%",
    },
  }
}
