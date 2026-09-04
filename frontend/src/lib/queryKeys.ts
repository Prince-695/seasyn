/**
 * queryKeys.ts
 *
 * Factory functions to ensure query keys are strongly typed and consistent
 * throughout the application for reliable caching and invalidation.
 */

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: string) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
}

export const migrationKeys = {
  all: ["migrations"] as const,
  lists: (projectId: string) =>
    [...migrationKeys.all, "list", projectId] as const,
  detail: (migrationId: string) =>
    [...migrationKeys.all, "detail", migrationId] as const,
}

export const schemaKeys = {
  all: ["schema"] as const,
  tables: (projectId: string) =>
    [...schemaKeys.all, "tables", projectId] as const,
  tableData: (projectId: string, tableName: string) =>
    [...schemaKeys.all, "tableData", projectId, tableName] as const,
}

export const orgKeys = {
  all: ["organizations"] as const,
  lists: () => [...orgKeys.all, "list"] as const,
  detail: (id: string) => [...orgKeys.all, "detail", id] as const,
  members: (orgId: string) => [...orgKeys.all, "members", orgId] as const,
}
