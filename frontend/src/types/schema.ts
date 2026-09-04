export type SeasonType =
  | "int"
  | "string"
  | "bool"
  | "timestamp"
  | "json"
  | "float"
  | "decimal"
  | "binary"
  | "uuid"
  | "enum"
  | "array"
  | "unknown"

export interface ColumnSchema {
  name: string
  data_type: string
  season_type: SeasonType
  is_nullable: boolean
  default_value?: string
  max_length?: number
  is_primary_key: boolean
  is_foreign_key: boolean
  foreign_table?: string
  foreign_column?: string
  comment?: string
}

export interface IndexSchema {
  name: string
  columns: string[]
  is_unique: boolean
  is_primary: boolean
  type?: string
}

export interface ConstraintSchema {
  name: string
  type: string // "PRIMARY KEY" | "FOREIGN KEY" | "UNIQUE" | "CHECK"
  columns: string[]
  foreign_table?: string
  foreign_columns?: string[]
  definition?: string
}

export interface TableSchema {
  name: string
  schema?: string
  columns: ColumnSchema[]
  primary_keys: string[]
  constraints?: ConstraintSchema[]
  indexes?: IndexSchema[]
  row_count: number
  size_bytes?: number
  comment?: string
}

export interface DatabaseSchema {
  db_type: string
  database_name: string
  tables: TableSchema[]
  inspected_at: string
}

export interface QueryResult {
  table_name: string
  columns: string[]
  rows: Record<string, unknown>[]
  total_rows: number
  page: number
  limit: number
  total_pages: number
}

export interface ColumnDiff {
  name: string
  diff_type: "added" | "removed" | "altered"
  source_column?: ColumnSchema
  target_column?: ColumnSchema
  alter_details?: string[]
}

export interface TableDiff {
  name: string
  diff_type: "added" | "removed" | "altered" | "identical"
  source_table?: TableSchema
  target_table?: TableSchema
  column_diffs?: ColumnDiff[]
  added_indexes?: string[]
  removed_indexes?: string[]
}

export interface SchemaDiff {
  source_connection_id: string
  target_connection_id: string
  source_db_type: string
  target_db_type: string
  tables_added: string[]
  tables_removed: string[]
  tables_altered: TableDiff[]
  tables_same: string[]
  generated_at: string
}

export interface TableRowQueryParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_dir?: "asc" | "desc"
  search?: string
}
