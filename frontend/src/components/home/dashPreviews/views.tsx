/* eslint-disable react-refresh/only-export-components */
import { useState, type ComponentType } from "react"
import { Activity, FolderKanban, HardDrive, UserPlus, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardMetricStrip } from "@/components/dashboard/DashboardMetricStrip"
import { DashboardAnalyticsCards } from "@/components/dashboard/DashboardAnalyticsCards"
import { EngineIcon } from "@/components/connections/EngineIcon"
import { MigrationStatusBadge } from "@/components/migrations/MigrationStatusBadge"
import { RoleBadge } from "@/components/orgs/RoleBadge"
import {
  ENVIRONMENT_CONFIG,
  type EnvFilter,
} from "@/lib/constants/environments"
import type { DBType } from "@/types"
import { cn } from "@/lib/utils"
import {
  CARD,
  ENGINE_FILTERS,
  ENV_TABS,
  MOCK_ANALYTICS,
  MOCK_METRICS,
  ORG_NAME,
  PREVIEW_CONNECTIONS,
  PREVIEW_MEMBERS,
  PREVIEW_MIGRATIONS,
  PREVIEW_PROJECTS,
  PREVIEW_SCHEMA_COLUMNS,
  PREVIEW_SCHEMA_TABLE,
  SHOW_ANALYTICS,
  type MockConnection,
  type MockMember,
  type MockMigration,
  type MockProject,
  type MockSchemaColumn,
  type NavId,
} from "./dashboardPreviewData"
import {
  DataTable,
  EmptyState,
  EntityCell,
  HeaderButton,
  MetricTile,
  OpenStudioButton,
  PageHeader,
  PillBadge,
  ProgressBar,
  SearchInput,
  SegmentedControl,
  StatusDot,
  Toolbar,
  type Column,
  type SegmentOption,
} from "./primitives"
import { useFilteredList } from "@/hooks/useFilteredList"

const MONO = "text-muted-foreground font-mono text-[12px]"

// ── Projects ──────────────────────────────────────────────────────────────

const PROJECT_COLUMNS: Column<MockProject>[] = [
  {
    header: "Name",
    cell: (p) => (
      <EntityCell
        icon={<FolderKanban className="h-4 w-4" />}
        title={p.name}
        subtitle={p.slug}
      />
    ),
  },
  {
    header: "Environment",
    cell: (p) => {
      const env = ENVIRONMENT_CONFIG[p.environment]
      return (
        <Badge
          variant="outline"
          className={cn("px-2 py-0 text-[10px]", env.className)}
        >
          {env.label}
        </Badge>
      )
    },
  },
  {
    header: "Created at",
    className: "text-muted-foreground",
    cell: (p) => p.createdAt,
  },
  {
    header: "Databases",
    className: "text-foreground",
    cell: (p) => p.databases,
  },
  {
    header: "Status",
    cell: (p) => (
      <span className="text-success inline-flex items-center gap-1.5 font-medium">
        <StatusDot />
        {p.status}
      </span>
    ),
  },
  { header: "Actions", align: "right", cell: () => <OpenStudioButton /> },
]

// Counts are derived from the data, so they can't drift.
const ENV_OPTIONS: SegmentOption<EnvFilter>[] = ENV_TABS.map(
  ({ id, label, textClass }) => {
    const n =
      id === "all"
        ? PREVIEW_PROJECTS.length
        : PREVIEW_PROJECTS.filter((p) => p.environment === id).length
    return { value: id, label: `${label} (${n})`, activeClassName: textClass }
  }
)

