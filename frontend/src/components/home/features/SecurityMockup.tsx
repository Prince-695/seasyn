import { useRef } from "react"
import { ShieldCheck, Zap, Lock, Hand } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"

const STATIC_ROWS = [
  {
    title: "Zero Configuration",
    desc: "Direct connections without agents",
    icon: Zap,
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    title: "Centralized Governance",
    desc: "TLS 1.3 encrypted streaming",
    icon: Lock,
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
]

export const SecurityMockup = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 85%", "center 25%"],
  })

  // Slower, wide-distance scroll-linked docking motion fully visible in viewport
  const x = useTransform(scrollYProgress, [0.05, 0.88], [62, 0])
  const y = useTransform(scrollYProgress, [0.05, 0.88], [20, 0])
  const rotate = useTransform(scrollYProgress, [0.05, 0.88], [8.5, 0])
  const cursorOpacity = useTransform(
    scrollYProgress,
    [0.05, 0.78, 0.92],
    [1, 1, 0]
  )
  const floatingShadowOpacity = useTransform(
    scrollYProgress,
    [0.05, 0.88],
    [1, 0]
  )

  return (
    <div
      ref={containerRef}
      className="bg-muted/40 dark:bg-muted/15 border-border/40 relative flex h-50 w-full items-center justify-center overflow-hidden rounded-xl border p-3"
    >
      {/* macOS Window Frame */}
      <div className="bg-card border-border relative w-full max-w-65 -translate-x-3.5 rounded-lg border p-2.5 shadow-sm sm:-translate-x-4.5">
        {/* macOS Window Controls */}
        <div className="mb-2 flex items-center gap-1.5">
          <span className="bg-mac-close h-2 w-2 rounded-full" />
          <span className="bg-mac-minimize h-2 w-2 rounded-full" />
          <span className="bg-mac-maximize h-2 w-2 rounded-full" />
        </div>

        {/* Feature Rows */}
        <div className="flex flex-col gap-1.5">
          {/* Row 1 Slot: Target drop zone with scroll-driven docking card */}
          <div className="relative h-11.5 w-full">
            <div className="border-border/60 bg-muted/20 absolute inset-0 rounded-lg border border-dashed" />

            <motion.div
              style={{ x, y, rotate }}
              className="bg-card border-border relative z-10 flex h-full items-start gap-2.5 rounded-lg border p-2 shadow-xs will-change-transform"
            >
              <motion.div
                style={{ opacity: floatingShadowOpacity }}
                className="pointer-events-none absolute inset-0 rounded-lg shadow-xl"
              />

              <div className="bg-secondary text-secondary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-md shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-foreground truncate text-[11px] font-semibold">
                  Ephemeral Credentials
                </h4>
                <p className="text-muted-foreground truncate text-[10px] leading-tight">
                  Zero data retention — 100% in-flight
                </p>
              </div>

              <motion.div
                style={{ opacity: cursorOpacity }}
                className="pointer-events-none absolute -right-2 -bottom-2 z-20 drop-shadow-md"
              >
                <Hand className="fill-card text-foreground h-4 w-4 -rotate-12 stroke-[1.8]" />
              </motion.div>
            </motion.div>
          </div>

          {/* Rows 2 & 3 mapped from array */}
          {STATIC_ROWS.map((row) => {
            const Icon = row.icon
            return (
              <div
                key={row.title}
                className="bg-muted/50 border-border/40 flex items-start gap-2.5 rounded-lg border p-1.5 px-2"
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${row.iconBg} ${row.iconColor}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-foreground truncate text-[11px] font-semibold">
                    {row.title}
                  </h4>
                  <p className="text-muted-foreground truncate text-[10px] leading-tight">
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
