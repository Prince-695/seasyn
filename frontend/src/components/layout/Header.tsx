import { useLocation, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Menu,
  ChevronRight,
  User,
  LogOut,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
} from "lucide-react"

import { useUIStore } from "@/store/uiStore"
import { useAuthStore } from "@/store/authStore"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { useTheme } from "@/components/theme-provider"
import { authApi } from "@/api/auth"
import { checkSystemHealth } from "@/api/client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { RoleBadge } from "@/components/orgs/RoleBadge"

const routeTitles: Record<string, { section: string; title: string }> = {
  "/dashboard": { section: "Workspace", title: "Overview & Dashboard" },
  "/projects": { section: "Workspace", title: "Projects Studio" },
  "/connections": { section: "Workspace", title: "Database Connections" },
  "/org/members": { section: "Organization", title: "Team Members" },
  "/org/settings": { section: "Organization", title: "Workspace Settings" },
  "/migration": { section: "Studio", title: "Migration Studio" },
  "/editor": { section: "Studio", title: "Live Schema Editor" },
  "/docs": { section: "Resources", title: "Documentation" },
  "/profile": { section: "Account", title: "User Profile" },
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toggleMobileSidebar } = useUIStore()
  const { user, clearAuth } = useAuthStore()
  const { activeOrg, currentRole } = useWorkspaceStore()
  const { theme, setTheme } = useTheme()

  const currentRouteMeta = location.pathname.startsWith("/projects/")
    ? { section: "Projects", title: "Project Studio" }
    : (routeTitles[location.pathname] ?? {
        section: activeOrg?.name || "Workspace",
        title: "Overview",
      })

  // Real Backend Health Check (polls every 30s)
  const { data: isHealthy, isLoading: isCheckingHealth } = useQuery({
    queryKey: ["systemHealth"],
    queryFn: checkSystemHealth,
    refetchInterval: 30_000,
    staleTime: 15_000,
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
    <header className="border-border/70 bg-card/40 sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          aria-label="Toggle navigation menu"
          className="border-border/60 text-muted-foreground hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg border transition-colors md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-medium"
        >
          <span className="text-muted-foreground">
            {currentRouteMeta.section}
          </span>
          <ChevronRight className="text-muted-foreground/60 h-3.5 w-3.5" />
          <span className="text-foreground text-sm font-semibold tracking-tight sm:text-base">
            {currentRouteMeta.title}
          </span>
        </nav>
      </div>

      {/* Right: Organization Status & User Menu */}
      <div className="flex items-center gap-3">
        {/* Live Backend System Health Badge with Tooltip Message Box */}
        <TooltipProvider delay={100}>
          {isCheckingHealth ? (
            <div className="border-border/60 bg-muted/30 text-muted-foreground hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium lg:flex">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Checking API...</span>
            </div>
          ) : isHealthy ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className="border-success/20 bg-success/10 text-success hover:bg-success/15 hidden cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors lg:flex" />
                }
              >
                <CheckCircle2 className="h-3 w-3 animate-pulse" />
                <span>API Connected</span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={6}
                className="px-3 py-2 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="bg-success h-2 w-2 animate-pulse rounded-full" />
                  <span className="text-xs font-semibold">
                    System is operational
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className="border-warning/30 bg-warning/10 text-warning hover:bg-warning/15 hidden cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors lg:flex" />
                }
              >
                <AlertCircle className="h-3 w-3" />
                <span>Backend Offline</span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={6}
                className="px-3 py-2 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="bg-warning h-2 w-2 rounded-full" />
                  <span className="text-warning text-xs font-semibold">
                    Unable to reach backend service
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>

        {/* Active Org Chip (shown on larger screens) */}
        {activeOrg && (
          <div className="border-border/70 bg-muted/30 hidden items-center gap-2 rounded-lg border px-2.5 py-1 text-xs sm:flex">
            <Building2 className="text-primary h-3.5 w-3.5" />
            <span className="text-foreground max-w-30 truncate font-medium">
              {activeOrg.name}
            </span>
            {currentRole && (
              <RoleBadge role={currentRole} className="scale-90" />
            )}
          </div>
        )}

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
            <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center rounded-full text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1.5">
                <p className="text-foreground truncate text-xs font-semibold">
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
              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
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