function ProjectsView() {
  const { query, setQuery, category, setCategory, filtered } = useFilteredList<
    MockProject,
    EnvFilter
  >(PREVIEW_PROJECTS, ["name", "slug"], "environment")

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${ORG_NAME}'s projects`}
        desc="Manage database projects, environments, and synchronization pipelines."
        actions={<HeaderButton label="New project" />}
      />
      <DashboardMetricStrip
        {...MOCK_METRICS}
        totalProjects={PREVIEW_PROJECTS.length}
        orgName={ORG_NAME}
      />
      {SHOW_ANALYTICS && (
        <DashboardAnalyticsCards orgName={ORG_NAME} {...MOCK_ANALYTICS} />
      )}

      <div className="space-y-3">
        <Toolbar>
          <SegmentedControl
            options={ENV_OPTIONS}
            value={category}
            onChange={setCategory}
          />
          <SearchInput
            placeholder="Search projects..."
            value={query}
            onChange={setQuery}
            className="sm:w-52"
          />
        </Toolbar>
        <DataTable
          columns={PROJECT_COLUMNS}
          rows={filtered}
          getRowKey={(p) => p.id}
          emptyText="No matching projects found."
        />
      </div>
    </div>
  )
}

// ── Connections ───────────────────────────────────────────────────────────

const ROLE_STYLES: Record<MockConnection["role"], string> = {
  source: "border-primary/30 text-primary bg-primary/5",
  target: "border-secondary/30 text-secondary bg-secondary/5",
}

function ConnectionCard({ conn }: { conn: MockConnection }) {
  return (
    <div
      className={cn(
        CARD,
        "hover:border-primary/50 group flex flex-col justify-between p-3.5 transition-all"
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2.5">
          <EntityCell
            icon={<EngineIcon type={conn.db_type} className="h-4.5 w-4.5" />}
            iconClassName="h-9 w-9"
            title={conn.name}
            subtitle={<span className="capitalize">{conn.db_type}</span>}
          />
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 font-mono text-[10px] uppercase",
              ROLE_STYLES[conn.role]
            )}
          >
            {conn.role}
          </Badge>
        </div>
        <div className="border-border/50 bg-muted/20 rounded-lg border p-2 font-mono text-[11px]">
          <span className="text-muted-foreground block truncate">
            {conn.host}
          </span>
          <div className="text-foreground mt-1 flex justify-between">
            <span>db: {conn.database}</span>
            <span className="text-muted-foreground text-[10px]">
              {conn.tablesCount} tables
            </span>
          </div>
        </div>
      </div>
      <div className="border-border/60 mt-3 flex items-center justify-between border-t pt-2.5">
        <span className="text-success flex items-center gap-1.5 font-mono text-[11px] font-medium">
          <StatusDot />
          {conn.pingMs}ms
        </span>
        <OpenStudioButton className="h-6" />
      </div>
    </div>
  )
}

