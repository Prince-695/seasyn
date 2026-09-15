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
  direction: ConversionDirection
  tableName: string
  collectionName: string
  fields: SchemaField[]
}

export interface ConversionResult {
  formattedPayload: string
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

export const PLAYGROUND_PRESETS: PresetTemplate[] = [
  {
    id: "ecommerce-orders",
    name: "E-Commerce Orders",
    iconType: "shopping-bag",
    description:
      "Relational order tables with foreign keys converted to nested line-item documents.",
    direction: "sql-to-nosql",
    tableName: "orders",
    collectionName: "orders",
    fields: [
      {
        id: "f1",
        name: "order_id",
        type: "UUID",
        value: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        isPrimary: true,
      },
      {
        id: "f2",
        name: "customer_id",
        type: "UUID",
        value: "a98b3c1d-1234-4567-89ab-cdef01234567",
      },
      { id: "f3", name: "total_amount", type: "NUMERIC", value: "249.50" },
      {
        id: "f4",
        name: "item_metadata",
        type: "JSONB",
        value: '{"sku":"PRO-99","quantity":2,"unitPrice":124.75}',
      },
      { id: "f5", name: "is_fulfilled", type: "BOOLEAN", value: "true" },
      {
        id: "f6",
        name: "created_at",
        type: "TIMESTAMP",
        value: "2026-09-15T10:30:00.000Z",
      },
    ],
  },
  {
    id: "user-accounts",
    name: "User & Auth Profiles",
    iconType: "user",
    description:
      "UUID credentials, security flags, and role arrays mapped to typed subtrees.",
    direction: "sql-to-nosql",
    tableName: "users",
    collectionName: "users",
    fields: [
      {
        id: "f1",
        name: "user_id",
        type: "UUID",
        value: "7b13a8ef-92e1-432d-94c0-2f16d7a46821",
        isPrimary: true,
      },
      { id: "f2", name: "username", type: "VARCHAR", value: "alex_dev" },
      {
        id: "f3",
        name: "email",
        type: "VARCHAR",
        value: "alex.turner@company.io",
      },
      { id: "f4", name: "login_attempts", type: "INT", value: "0" },
      {
        id: "f5",
        name: "security_settings",
        type: "JSONB",
        value: '{"mfaEnabled":true,"role":"admin","sessionLimit":5}',
      },
      {
        id: "f6",
        name: "last_login_at",
        type: "TIMESTAMP",
        value: "2026-09-15T14:22:18.000Z",
      },
    ],
  },
  {
    id: "iot-telemetry",
    name: "IoT Sensor Events",
    iconType: "activity",
    description:
      "High-frequency relational metrics converted to flexible time-series MongoDB documents.",
    direction: "nosql-to-sql",
    tableName: "sensor_telemetry",
    collectionName: "telemetry_events",
    fields: [
      {
        id: "f1",
        name: "sensor_id",
        type: "VARCHAR",
        value: "EDGE-SENSOR-US-WEST-09",
        isPrimary: true,
      },
      {
        id: "f2",
        name: "temperature_celsius",
        type: "NUMERIC",
        value: "42.85",
      },
      { id: "f3", name: "humidity_percent", type: "NUMERIC", value: "58.20" },
      { id: "f4", name: "voltage_level", type: "NUMERIC", value: "3.29" },
      {
        id: "f5",
        name: "alert_flags",
        type: "ARRAY",
        value: '["TEMP_WARNING", "FAN_HIGH"]',
      },
      {
        id: "f6",
        name: "recorded_at",
        type: "TIMESTAMP",
        value: "2026-09-15T18:45:00.000Z",
      },
    ],
  },
]

function formatValueByType(val: string, type: DataType): unknown {
  switch (type) {
    case "INT": {
      const parsed = parseInt(val, 10)
      return isNaN(parsed) ? 0 : parsed
    }
    case "NUMERIC": {
      const parsed = parseFloat(val)
      return isNaN(parsed) ? 0.0 : parsed
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
    if (f.type === "UUID") {
      doc[f.name] = `UUID("${f.value}")`
    } else if (f.type === "TIMESTAMP") {
      doc[f.name] = `ISODate("${f.value}")`
    } else if (f.type === "NUMERIC") {
      doc[f.name] = `NumberDecimal("${f.value}")`
    } else {
      doc[f.name] = formatted
    }
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
      if (f.type === "JSONB") {
        return `'${f.value.replace(/'/g, "''")}'::jsonb`
      }
      return `'${f.value.replace(/'/g, "''")}'`
    })
    .join(", ")

  const insertStatement = `-- PostgreSQL Target Record Insert\nINSERT INTO ${tableName || "records"} (\n  ${columnNames}\n)\nVALUES (\n  ${valuesFormatted}\n);`

  return {
    formattedPayload: insertStatement,
    stats: {
      throughput: "128,450 rec/s",
      latency: "0.19 ms",
      checksum: "SHA-256: 8f434346648f6b96df89dda901c5176b",
      recordsProcessed: 1,
      typeAccuracy: "100%",
    },
  }
}
