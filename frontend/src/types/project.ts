import type { DBType } from "./index"

export type Environment = "development" | "staging" | "production"

export interface Project {
  id: string
  organization_id: string
  name: string
  slug: string
  description?: string
  environment: Environment
  created_by: string
  created_at: string
  updated_at: string
}

export type SSLMode =
  | "disable"
  | "require"
  | "verify-ca"
  | "verify-full"
  | "prefer"

export interface PublicDatabaseConnection {
  id: string
  project_id: string
  name: string
  db_type: DBType
  host?: string
  port?: number
  database?: string
  username?: string
  ssl_mode?: SSLMode
  file_path?: string // For SQLite
  is_source: boolean
  created_at: string
  updated_at: string
}

export interface ProjectDetail extends Project {
  connections?: PublicDatabaseConnection[]
}

export interface CreateProjectPayload {
  name: string
  slug?: string
  description?: string
  environment?: Environment
}

export interface UpdateProjectPayload {
  name: string
  description?: string
  environment?: Environment
}

export interface CreateConnectionPayload {
  name: string
  db_type: DBType
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  ssl_mode?: SSLMode
  file_path?: string
  uri?: string
  is_source: boolean
}

export interface UpdateConnectionPayload {
  name: string
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  ssl_mode?: SSLMode
  file_path?: string
  uri?: string
  is_source?: boolean
}

export interface TestConnectionPayload {
  db_type: DBType
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  ssl_mode?: SSLMode
  file_path?: string
  uri?: string
}

export interface ConnectionTestResult {
  success: boolean
  latency_ms: number
  server_info?: string
  error_message?: string
}
