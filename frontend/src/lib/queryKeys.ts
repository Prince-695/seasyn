/**
 * queryKeys.ts
 *
 * Factory functions to ensure query keys are strongly typed and consistent
 * throughout the application for reliable caching and invalidation.
 */

import type { TableRowQueryParams } from "@/types/schema"

export const projectKeys = {
  all: ["projects"] as const,
  byOrg: (orgId: string) => [...projectKeys.all, "org", orgId] as const,
  lists: (orgId: string) => [...projectKeys.byOrg(orgId), "list"] as const,
  list: (orgId: string) => [...projectKeys.byOrg(orgId), "list"] as const,
  detail: (orgId: string, projectId: string) =>
    [...projectKeys.byOrg(orgId), "detail", projectId] as const,
}

export const connectionKeys = {
  all: ["connections"] as const,
  byProject: (orgId: string, projectId: string) =>
    [...connectionKeys.all, "org", orgId, "project", projectId] as const,
  list: (orgId: string, projectId: string) =>
    [...connectionKeys.byProject(orgId, projectId), "list"] as const,
  detail: (orgId: string, projectId: string, connId: string) =>
    [...connectionKeys.byProject(orgId, projectId), "detail", connId] as const,
}

export const migrationKeys = {
  all: ["migrations"] as const,
  byProject: (orgId: string, projectId: string) =>
    [...migrationKeys.all, "org", orgId, "project", projectId] as const,
  list: (orgId: string, projectId: string) =>
    [...migrationKeys.byProject(orgId, projectId), "list"] as const,
  lists: (orgId: string, projectId: string) =>
    [...migrationKeys.byProject(orgId, projectId), "list"] as const,
  detail: (orgId: string, projectId: string, migrationId: string) =>
    [
      ...migrationKeys.byProject(orgId, projectId),
      "detail",
      migrationId,
    ] as const,
}

export const schemaKeys = {
  all: ["schema"] as const,
  byConn: (orgId: string, projectId: string, connId: string) =>
    [
      ...schemaKeys.all,
      "org",
      orgId,
      "project",
      projectId,
      "connection",
      connId,
    ] as const,
  database: (orgId: string, projectId: string, connId: string) =>
    [...schemaKeys.byConn(orgId, projectId, connId), "full"] as const,
  tables: (orgId: string, projectId: string, connId: string) =>
    [...schemaKeys.byConn(orgId, projectId, connId), "tables"] as const,
  table: (
    orgId: string,
    projectId: string,
    connId: string,
    tableName: string
  ) =>
    [
      ...schemaKeys.byConn(orgId, projectId, connId),
      "table",
      tableName,
    ] as const,
  rows: (
    orgId: string,
    projectId: string,
    connId: string,
    tableName: string,
    params?: TableRowQueryParams | Record<string, unknown>
  ) =>
    [
      ...schemaKeys.byConn(orgId, projectId, connId),
      "rows",
      tableName,
      params ?? {},
    ] as const,
  diff: (
    orgId: string,
    projectId: string,
    sourceId: string,
    targetId: string
  ) =>
    [...schemaKeys.all, "diff", orgId, projectId, sourceId, targetId] as const,
}

export const orgKeys = {
  all: ["organizations"] as const,
  lists: () => [...orgKeys.all, "list"] as const,
  detail: (id: string) => [...orgKeys.all, "detail", id] as const,
  members: (orgId: string) => [...orgKeys.all, "members", orgId] as const,
}
