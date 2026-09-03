/**
 * typeMapping.ts
 *
 * Maps backend database types to frontend representations.
 * Exposes helpers for retrieving the Display Name, and Brand Color (theme-compatible Tailwind classes).
 */

import type { DBType, DBTypeMeta } from "@/types"

export const dbTypeMapping: Record<DBType, DBTypeMeta> = {
  postgres: {
    displayName: "PostgreSQL",
    colorClass: "text-info",
    bgColorClass: "bg-info/10",
  },

  mysql: {
    displayName: "MySQL",
    colorClass: "text-warning",
    bgColorClass: "bg-warning/10",
  },
  mongodb: {
    displayName: "MongoDB",
    colorClass: "text-success",
    bgColorClass: "bg-success/10",
  },
  sqlite: {
    displayName: "SQLite",
    colorClass: "text-primary",
    bgColorClass: "bg-primary/10",
  },
}

export const getDBTypeMeta = (type: DBType | string): DBTypeMeta => {
  const normalizedType = type.toLowerCase() as DBType
  return (
    dbTypeMapping[normalizedType] || {
      displayName: type,
      colorClass: "text-muted-foreground",
      bgColorClass: "bg-muted",
    }
  )
}
