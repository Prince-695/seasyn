import { Link, NavLink, useNavigate, useLocation } from "react-router-dom"
import {
  FolderKanban,
  Server,
  ArrowRightLeft,
  Database,
  Users,
  Settings,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  User,
  ArrowLeft,
} from "lucide-react"
import { useUIStore } from "@/store/uiStore"
import { useAuthStore } from "@/store/authStore"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { authApi } from "@/api/auth"
import { RoleBadge } from "@/components/orgs/RoleBadge"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { SidebarNavItem, type NavItemConfig } from "./SidebarNavItem"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarOpen, toggleSidebar, setMobileSidebarOpen } = useUIStore()
  const { user, clearAuth } = useAuthStore()
  const {
    activeOrg,
    currentRole,
    activeProjectId,
    activeProjectSlug,
    activeProjectName,
    activeProjectEnv,
    clearActiveProject,
  } = useWorkspaceStore()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore offline logout error
    } finally {
      clearAuth()
      navigate("/sign-in", { replace: true })
    }
  }

  // Determine if we are in Project Context or Organization Context
  const isProjectRoute = location.pathname.startsWith("/projects/")
  const isToolRoute =
    location.pathname.startsWith("/migration") ||
    location.pathname.startsWith("/editor") ||
    location.pathname.startsWith("/schema-diff") ||
    location.pathname.startsWith("/connections")

  const isProjectContext = isProjectRoute || (isToolRoute && !!activeProjectId)
  const projectSlug =
    (location.pathname.startsWith("/projects/")
      ? location.pathname.split("/")[2]
      : null) ||
    activeProjectSlug ||
    activeProjectId ||
    ""

  // 1. Organization Level Navigation
  const orgNavItems: (NavItemConfig & {
    aliases?: string[]
    exact?: boolean
    requiresOrg?: boolean
  })[] = [
    {
      label: "Projects",
      path: "/dashboard",
      icon: FolderKanban,
      aliases: ["/dashboard", "/projects"],
      exact: true,
      requiresOrg: false,
    },
    {
      label: "People",
      path: "/org/members",
      icon: Users,
      requiresOrg: true,
    },
    {
      label: "Settings",
      path: "/org/settings",
      icon: Settings,
      requiresOrg: true,
    },
    {
      label: "Documentation",
      path: "/docs",
      icon: BookOpen,
      requiresOrg: false,
      isExternal: true,
    },
  ]

  // 2. Project Level Navigation
  const projectNavItems: (NavItemConfig & {
    basePath?: string
    exact?: boolean
  })[] = [
    {
      label: "Databases & Overview",
      path: `/projects/${projectSlug}`,
      basePath: `/projects/${projectSlug}`,
      icon: Server,
      exact: true,
    },
    {
      label: "Migration Studio",
      path: `/migration?project=${projectSlug}`,
      basePath: "/migration",
      icon: ArrowRightLeft,
      badge: "Live",
    },
    {
      label: "Live Schema Editor",
      path: `/editor?project=${projectSlug}`,
      basePath: "/editor",
      icon: Database,
      badge: "Live",
    },
    {
      label: "Project Settings",
      path: `/projects/${projectSlug}/settings`,
      basePath: `/projects/${projectSlug}/settings`,
      icon: Settings,
    },
  ]

  const projectOrgItems: (NavItemConfig & { requiresOrg?: boolean })[] = [
    {
      label: "Workspace Settings",
      path: "/org/settings",
      icon: Settings,
      requiresOrg: true,
    },
    {
      label: "Documentation",
      path: "/docs",
      icon: BookOpen,
      requiresOrg: false,
      isExternal: true,
    },
  ]

  const isItemActive = (item: {
    path: string
    basePath?: string
    exact?: boolean
    aliases?: string[]
  }) => {
    if (item.aliases?.includes(location.pathname)) return true
    if (item.exact) return location.pathname === item.path
    if (item.basePath) return location.pathname.startsWith(item.basePath)
    return (
      location.pathname === item.path ||
      location.pathname.startsWith(`${item.path}/`)
    )
  }

  return (
    <aside
      className={cn(
        "border-border/70 bg-card/60 relative z-30 flex flex-col border-r backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none",
        sidebarOpen ? "w-64" : "w-18"
      )}
    >
      {/* Top Brand Header */}
      <div
        className={cn(
          "border-border/60 flex h-16 items-center border-b",
          sidebarOpen ? "justify-between px-4" : "justify-center px-2"
        )}
      >
        {sidebarOpen ? (
          <>
            <Link
              to="/dashboard"
              onClick={() => clearActiveProject()}
              className="flex items-center gap-3 overflow-hidden transition-opacity hover:opacity-90"
            >
              <Logo size={28} />
              <div className="flex flex-col">
                <span className="font-heading text-foreground text-base font-semibold">
                  SEASYN
                </span>
                <span className="text-muted-foreground text-[10px] font-medium uppercase">
                  Data Studio
                </span>
              </div>
            </Link>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="text-muted-foreground hover:bg-muted/60 hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="text-muted-foreground hover:bg-muted/60 hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Switcher Row: Project Return vs Clean Workspace (Only in Project Context) */}
      {isProjectContext && (
        <div className="border-border/50 border-b p-3">
          {sidebarOpen ? (
            <div className="space-y-2">
              <Link
                to="/dashboard"
                onClick={() => {
                  clearActiveProject()
                  setMobileSidebarOpen(false)
                }}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All Projects</span>
              </Link>

              {/* Active Project Identification Card */}
              <div className="border-border/70 bg-background/80 flex items-center gap-2.5 rounded-xl border p-2 px-2.5 shadow-2xs">
                <div className="border-primary/30 bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border">
                  <FolderKanban className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-foreground truncate text-xs leading-tight font-semibold"
                    title={activeProjectName || projectSlug}
                  >
                    {activeProjectName || projectSlug || "Project"}
                  </p>
                  <span className="text-muted-foreground font-mono text-[10px] uppercase">
                    {activeProjectEnv || "Studio"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Link
                to="/dashboard"
                onClick={() => clearActiveProject()}
                title="Back to All Projects"
                className="border-border/70 bg-background/60 text-muted-foreground hover:text-foreground hover:bg-muted flex h-10 w-10 items-center justify-center rounded-lg border shadow-xs transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Navigation Links Canvas */}
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {isProjectContext ? (
          <>
            {/* Project Scoped Tools */}
            <div className="space-y-1">
              {sidebarOpen && (
                <h3 className="text-muted-foreground/70 px-3 text-[11px] font-semibold uppercase">
                  Project Studio
                </h3>
              )}
              <nav className="space-y-1 pt-1">
                {projectNavItems.map((item) => (
                  <SidebarNavItem
                    key={item.label}
                    item={item}
                    active={isItemActive(item)}
                    sidebarOpen={sidebarOpen}
                    onNavigate={() => setMobileSidebarOpen(false)}
                  />
                ))}
              </nav>
            </div>

            {/* Compact Organization Links */}
            <div className="border-border/50 space-y-1 border-t pt-3">
              {sidebarOpen && (
                <h3 className="text-muted-foreground/60 px-3 text-[10px] font-semibold uppercase">
                  Organization
                </h3>
              )}
              <nav className="space-y-1 pt-0.5">
                {projectOrgItems.map((item) => (
                  <SidebarNavItem
                    key={item.label}
                    item={{
                      ...item,
                      isDisabled: !!item.requiresOrg && !activeOrg,
                    }}
                    active={isItemActive(item)}
                    sidebarOpen={sidebarOpen}
                    onNavigate={() => setMobileSidebarOpen(false)}
                  />
                ))}
              </nav>
            </div>
          </>
        ) : (
          /* Mode 2: Clean Organization Navigation */
          <div className="space-y-1">
            {sidebarOpen && (
              <h3 className="text-muted-foreground/70 px-3 text-[11px] font-semibold uppercase">
                Organization
              </h3>
            )}
            <nav className="space-y-1 pt-1">
              {orgNavItems.map((item) => (
                <SidebarNavItem
                  key={item.path}
                  item={{
                    ...item,
                    isDisabled: !!item.requiresOrg && !activeOrg,
                  }}
                  active={isItemActive(item)}
                  sidebarOpen={sidebarOpen}
                  onNavigate={() => {
                    if (item.path === "/dashboard") {
                      clearActiveProject()
                    }
                    setMobileSidebarOpen(false)
                  }}
                />
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Bottom User Card & Toggle */}
      <div className="border-border/60 bg-muted/20 border-t p-3">
        {sidebarOpen ? (
          <div className="border-border/60 bg-background/50 flex items-center justify-between gap-2 rounded-xl border p-2.5 shadow-xs">
            <NavLink
              to="/profile"
              className="hover:bg-muted/60 flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 transition-colors"
              title="Account Settings"
            >
              <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                {user?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
              </div>
              <div className="flex min-w-0 flex-col text-left">
                <span className="text-foreground truncate text-xs font-semibold">
                  {user?.username
                    ? `@${user.username}`
                    : user?.first_name
                      ? `${user.first_name} ${user.last_name || ""}`
                      : user?.email}
                </span>
                <span className="text-muted-foreground truncate font-mono text-[10px]">
                  {user?.email}
                </span>
              </div>
            </NavLink>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              title="Sign Out"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <NavLink
              to="/profile"
              className="hover:bg-muted/60 flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              title="Account Settings"
            >
              <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                {user?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
              </div>
            </NavLink>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              title="Sign Out"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}

        {sidebarOpen && currentRole && (
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="text-muted-foreground text-[11px] font-medium">
              Access Tier
            </span>
            <RoleBadge role={currentRole} />
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
