import type { DBType } from "@/types"

export type DatabaseParadigm = "relational" | "document" | "key_value" | "graph"

export interface DatabaseTerminology {
  paradigm: DatabaseParadigm
  entitySingular: string
  entityPlural: string
  recordSingular: string
  recordPlural: string
  fieldSingular: string
  fieldPlural: string
  defaultViewMode: "table" | "documents" | "raw"
}

export const DATABASE_TERMINOLOGY: Record<DBType, DatabaseTerminology> = {
  postgres: {
    paradigm: "relational",
    entitySingular: "Table",
    entityPlural: "Tables",
    recordSingular: "Row",
    recordPlural: "Rows",
    fieldSingular: "Column",
    fieldPlural: "Columns",
    defaultViewMode: "table",
  },
  mysql: {
    paradigm: "relational",
    entitySingular: "Table",
    entityPlural: "Tables",
    recordSingular: "Row",
    recordPlural: "Rows",
    fieldSingular: "Column",
    fieldPlural: "Columns",
    defaultViewMode: "table",
  },
  sqlite: {
    paradigm: "relational",
    entitySingular: "Table",
    entityPlural: "Tables",
    recordSingular: "Row",
    recordPlural: "Rows",
    fieldSingular: "Column",
    fieldPlural: "Columns",
    defaultViewMode: "table",
  },
  mongodb: {
    paradigm: "document",
    entitySingular: "Collection",
    entityPlural: "Collections",
    recordSingular: "Document",
    recordPlural: "Documents",
    fieldSingular: "Field",
    fieldPlural: "Fields",
    defaultViewMode: "documents",
  },
}

export function getDatabaseTerminology(dbType?: string): DatabaseTerminology {
  if (dbType && dbType in DATABASE_TERMINOLOGY) {
    return DATABASE_TERMINOLOGY[dbType as DBType]
  }
  return DATABASE_TERMINOLOGY.postgres
}
