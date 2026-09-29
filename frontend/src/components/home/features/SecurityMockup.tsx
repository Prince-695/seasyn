import { ShieldCheck, Zap, Lock } from "lucide-react"

const ROWS = [
  {
    title: "Zero Configuration",
    desc: "Direct connections without local agents",
    icon: Zap,
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    title: "Centralized Governance",
    desc: "TLS 1.3 encrypted bidirectional streaming",
    icon: Lock,
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
]

export const SecurityMockup = () => {
  return (
    <div className="relative flex w-full items-center justify-center py-1">
      <div className="bg-card border-border flex w-full max-w-md flex-col gap-3 rounded-xl border p-4 shadow-sm sm:max-w-lg">
        {/* macOS Window Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="bg-mac-close h-2.5 w-2.5 rounded-full" />
            <span className="bg-mac-minimize h-2.5 w-2.5 rounded-full" />
            <span className="bg-mac-maximize h-2.5 w-2.5 rounded-full" />
          </div>
          <span className="bg-success/15 text-success inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
            <span className="bg-success h-1.5 w-1.5 rounded-full" />
            Zero Data Stored
          </span>
        </div>

        {/* Feature Rows */}
        <div className="flex flex-col gap-2">
          {/* Active Highlight Row */}
          <div className="bg-muted/60 border-border/80 flex items-center gap-3 rounded-lg border p-2.5 shadow-2xs">
            <div className="bg-secondary text-secondary-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-foreground truncate text-xs font-medium">
                Ephemeral In-Memory Credentials
              </h4>
              <p className="text-muted-foreground truncate text-[11px]">
                Direct point-to-point transfer — 100% in-flight
              </p>
            </div>
          </div>

          {/* Secondary Rows */}
          {ROWS.map((row) => {
            const Icon = row.icon
            return (
              <div
                key={row.title}
                className="bg-muted/30 border-border/50 flex items-center gap-3 rounded-lg border p-2.5"
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${row.iconBg} ${row.iconColor}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-foreground truncate text-xs font-medium">
                    {row.title}
                  </h4>
                  <p className="text-muted-foreground truncate text-[11px]">
                    {row.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
