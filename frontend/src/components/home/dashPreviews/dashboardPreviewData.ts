import {
  FolderKanban,
  Server,
  ArrowRightLeft,
  Database,
  Users,
} from "lucide-react"
import type { EnvFilter } from "@/lib/constants/environments"
import type {
  OrgQuotasSummary,
  EngineDistributionItem,
  DailyVelocityPoint,
} from "@/types/analytics"
import type { DBType } from "@/types"
import type { OrgRole } from "@/types/org"

// ── Preview-only config (formerly constants.ts) ────────────────────────────

export const ORG_NAME = "Acme Cloud"
export const PREVIEW_USER = {
  email: "alex@acme.dev",
  plan: "Pro Plan",
  initial: "A",
} as const

/** Flip to true to show the analytics cards on the Projects tab. */
export const SHOW_ANALYTICS = false

/** Base surface shared by tables, tiles, toolbars and cards. */
export const CARD = "border-border/70 bg-card rounded-xl border shadow-xs"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MockProject {
  id: string
  name: string
  slug: string
  environment: "production" | "staging" | "development"
  createdAt: string
  databases: string
  status: "Ready" | "Syncing"
}

export interface MockConnection {
  id: string
  name: string
  db_type: DBType
  role: "source" | "target"
  host: string
  database: string
  pingMs: number
  status: "connected" | "idle"
  tablesCount: number
}

export interface MockMigration {
  id: string
  name: string
  source_table: string
  target_table: string
  source_engine: DBType
  target_engine: DBType
  status: "running" | "completed" | "pending"
  migrated_rows: number
  total_rows: number
  percentage: number
  current_rps: number
  started_at: string
}

export interface MockSchemaColumn {
  name: string
  type: string
  nullable: boolean
  is_pk: boolean
  default_val: string
  target_type: string
}

export interface MockMember {
  id: string
  name: string
  username: string
  email: string
  role: OrgRole
  initials: string
  joinedAt: string
}

// ── Constants & Mock Collections ──────────────────────────────────────────────

export const PREVIEW_PROJECTS: MockProject[] = [
  {
    id: "p1",
    name: "core-commerce-stream",
    slug: "/core-commerce",
    environment: "production",
    createdAt: "Yesterday",
    databases: "3 (1 in, 2 out)",
    status: "Syncing",
  },
  {
    id: "p2",
    name: "analytics-warehouse-replica",
    slug: "/analytics-replica",
    environment: "production",
    createdAt: "3 days ago",
    databases: "2 (1 in, 1 out)",
    status: "Ready",
  },
  {
    id: "p3",
    name: "billing-staging-audit",
    slug: "/billing-staging",
    environment: "staging",
    createdAt: "1 week ago",
    databases: "2 (1 in, 1 out)",
    status: "Ready",
  },
  {
    id: "p4",
    name: "auth-identity-sandbox",
    slug: "/auth-sandbox",
    environment: "development",
    createdAt: "2 weeks ago",
    databases: "1 (1 in, 0 out)",
    status: "Ready",
  },
]

export const PREVIEW_CONNECTIONS: MockConnection[] = [
  {
    id: "c1",
    name: "prod-postgres-primary",
    db_type: "postgres",
    role: "source",
    host: "pg.acme-infra.internal:5432",
    database: "production_db",
    pingMs: 1.2,
    status: "connected",
    tablesCount: 28,
  },
  {
    id: "c2",
    name: "analytics-mongo-cluster",
    db_type: "mongodb",
    role: "target",
    host: "mongo.cluster.acme.net:27017",
    database: "analytics_warehouse",
    pingMs: 2.4,
    status: "connected",
    tablesCount: 14,
  },
  {
    id: "c3",
    name: "legacy-mysql-replica",
    db_type: "mysql",
    role: "source",
    host: "mysql.acme-data.internal:3306",
    database: "legacy_orders",
    pingMs: 3.1,
    status: "connected",
    tablesCount: 19,
  },
  {
    id: "c4",
    name: "audit-sqlite-staging",
    db_type: "sqlite",
    role: "target",
    host: "/var/data/staging-audit.db",
    database: "audit_ledger.db",
    pingMs: 0.8,
    status: "connected",
    tablesCount: 6,
  },
]

export const PREVIEW_MIGRATIONS: MockMigration[] = [
  {
    id: "job-101",
    name: "prod-users-sync",
    source_table: "public.users",
    target_table: "customers_collection",
    source_engine: "postgres",
    target_engine: "mongodb",
    status: "running",
    migrated_rows: 145000,
    total_rows: 500000,
    percentage: 29.0,
    current_rps: 2840,
    started_at: "12m ago",
  },
  {
    id: "job-102",
    name: "analytics-warehouse-stream",
    source_table: "public.events",
    target_table: "events_warehouse",
    source_engine: "mysql",
    target_engine: "postgres",
    status: "completed",
    migrated_rows: 1250000,
    total_rows: 1250000,
    percentage: 100,
    current_rps: 0,
    started_at: "2h ago",
  },
  {
    id: "job-103",
    name: "orders-cdc-replica",
    source_table: "public.orders",
    target_table: "orders_v2",
    source_engine: "postgres",
    target_engine: "postgres",
    status: "completed",
    migrated_rows: 480200,
    total_rows: 480200,
    percentage: 100,
    current_rps: 0,
    started_at: "1d ago",
  },
  {
    id: "job-104",
    name: "billing-staging-audit",
    source_table: "finance.ledger",
    target_table: "audit_entries",
    source_engine: "postgres",
    target_engine: "sqlite",
    status: "completed",
    migrated_rows: 76500,
    total_rows: 76500,
    percentage: 100,
    current_rps: 0,
    started_at: "3d ago",
  },
]