function ConnectionsView() {
  const { query, setQuery, category, setCategory, filtered } = useFilteredList<
    MockConnection,
    DBType
  >(PREVIEW_CONNECTIONS, ["name", "host", "database"], "db_type")

  return (
    <div className="space-y-4">
      <PageHeader
        title="Database Connections"
        badge={<PillBadge>{PREVIEW_CONNECTIONS.length} Total</PillBadge>}
        desc="Catalog and live diagnostics of all source and destination database adapters."
        actions={
          <>
            <HeaderButton variant="outline" label="Add Source DB" />
            <HeaderButton label="Add Target DB" />
          </>
        }
      />
      <Toolbar card>
        <SearchInput
          placeholder="Search connections by name, host, database..."
          value={query}
          onChange={setQuery}
          className="flex-1"
        />
        <SegmentedControl
          options={ENGINE_FILTERS}
          value={category}
          onChange={setCategory}
        />
      </Toolbar>
      {filtered.length === 0 ? (
        <EmptyState>No matching connections found.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <ConnectionCard key={c.id} conn={c} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Migrations ────────────────────────────────────────────────────────────

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 2,
})

const TILES = [
  {
    label: "Total Pipelines",
    value: String(MOCK_METRICS.totalPipelines),
    sub: "All time",
  },
  {
    label: "Active Streaming",
    value: String(MOCK_METRICS.runningPipelines),
    sub: "14.2k events/s",
  },
  {
    label: "Total Rows Synced",
    value: compact.format(MOCK_METRICS.totalRowsSynced),
    sub: "Zero checksum errors",
  },
  { label: "Avg Throughput", value: "2,840/s", sub: "Sub-second CDC" },
]

const MIGRATION_COLUMNS: Column<MockMigration>[] = [
  {
    header: "Pipeline",
    className: "text-foreground font-medium",
    cell: (j) => j.name,
  },
  {
    header: "Source ➔ Target",
    cell: (j) => (
      <span className="font-mono text-[11px]">
        <span className="text-foreground">{j.source_table}</span>
        <span className="text-muted-foreground"> ➔ </span>
        <span className="text-primary">{j.target_table}</span>
      </span>
    ),
  },
  { header: "Status", cell: (j) => <MigrationStatusBadge status={j.status} /> },
  {
    header: "Progress",
    cell: (j) => (
      <div className="w-28 space-y-1">
        <div className="text-muted-foreground flex justify-between font-mono text-[10px]">
          <span>{j.percentage}%</span>
          <span>{j.migrated_rows.toLocaleString()}</span>
        </div>
        <ProgressBar
          percentage={j.percentage}
          running={j.status === "running"}
        />
      </div>
    ),
  },
  {
    header: "Speed",
    className: MONO,
    cell: (j) =>
      j.current_rps > 0 ? `${j.current_rps.toLocaleString()} rps` : "Complete",
  },
  {
    header: "Started",
    align: "right",
    className: MONO,
    cell: (j) => j.started_at,
  },
]

function ActiveMigrationBanner({ job }: { job: MockMigration }) {
  return (
    <div className="border-info/40 bg-info/10 flex flex-col gap-2.5 rounded-xl border p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="bg-info absolute h-full w-full animate-ping rounded-full opacity-75" />
          <span className="bg-info relative h-2.5 w-2.5 rounded-full" />
        </span>
        <div>
          <p className="text-foreground text-xs font-medium">
            Active Live Migration in Progress
          </p>
          <p className="text-info font-mono text-[11px]">
            {job.source_table} ➔ {job.target_table} (
            {job.migrated_rows.toLocaleString()} /{" "}
            {job.total_rows.toLocaleString()} rows synced • {job.percentage}%)
          </p>
        </div>
      </div>
      <Button
        size="xs"
        className="bg-info text-info-foreground hover:bg-info/90 h-7 gap-1.5 text-xs font-medium shadow-xs"
      >
        <Activity className="h-3.5 w-3.5 animate-spin" />
        Live Telemetry
      </Button>
    </div>
  )
}

function MigrationsView() {
  const activeJob = PREVIEW_MIGRATIONS.find((j) => j.status === "running")

  return (
    <div className="space-y-4">
      <PageHeader
        title="Migration Studio"
        badge={
          <PillBadge tone="primary" className="font-sans">
            <Zap className="h-3 w-3" />
            Real-Time CDC
          </PillBadge>
        }
        desc="Orchestrate zero-downtime, cross-database data streaming with real-time SSE telemetry."
        actions={<HeaderButton label="New Migration" />}
      />
      {activeJob && <ActiveMigrationBanner job={activeJob} />}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {TILES.map((t) => (
          <MetricTile key={t.label} {...t} />
        ))}
      </div>
      <DataTable
        columns={MIGRATION_COLUMNS}
        rows={PREVIEW_MIGRATIONS}
        getRowKey={(j) => j.id}
        toolbar={
          <>
            <span className="text-foreground text-xs font-medium">
              Pipeline History &amp; Telemetry
            </span>
            <span className="text-muted-foreground font-mono text-[10px]">
              Auto-refresh active (SSE)
            </span>
          </>
        }
      />
    </div>
  )
}
// ── Schema editor ─────────────────────────────────────────────────────────

type SchemaTab = "structure" | "data" | "diff"

// Only "structure" has content in this preview; the others just move the highlight.
const SCHEMA_TABS: SegmentOption<SchemaTab>[] = [
  { value: "structure", label: "Structure" },
  { value: "data", label: "Data Preview" },
  { value: "diff", label: "Schema Diff" },
]

const CHIP =
  "border-border/80 bg-background flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"

const SCHEMA_TABLE_COLUMNS: Column<MockSchemaColumn>[] = [
  {
    header: "Field / Column",
    cell: (c) => (
      <span className="flex items-center gap-2">
        <span className="text-foreground font-mono font-medium">{c.name}</span>
        {c.is_pk && (
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary px-1.5 py-0 font-mono text-[9px]"
          >
            PK
          </Badge>
        )}
      </span>
    ),
  },
  {
    header: "Source Type",
    className: "text-muted-foreground font-mono",
    cell: (c) => c.type,
  },
  {
    header: "Nullable",
    cell: (c) => (
      <span
        className={cn(
          "font-mono text-[11px]",
          c.nullable ? "text-muted-foreground" : "text-foreground font-medium"
        )}
      >
        {c.nullable ? "YES" : "NO"}
      </span>
    ),
  },
  { header: "Key / Default", className: MONO, cell: (c) => c.default_val },
  {
    header: "Target Representation (BSON)",
    cell: (c) => (
      <span className="border-border/60 bg-muted/30 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px]">
        <span className="text-success">➔</span>
        <span className="text-foreground">{c.target_type}</span>
      </span>
    ),
  },
]

function SchemaView() {
  const [tab, setTab] = useState<SchemaTab>("structure")

  return (
    <div className="space-y-4">
      <PageHeader
        title="Schema Studio"
        badge={<PillBadge tone="primary">PostgreSQL ➔ MongoDB</PillBadge>}
        desc="Declarative table structures, cross-engine field mappings, and schema diffs."
        actions={<HeaderButton label="New Mapping" />}
      />
      <Toolbar card>
        <div className="flex flex-wrap items-center gap-2">
          <span className={CHIP}>
            <EngineIcon type="postgres" className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">
              {PREVIEW_SCHEMA_TABLE.connection}
            </span>
          </span>
          <span className="text-muted-foreground">/</span>
          <span className={CHIP}>
            <HardDrive className="text-primary h-3.5 w-3.5" />
            <span className="text-foreground font-mono font-medium">
              {PREVIEW_SCHEMA_TABLE.table}
            </span>
            <span className="text-muted-foreground text-[10px]">
              ({PREVIEW_SCHEMA_COLUMNS.length} fields)
            </span>
          </span>
        </div>
        <SegmentedControl options={SCHEMA_TABS} value={tab} onChange={setTab} />
      </Toolbar>
      <DataTable
        columns={SCHEMA_TABLE_COLUMNS}
        rows={PREVIEW_SCHEMA_COLUMNS}
        getRowKey={(c) => c.name}
      />
    </div>
  )
}
// ── Members ───────────────────────────────────────────────────────────────

const MEMBER_COLUMNS: Column<MockMember>[] = [
  {
    header: "Member",
    cell: (m) => (
      <EntityCell
        icon={m.initials}
        iconClassName="h-8 w-8 rounded-full border-transparent text-xs font-medium"
        title={m.name}
        subtitle={`@${m.username}`}
      />
    ),
  },
  { header: "Email", className: MONO, cell: (m) => m.email },
  { header: "Role", cell: (m) => <RoleBadge role={m.role} /> },
  {
    header: "Joined Date",
    align: "right",
    className: MONO,
    cell: (m) => m.joinedAt,
  },
]

function MembersView() {
  const { query, setQuery, filtered } = useFilteredList(PREVIEW_MEMBERS, [
    "name",
    "email",
    "username",
  ])

  return (
    <div className="space-y-4">
      <PageHeader
        title="People"
        badge={<PillBadge>{PREVIEW_MEMBERS.length} members</PillBadge>}
        desc={`All team members and collaborators in ${ORG_NAME}. Manage access roles and invitations.`}
        actions={<HeaderButton icon={UserPlus} label="Invite Member" />}
      />
      <SearchInput
        placeholder="Search by name, email, or handle..."
        value={query}
        onChange={setQuery}
        className="max-w-sm"
      />
      <DataTable
        columns={MEMBER_COLUMNS}
        rows={filtered}
        getRowKey={(m) => m.id}
      />
    </div>
  )
}

// Record<NavId, …> = TypeScript errors if you add a nav item without a view.
export const VIEWS: Record<NavId, ComponentType> = {
  projects: ProjectsView,
  connections: ConnectionsView,
  migration: MigrationsView,
  editor: SchemaView,
  people: MembersView,
}
