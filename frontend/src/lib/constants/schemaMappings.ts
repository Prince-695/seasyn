export interface SchemaTypeMapping {
  source: string
  target: string
  fromType: string
  toType: string
  fromSource?: string
  toTarget?: string
  note: string
}

export const CANONICAL_SCHEMA_MAPPINGS: SchemaTypeMapping[] = [
  {
    source: "UUID",
    target: "ObjectId",
    fromSource: "SQL",
    fromType: "user_id: UUID",
    toTarget: "BSON",
    toType: "_id: ObjectId",
    note: "Auto-coerced",
  },
  {
    source: "JSONB",
    target: "Doc",
    fromSource: "SQL",
    fromType: "config: JSONB",
    toTarget: "BSON",
    toType: "config: Doc",
    note: "Preserved",
  },
  {
    source: "TIMESTAMPTZ",
    target: "ISODate",
    fromSource: "SQL",
    fromType: "ts: TIMESTAMPTZ",
    toTarget: "BSON",
    toType: "ts: ISODate",
    note: "Normalized",
  },
  {
    source: "VARCHAR(255)",
    target: "String",
    fromSource: "SQL",
    fromType: "name: VARCHAR(255)",
    toTarget: "BSON",
    toType: "name: String",
    note: "Mapped",
  },
  {
    source: "BOOLEAN",
    target: "Boolean",
    fromSource: "SQL",
    fromType: "is_active: BOOLEAN",
    toTarget: "BSON",
    toType: "is_active: Boolean",
    note: "Preserved",
  },
]
