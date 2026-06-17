import { useAuthStore } from "@/store/authStore"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, LogOut, User } from "lucide-react"

export default function Dashboard() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    // Clear user auth store session
    clearAuth()
    navigate("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2 text-xl font-bold text-primary">
            <LayoutDashboard className="h-6 w-6" />
            <span>SEASYN Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                {user?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
              </div>
              <span className="hidden text-sm font-medium sm:inline-block">
                {user?.name || user?.email}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            This is your workspace where you can manage your database migration
            pipelines.
          </p>
        </div>

        {/* Dummy Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-6 shadow-xs">
            <span className="text-sm font-medium text-muted-foreground">
              Active Migrations
            </span>
            <span className="text-4xl font-bold">3</span>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-6 shadow-xs">
            <span className="text-sm font-medium text-muted-foreground">
              Data Transferred
            </span>
            <span className="text-4xl font-bold">1.2 TB</span>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-6 shadow-xs">
            <span className="text-sm font-medium text-muted-foreground">
              System Health
            </span>
            <span className="text-4xl font-bold text-emerald-500">100%</span>
          </div>
        </div>

        {/* Dummy Migration List Card */}
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <div className="border-b border-border p-6 text-lg font-semibold">
            Recent Activity
          </div>
          <div className="p-6 py-12 text-center text-sm text-muted-foreground">
            No active migration pipelines found. Click "Create Pipeline" to get
            started.
          </div>
        </div>
      </main>
    </div>
  )
}
