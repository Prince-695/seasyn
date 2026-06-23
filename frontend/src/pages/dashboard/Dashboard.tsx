import { useAuthStore } from "@/store/authStore"

export function Dashboard() {
  const { user } = useAuthStore()

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Welcome back, {user?.name || "User"}!
        </h1>
        <p className="text-muted-foreground">
          This is your workspace where you can manage your database migration
          pipelines.
        </p>
      </div>

      {/* Stats Grid */}
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

      {/* Migration List Card */}
      <div className="rounded-xl border border-border bg-card shadow-xs">
        <div className="border-b border-border p-6 text-lg font-semibold">
          Recent Activity
        </div>
        <div className="p-6 py-12 text-center text-sm text-muted-foreground">
          No active migration pipelines found. Click "Create Pipeline" to get
          started.
        </div>
      </div>
    </>
  )
}

export default Dashboard
