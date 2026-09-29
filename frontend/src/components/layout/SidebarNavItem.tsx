import { NavLink } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface NavItemConfig {
  label: string
  path: string
  icon: LucideIcon
  badge?: string
  isExternal?: boolean
  isDisabled?: boolean
}

interface SidebarNavItemProps {
  item: NavItemConfig
  active: boolean
  sidebarOpen: boolean
  onNavigate?: () => void
}

export function SidebarNavItem({
  item,
  active,
  sidebarOpen,
  onNavigate,
}: SidebarNavItemProps) {
  const Icon = item.icon

  if (item.isDisabled) {
    return (
      <div
        title={
          sidebarOpen
            ? "Select or create a workspace to access this section"
            : `${item.label} (Workspace required)`
        }
        aria-disabled="true"
        className={cn(
          "text-muted-foreground/40 relative flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium opacity-40 transition-all select-none",
          !sidebarOpen && "justify-center px-2"
        )}
      >
        <Icon className="text-muted-foreground/40 h-4 w-4 shrink-0" />
        {sidebarOpen && <span className="flex-1 truncate">{item.label}</span>}
      </div>
    )
  }

  if (item.isExternal) {
    return (
      <a
        href={item.path}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        title={!sidebarOpen ? item.label : undefined}
        className={cn(
          "group text-muted-foreground hover:bg-muted/50 hover:text-foreground relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all",
          !sidebarOpen && "justify-center px-2"
        )}
      >
        <Icon className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
        {sidebarOpen && <span className="flex-1 truncate">{item.label}</span>}
      </a>
    )
  }

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      title={!sidebarOpen ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all",
        active
          ? "bg-primary/10 text-primary font-medium shadow-xs"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        !sidebarOpen && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
          active ? "text-primary" : "text-muted-foreground"
        )}
      />
      {sidebarOpen && <span className="flex-1 truncate">{item.label}</span>}
      {sidebarOpen && item.badge && (
        <span className="border-success/20 bg-success/10 text-success rounded border px-1.5 py-0.5 text-[10px] font-medium">
          {item.badge}
        </span>
      )}
      {active && (
        <span
          className="bg-primary absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full"
          aria-hidden="true"
        />
      )}
    </NavLink>
  )
}
