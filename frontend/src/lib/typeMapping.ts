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
    colorClass: "text-blue-500",
    bgColorClass: "bg-blue-500/10",
  },

  mysql: {
    displayName: "MySQL",
    colorClass: "text-orange-500",
    bgColorClass: "bg-orange-500/10",
  },
  mongodb: {
    displayName: "MongoDB",
    colorClass: "text-green-500",
    bgColorClass: "bg-green-500/10",
  },
  sqlite: {
    displayName: "SQLite",
    colorClass: "text-sky-500",
    bgColorClass: "bg-sky-500/10",
  },
}

export const getDBTypeMeta = (type: DBType | string): DBTypeMeta => {
  const normalizedType = type.toLowerCase() as DBType
  return (
    dbTypeMapping[normalizedType] || {
      displayName: type,
      colorClass: "text-gray-500",
      bgColorClass: "bg-gray-500/10",
    }
  )
}
