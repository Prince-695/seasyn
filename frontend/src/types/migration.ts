import type { DBType } from "./index"

export type MigrationStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"

export interface MigrationJob {
  id: string
  organization_id: string
  project_id: string
  source_connection_id: string
  target_connection_id: string
  source_table: string
  target_table: string
  status: MigrationStatus
  total_rows: number
  migrated_rows: number
  batch_size: number
  error_message?: string
  percentage: number
  created_by?: string
  source_db_type?: DBType
  target_db_type?: DBType
  source_connection_name?: string
  target_connection_name?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface MigrationProgress {
  job_id: string
  state: MigrationStatus
  migrated_rows: number
  total_rows: number
  percentage: number
  message?: string
  timestamp: string
}

export interface StartMigrationPayload {
  source_connection_id: string
  target_connection_id: string
  source_table: string
  target_table: string
  batch_size?: number
}
