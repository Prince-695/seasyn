import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
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
  ShieldCheck,
} from "lucide-react"
import { useUIStore } from "@/store/uiStore"
import { useAuthStore } from "@/store/authStore"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { authApi } from "@/api/auth"
import { OrgSwitcher } from "./OrgSwitcher"
import { RoleBadge } from "@/components/orgs/RoleBadge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setMobileSidebarOpen } = useUIStore()
  const { user, clearAuth } = useAuthStore()
  const { currentRole } = useWorkspaceStore()
  const navigate = useNavigate()

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

  const navGroups = [
    {
      title: "Workspace",
      items: [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
          badge: null,
        },
        {
          label: "Projects",
          path: "/projects",
          icon: FolderKanban,
          badge: null,
        },
        {
          label: "Connections",
          path: "/connections",
          icon: Server,
          badge: null,
        },

        {
          label: "Migration Studio",
          path: "/migration",
          icon: ArrowRightLeft,
          badge: "Live",
        },
        {
          label: "Live Editor",
          path: "/editor",
          icon: Database,
          badge: "Live",
        },
      ],
    },
    {
      title: "Organization",
      items: [
        {
          label: "Team Members",
          path: "/org/members",
          icon: Users,
          badge: null,
        },
        {
          label: "Settings",
          path: "/org/settings",
          icon: Settings,
          badge: null,
        },
        {
          label: "Documentation",
          path: "/docs",
          icon: BookOpen,
          badge: null,
        },
      ],
    },
  ]

  return (
    <aside
      className={cn(
        "border-border/70 bg-card/60 relative z-30 flex flex-col border-r backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none",
        sidebarOpen ? "w-64" : "w-18"
      )}
    >
      {/* Top Brand Header */}
      <div className="border-border/60 flex h-16 items-center justify-between border-b px-4">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 overflow-hidden transition-opacity hover:opacity-90"
        >
          <div className="font-heading from-primary to-primary/80 text-primary-foreground shadow-primary/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br font-extrabold shadow-sm">
            S
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="font-heading text-foreground text-base font-bold tracking-tight">
                SEASYN
              </span>
              <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
                Data Studio
              </span>
            </div>
          )}
        </NavLink>

        {sidebarOpen && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            className="text-muted-foreground hover:bg-muted/60 hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Organization Switcher Row */}
      <div className="border-border/50 border-b p-3">
        {sidebarOpen ? (
          <div className="w-full">
            <OrgSwitcher />
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              title="Expand sidebar to switch organizations"
              className="border-border/70 bg-background/60 text-primary hover:bg-accent flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border shadow-xs"
              onClick={toggleSidebar}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {sidebarOpen && (
              <h3 className="text-muted-foreground/70 px-3 text-[11px] font-bold tracking-wider uppercase">
                {group.title}
              </h3>
            )}
            <nav className="space-y-1 pt-1">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    title={!sidebarOpen ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold shadow-xs"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        !sidebarOpen && "justify-center px-2"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        {sidebarOpen && (
                          <span className="flex-1 truncate">{item.label}</span>
                        )}
                        {sidebarOpen && item.badge && (
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                              item.badge === "Live"
                                ? "border-success/20 bg-success/10 text-success border"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <span
                            className="bg-primary absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full"
                            aria-hidden="true"
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        ))}
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
              <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
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
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              className="text-muted-foreground hover:bg-muted/60 hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
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
