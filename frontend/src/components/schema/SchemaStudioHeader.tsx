import {
  Database,
  Table as TableIcon,
  Layers,
  ArrowRightLeft,
  RefreshCw,
  FolderKanban,
  PanelLeft,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { StudioTab } from "@/hooks/useSchemaExplorer"
import type { getDatabaseTerminology } from "@/lib/constants/databaseViewers"
import type { Project, PublicDatabaseConnection } from "@/types"

interface SchemaStudioHeaderProps {
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
  projects?: Project[]
  effectiveProjectId?: string
  currentProject?: Project | null
  onSelectProject?: (projectId: string) => void
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
  currentProject,
  connections,
  effectiveConnId,
  onSelectConnection,
  activeTab,
  onSelectTab,
  terminology,
  onRefresh,
  isRefreshing,
}: SchemaStudioHeaderProps) {
  const displayProject =
    currentProject || projects?.find((p) => p.id === effectiveProjectId) || null

  const selectedConn =
    connections.find((c) => c.id === effectiveConnId) || connections[0]

  return (
    <header className="border-border/70 bg-card/80 flex shrink-0 items-center justify-between gap-2.5 border-b px-4 py-2 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        {/* Toggle Schema Tree */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0 p-0"
          title={
            isSidebarCollapsed ? "Show Schema Tree" : "Collapse Schema Tree"
          }
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        {/* Studio Branding */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="border-primary/40 bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-xs">
            <Database className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-foreground text-xs font-semibold whitespace-nowrap sm:text-sm">
              Schema Studio
            </h1>
            <Badge className="border-success/20 bg-success/10 text-success text-[10px] font-semibold">
              Live
            </Badge>
          </div>
        </div>

        <div className="bg-border/60 hidden h-5 w-px shrink-0 md:block" />

        {/* Dedicated Project Pill & Connection Selector */}
        <div className="flex min-w-0 items-center gap-2">
          {displayProject && (
            <div className="border-border/70 bg-muted/40 text-foreground flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium shadow-2xs">
              <FolderKanban className="text-primary h-3.5 w-3.5 shrink-0" />
              <span className="max-w-25 truncate font-semibold sm:max-w-32.5">
                {displayProject.name}
              </span>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary px-1.5 py-0 text-[10px] font-medium capitalize"
              >
                {displayProject.environment}
              </Badge>
            </div>
          )}

          {connections.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/70 bg-background/80 hover:bg-muted/50 hover:text-foreground focus-visible:ring-primary h-8 shrink-0 gap-1.5 rounded-lg px-2 text-xs font-medium shadow-xs focus-visible:ring-1"
                  />
                }
              >
                <Database className="text-primary h-3.5 w-3.5 shrink-0" />
                <span className="max-w-27.5 truncate text-left font-medium sm:max-w-37.5">
                  {selectedConn?.name || "Select Database"}
                </span>
                <ChevronsUpDown className="text-muted-foreground/60 h-3 w-3 shrink-0" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="border-border/70 bg-popover min-w-50 p-1 shadow-md"
              >
                <DropdownMenuLabel className="text-muted-foreground px-2 py-1 text-[10px] font-semibold uppercase">
                  Databases
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {connections.map((c) => {
                  const isSelected = c.id === effectiveConnId
                  return (
                    <DropdownMenuItem
                      key={c.id}
                      onClick={() => onSelectConnection(c.id)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        isSelected && "bg-muted text-foreground font-semibold"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Database
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            isSelected
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                        <span className="truncate">{c.name}</span>
                      </div>
                      {isSelected && (
                        <Check className="text-primary h-3.5 w-3.5 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="text-muted-foreground shrink-0 text-xs italic">
              No databases in this project
            </span>
          )}
        </div>
      </div>

      {/* Studio View Mode Switcher */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="border-border/70 bg-muted/30 flex shrink-0 items-center gap-0.5 rounded-lg border p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab("structure")}
            className={cn(
              "relative flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors",
              activeTab === "structure"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">
              {terminology.paradigm === "document"
                ? "Collection Schema"
                : "Structure"}
            </span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab("data")}
            className={cn(
              "relative flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors",
              activeTab === "data"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TableIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">{`Live ${terminology.recordPlural}`}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab("diff")}
            className={cn(
              "relative flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors",
              activeTab === "diff"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">Schema Diff</span>
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 w-8 shrink-0 p-0"
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
