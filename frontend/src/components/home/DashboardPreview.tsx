import { motion } from "framer-motion"
import { LayoutDashboard, ImageIcon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

interface DashboardPreviewProps {
  imageSrc?: string
  darkImageSrc?: string
  altText?: string
}

export const DashboardPreview = ({
  imageSrc = "/dashboard.png",
  darkImageSrc = "/dashboard-dark.png",
  altText = "Seasyn Dashboard Preview",
}: DashboardPreviewProps) => {
  const { theme } = useTheme()

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  const activeImage = isDark ? darkImageSrc : imageSrc

  return (
    <section className="relative z-10 mx-auto mt-14 flex w-full max-w-7xl flex-col items-center justify-center px-4 sm:mt-14 sm:mb-6 sm:px-6 md:mt-16 md:mb-8 lg:mt-18 lg:px-8">
      {/* Outer Ambient Glow using Theme Variables */}
      <div className="bg-primary/5 pointer-events-none absolute top-1/2 left-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />

      {/* Motion Container */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full"
      >
        {/* Main Dashboard Plate with Thick Light Border and Opacity Fade Mask (Top 80% visible, Bottom 20% fades to 0) */}
        <div className="border-border/40 bg-card relative w-full overflow-hidden rounded-2xl border-2 mask-[linear-gradient(to_bottom,black_75%,transparent_100%)] shadow-2xl sm:rounded-3xl sm:border-4">
          {activeImage ? (
            <img
              src={activeImage}
              alt={altText}
              key={activeImage}
              className="h-auto w-full object-cover object-top transition-opacity duration-300"
            />
          ) : (
            /* Dashboard Preview Placeholder Container */
            <div className="bg-card relative flex aspect-16/10 w-full flex-col">
              {/* Top Navigation Bar Mockup (No macOS 3 Dots) */}
              <div className="border-border/40 bg-muted/30 flex h-12 w-full items-center justify-between border-b px-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-success flex h-2 w-2 animate-pulse rounded-full" />
                    <span className="text-muted-foreground font-mono text-xs font-medium">
                      Live Telemetry
                    </span>
                  </div>
                  <span className="text-border">/</span>
                  <span className="text-foreground text-xs font-medium">
                    Production Workspace
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="border-border/60 bg-background text-muted-foreground rounded-md border px-2.5 py-1 font-mono text-xs">
                    PostgreSQL ➔ MongoDB
                  </span>
                </div>
              </div>

              {/* Body Content Placeholder */}
              <div className="flex flex-1 flex-col p-4 sm:p-6 md:p-8">
                {/* Metric Summary Cards */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  {[
                    {
                      label: "Active Pipelines",
                      value: "3 Active",
                      change: "+100% uptime",
                    },
                    {
                      label: "Synced Records",
                      value: "1,428,950",
                      change: "Zero loss",
                    },
                    {
                      label: "Connected DBs",
                      value: "8 Verified",
                      change: "4 engines",
                    },
                    {
                      label: "Avg CDC Lag",
                      value: "12ms",
                      change: "Real-time",
                    },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className="border-border/40 bg-muted/20 rounded-xl border p-3.5 sm:p-4"
                    >
                      <span className="text-muted-foreground text-xs font-medium">
                        {card.label}
                      </span>
                      <p className="text-foreground mt-1 font-mono text-lg font-semibold sm:text-xl">
                        {card.value}
                      </p>
                      <span className="text-muted-foreground text-[11px]">
                        {card.change}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Table / Graph Wireframe Area */}
                <div className="border-border/40 bg-muted/10 flex flex-1 flex-col rounded-xl border p-4 sm:p-6">
                  <div className="border-border/40 flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="text-primary h-4 w-4" />
                      <span className="text-foreground text-sm font-semibold">
                        Active Data Streams
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      Auto-syncing every 500ms
                    </span>
                  </div>

                  {/* Wireframe Rows */}
                  <div className="mt-4 flex flex-col gap-3">
                    {[
                      {
                        name: "prod-users-sync",
                        source: "PostgreSQL",
                        target: "MongoDB",
                        progress: "99.8%",
                        status: "Streaming",
                      },
                      {
                        name: "analytics-warehouse",
                        source: "MySQL",
                        target: "Snowflake",
                        progress: "84.2%",
                        status: "Streaming",
                      },
                      {
                        name: "ecom-orders-replica",
                        source: "PostgreSQL",
                        target: "Supabase",
                        progress: "100%",
                        status: "Completed",
                      },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="border-border/30 bg-card/60 flex items-center justify-between rounded-lg border p-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-foreground font-mono font-medium">
                            {row.name}
                          </span>
                          <span className="text-muted-foreground">
                            {row.source} ➔ {row.target}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground font-mono">
                            {row.progress}
                          </span>
                          <span className="bg-secondary/15 text-secondary rounded-full px-2 py-0.5 text-[10px] font-medium">
                            {row.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notice Slot */}
                  <div className="text-muted-foreground mt-auto flex items-center justify-center gap-2 pt-6 text-xs">
                    <ImageIcon className="text-muted-foreground h-4 w-4" />
                    <span>
                      Dashboard Image Slot — Pass imageSrc or replace
                      placeholder
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Fade Gradient Overlay for Seamless Blend */}
          <div className="from-background via-background/80 pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-linear-to-t to-transparent sm:h-48" />
        </div>
      </motion.div>
    </section>
  )
}

export default DashboardPreview
