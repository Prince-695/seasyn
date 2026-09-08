import {
  Database,
  Table as TableIcon,
  Layers,
  ArrowRightLeft,
  RefreshCw,
  Server,
  FolderKanban,
  PanelLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { StudioTab } from "@/hooks/useSchemaExplorer"
import type { getDatabaseTerminology } from "@/lib/constants/databaseViewers"
import type { Project, PublicDatabaseConnection } from "@/types"

interface SchemaStudioHeaderProps {
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
  projects: Project[]
  effectiveProjectId: string
  onSelectProject: (projectId: string) => void
  connections: PublicDatabaseConnection[]
  effectiveConnId: string
  onSelectConnection: (connId: string) => void
  activeTab: StudioTab
  onSelectTab: (tab: StudioTab) => void
  terminology: ReturnType<typeof getDatabaseTerminology>
  onRefresh: () => void
  isRefreshing: boolean
}

export function SchemaStudioHeader({
  isSidebarCollapsed,
  onToggleSidebar,
  projects,
  effectiveProjectId,
  onSelectProject,
  connections,
  effectiveConnId,
  onSelectConnection,
  activeTab,
  onSelectTab,
  terminology,
  onRefresh,
  isRefreshing,
}: SchemaStudioHeaderProps) {
  return (
    <header className="border-border/70 bg-card/80 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-6 py-3 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
            title={
              isSidebarCollapsed ? "Show Schema Tree" : "Collapse Schema Tree"
            }
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div className="border-primary/40 bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg border shadow-xs">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-foreground text-sm font-bold">
                Schema Studio
              </h1>
              <Badge className="border-success/20 bg-success/10 text-success text-[10px] font-semibold">
                Live
              </Badge>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Interactive Schema Visualizer & Live Data Grid
            </p>
          </div>
        </div>

        <div className="bg-border/60 hidden h-6 w-px sm:block" />

        {/* Project & Connection Selectors */}
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5">
              <FolderKanban className="text-muted-foreground h-3.5 w-3.5" />
              <select
                value={effectiveProjectId}
                onChange={(e) => onSelectProject(e.target.value)}
                className="border-input bg-background text-foreground h-8 rounded-lg border px-2 text-xs font-medium shadow-xs"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {connections.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Server className="text-muted-foreground h-3.5 w-3.5" />
              <select
                value={effectiveConnId}
                onChange={(e) => onSelectConnection(e.target.value)}
                className="border-input bg-background text-foreground h-8 rounded-lg border px-2 font-mono text-xs font-medium shadow-xs"
              >
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.db_type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Studio View Mode Switcher */}
      <div className="flex items-center gap-3">
        <div className="border-border/70 bg-muted/30 flex items-center gap-1 rounded-xl border p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab("structure")}
            className={cn(
              "relative flex h-auto cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              activeTab === "structure"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>
              {terminology.paradigm === "document"
                ? `${terminology.entitySingular} Schema`
                : "Structure"}
            </span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab("data")}
            className={cn(
              "relative flex h-auto cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              activeTab === "data"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>{`Live ${terminology.recordPlural}`}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab("diff")}
            className={cn(
              "relative flex h-auto cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              activeTab === "diff"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Schema Diff</span>
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 gap-1.5 text-xs"
          title="Refresh schema and rows"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
          />
        </Button>
      </div>
    </header>
  )
}

export default SchemaStudioHeader
