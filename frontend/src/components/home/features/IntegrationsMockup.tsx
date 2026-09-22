import { GripVertical } from "lucide-react"
import {
  SiPostgresql,
  SiMysql,
  SiMongodb,
  SiSqlite,
  SiRedis,
  SiSupabase,
  SiSnowflake,
} from "react-icons/si"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const INTEGRATION_ENGINES = [
  {
    id: "postgres",
    name: "PostgreSQL",
    icon: SiPostgresql,
    iconColor: "text-info",
    iconBg: "bg-info/10",
    active: true,
  },
  {
    id: "mysql",
    name: "MySQL",
    icon: SiMysql,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    active: true,
  },
  {
    id: "mongodb",
    name: "MongoDB",
    icon: SiMongodb,
    iconColor: "text-success",
    iconBg: "bg-success/10",
    active: false,
  },
  {
    id: "sqlite",
    name: "SQLite",
    icon: SiSqlite,
    iconColor: "text-chart-4",
    iconBg: "bg-chart-4/10",
    active: true,
  },
  {
    id: "redis",
    name: "Redis",
    icon: SiRedis,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    active: false,
  },
  {
    id: "supabase",
    name: "Supabase",
    icon: SiSupabase,
    iconColor: "text-accent",
    iconBg: "bg-accent/10",
    active: true,
  },
  {
    id: "snowflake",
    name: "Snowflake",
    icon: SiSnowflake,
    iconColor: "text-info",
    iconBg: "bg-info/10",
    active: false,
  },
]

export const IntegrationsMockup = () => {
  return (
    <div className="relative flex w-full items-center justify-center overflow-hidden py-1">
      <div className="bg-card border-border flex w-full max-w-md flex-col gap-2.5 rounded-xl border p-4 shadow-sm sm:max-w-lg">
        {/* Top "+ Add new integration" Button */}
        <Button
          variant="outline"
          size="xs"
          type="button"
          className="border-border hover:border-primary/40 hover:text-primary bg-muted/20 text-muted-foreground z-10 w-full border-dashed text-[11px] font-medium transition-colors"
        >
          <span className="text-xs leading-none">+</span>
          <span>Add new integration</span>
        </Button>

        {/* Continuous Infinite Vertical Scrolling Reel */}
        <div className="relative h-24.5 overflow-hidden">
          {/* Top & Bottom subtle fade gradients */}
          <div className="from-card pointer-events-none absolute inset-x-0 top-0 z-10 h-3.5 bg-linear-to-b to-transparent" />
          <div className="from-card pointer-events-none absolute inset-x-0 bottom-0 z-10 h-3.5 bg-linear-to-t to-transparent" />

          {/* Seamless Infinite Marquee Track */}
          <motion.div
            className="flex flex-col gap-1.5"
            animate={{ y: ["0%", "-50%"] }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[...INTEGRATION_ENGINES, ...INTEGRATION_ENGINES].map(
              (engine, idx) => {
                const Icon = engine.icon
                return (
                  <div
                    key={`${engine.id}-${idx}`}
                    className="bg-muted/40 border-border/50 flex items-center justify-between rounded-lg border p-1.5 px-2"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="text-muted-foreground/40 h-3 w-3 shrink-0" />
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-md",
                          engine.iconBg
                        )}
                      >
                        <Icon className={cn("h-3.5 w-3.5", engine.iconColor)} />
                      </div>
                      <span className="text-foreground text-[11px] font-medium">
                        {engine.name}
                      </span>
                    </div>

                    {/* Switch Pill */}
                    <div
                      className={cn(
                        "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors",
                        engine.active
                          ? "bg-accent"
                          : "bg-input dark:bg-input/80"
                      )}
                    >
                      <span
                        className={cn(
                          "bg-background block h-3 w-3 rounded-full shadow-xs transition-transform",
                          engine.active ? "translate-x-3" : "translate-x-0"
                        )}
                      />
                    </div>
                  </div>
                )
              }
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