export const PREVIEW_SCHEMA_COLUMNS: MockSchemaColumn[] = [
  {
    name: "id",
    type: "uuid",
    nullable: false,
    is_pk: true,
    default_val: "gen_random_uuid()",
    target_type: "ObjectId (_id)",
  },
  {
    name: "email",
    type: "varchar(255)",
    nullable: false,
    is_pk: false,
    default_val: "None",
    target_type: "String (email)",
  },
  {
    name: "full_name",
    type: "varchar(100)",
    nullable: true,
    is_pk: false,
    default_val: "NULL",
    target_type: "String (name)",
  },
  {
    name: "role",
    type: "varchar(32)",
    nullable: false,
    is_pk: false,
    default_val: "'member'",
    target_type: "String (role)",
  },
  {
    name: "metadata",
    type: "jsonb",
    nullable: true,
    is_pk: false,
    default_val: "'{}'::jsonb",
    target_type: "Document (metadata)",
  },
  {
    name: "created_at",
    type: "timestamptz",
    nullable: false,
    is_pk: false,
    default_val: "CURRENT_TIMESTAMP",
    target_type: "Date (createdAt)",
  },
]

export const PREVIEW_MEMBERS: MockMember[] = [
  {
    id: "u1",
    name: "Alex Mercer",
    username: "alexm",
    email: "alex@acme.dev",
    role: "owner",
    initials: "AM",
    joinedAt: "Jan 12, 2026",
  },
  {
    id: "u2",
    name: "Sarah Chen",
    username: "sarahc",
    email: "sarah.c@acme.dev",
    role: "admin",
    initials: "SC",
    joinedAt: "Feb 03, 2026",
  },
  {
    id: "u3",
    name: "Marcus Vance",
    username: "marcusv",
    email: "m.vance@acme.dev",
    role: "member",
    initials: "MV",
    joinedAt: "Mar 14, 2026",
  },
]

export const SIDEBAR_NAV = [
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "connections", label: "Connections", icon: Server },
  { id: "migration", label: "Migration", icon: ArrowRightLeft },
  { id: "editor", label: "Schema Editor", icon: Database },
  { id: "people", label: "People", icon: Users },
] as const

export const ENV_TABS: Array<{
  id: EnvFilter
  label: string
  count: number
  textClass?: string
}> = [
  { id: "all", label: "All", count: 4 },
  { id: "development", label: "Dev", count: 1, textClass: "text-info" },
  { id: "staging", label: "Staging", count: 1, textClass: "text-warning" },
  { id: "production", label: "Prod", count: 2, textClass: "text-success" },
]

export const TABLE_HEADERS = [
  { label: "Name", align: "left" },
  { label: "Environment", align: "left" },
  { label: "Created at", align: "left" },
  { label: "Databases", align: "left" },
  { label: "Status", align: "left" },
  { label: "Actions", align: "right" },
] as const

export const MOCK_ANALYTICS: {
  successRate: number
  completedMigrations: number
  connectionsCount: number
  quotas: OrgQuotasSummary
  engineDistribution: EngineDistributionItem[]
  velocityTimeline: DailyVelocityPoint[]
} = {
  successRate: 98.4,
  completedMigrations: 6,
  connectionsCount: 8,
  quotas: {
    projects: { used: 4, max: 10, percentage: 40 },
    members: { used: 3, max: 5, percentage: 60 },
    user_orgs: { used: 1, max: 3, percentage: 33 },
  },
  engineDistribution: [
    { db_type: "postgres", count: 4, percentage: 50 },
    { db_type: "mongodb", count: 2, percentage: 25 },
    { db_type: "mysql", count: 1, percentage: 12.5 },
    { db_type: "sqlite", count: 1, percentage: 12.5 },
  ],
  velocityTimeline: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toISOString(),
    rows_migrated: 20000 + i * 6000 + (i % 3 === 0 ? 15000 : 0),
    jobs_count: 2 + (i % 3),
  })),
}

export const ENGINE_FILTERS: ReadonlyArray<{
  value: "all" | DBType
  label: string
}> = [
  { value: "all", label: "All" },
  { value: "postgres", label: "Postgres" },
  { value: "mysql", label: "MySQL" },
  { value: "mongodb", label: "MongoDB" },
  { value: "sqlite", label: "SQLite" },
]

export const PREVIEW_SCHEMA_TABLE = {
  connection: "prod-postgres-primary",
  table: "public.users",
} as const

/** Single source for every "total" number shown in the preview. */
export const MOCK_METRICS = {
  runningPipelines: PREVIEW_MIGRATIONS.filter((j) => j.status === "running")
    .length,
  totalPipelines: PREVIEW_MIGRATIONS.length,
  totalRowsSynced: 1_428_950,
  totalDatabases: 8,
}

export type NavId = (typeof SIDEBAR_NAV)[number]["id"]
