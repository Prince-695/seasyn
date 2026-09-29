import { useLocation, useNavigate } from "react-router-dom"
import { Menu, ChevronRight, User, LogOut, Sun, Moon } from "lucide-react"

import { useUIStore } from "@/store/uiStore"
import { useAuthStore } from "@/store/authStore"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { useTheme } from "@/components/theme-provider"
import { authApi } from "@/api/auth"
import { OrgSwitcher } from "./OrgSwitcher"

import { Button } from "@/components/ui/button"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { cn } from "@/lib/utils"

const routeTitles: Record<string, { section: string; title: string }> = {
  "/dashboard": { section: "Organization", title: "Projects" },
  "/projects": { section: "Organization", title: "Projects" },
  "/connections": { section: "Workspace", title: "Database Connections" },
  "/org/members": { section: "Organization", title: "People" },
  "/org/settings": { section: "Organization", title: "Settings" },
  "/migration": { section: "Studio", title: "Migration Studio" },
  "/migration/new": { section: "Studio", title: "New Migration" },
  "/editor": { section: "Studio", title: "Live Schema Editor" },
  "/schema-diff": { section: "Studio", title: "Schema Diff" },
  "/docs": { section: "Resources", title: "Documentation" },
  "/profile": { section: "Account", title: "User Profile" },
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toggleMobileSidebar } = useUIStore()
  const { user, clearAuth } = useAuthStore()
  const { activeOrg, activeProjectName, activeProjectSlug } =
    useWorkspaceStore()
  const { theme, setTheme } = useTheme()

  const isProjectRoute = location.pathname.startsWith("/projects/")
  const isProjectSettings = location.pathname.endsWith("/settings")
  const isToolRoute =
    location.pathname.startsWith("/migration") ||
    location.pathname.startsWith("/editor") ||
    location.pathname.startsWith("/schema-diff") ||
    location.pathname.startsWith("/connections")

  const currentRouteMeta = isProjectSettings
    ? { section: "Project Studio", title: "Settings" }
    : isProjectRoute
      ? { section: "Project Studio", title: activeProjectName || "Overview" }
      : (routeTitles[location.pathname] ?? {
          section: activeOrg?.name || "Organization",
          title: "Overview",
        })

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore offline error
    } finally {
      clearAuth()
      navigate("/sign-in", { replace: true })
    }
  }

  return (
    <header className="border-border bg-card/60 sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile trigger, Org Switcher & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleMobileSidebar}
          aria-label="Toggle navigation menu"
          className="text-muted-foreground hover:bg-muted flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors md:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Organization Switcher at start of header */}
        <div className="w-44 sm:w-52">
          <OrgSwitcher />
        </div>

        {/* Multi-tiered Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-medium"
        >
          {/* Project Segment (if in project context) */}
          {(isProjectRoute || (isToolRoute && activeProjectName)) && (
            <>
              <ChevronRight className="text-muted-foreground/60 h-3.5 w-3.5" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/projects/${activeProjectSlug || ""}`)}
                className={cn(
                  "h-auto p-0 transition-colors hover:bg-transparent",
                  isProjectRoute && !isProjectSettings
                    ? "text-foreground hover:text-foreground text-sm font-medium sm:text-base"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {activeProjectName || "Project"}
              </Button>
            </>
          )}

          {/* Subpage Segment (if tool, project settings, or org subpage) */}
          {((!isProjectRoute && location.pathname !== "/dashboard") ||
            isToolRoute ||
            isProjectSettings) && (
            <>
              <ChevronRight className="text-muted-foreground/60 h-3.5 w-3.5" />
              <span className="text-foreground text-sm font-medium sm:text-base">
                {currentRouteMeta.title}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right: Organization Status & User Menu */}
      <div className="flex items-center gap-3">
        {/* User Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="ring-border/80 hover:ring-primary/40 h-9 w-9 rounded-full p-0 ring-1 transition-all"
                aria-label="User account menu"
              />
            }
          >
            <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center rounded-full text-xs font-medium">
              {user?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1.5">
                <p className="text-foreground truncate text-xs font-medium">
                  {user?.first_name
                    ? `${user.first_name} ${user.last_name || ""}`
                    : user?.name || "Account"}
                </p>
                <p className="text-muted-foreground truncate font-mono text-[10px]">
                  {user?.email}
                </p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              onClick={() => navigate("/profile")}
              className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs"
            >
              <span>Account Settings</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate("/org/members")}
              className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs"
            >
              <span>Team Members</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate("/org/settings")}
              className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs"
            >
              <span>Organization Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-xs"
            >
              <div className="flex items-center gap-2">
                {theme === "dark" ? (
                  <Moon className="text-primary h-3.5 w-3.5" />
                ) : (
                  <Sun className="text-warning h-3.5 w-3.5" />
                )}
                <span>Theme</span>
              </div>
              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium uppercase">
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Header
