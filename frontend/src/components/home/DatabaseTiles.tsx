import { motion } from "framer-motion"
import { SiPostgresql, SiMysql, SiMongodb, SiSqlite } from "react-icons/si"
import { cn } from "@/lib/utils"

interface TileItem {
  id: string
  icon: React.ReactNode
  iconBg: string
  yOffsetClass: string
  floatDelay: number
}

const TILES: TileItem[] = [
  {
    id: "postgres",
    icon: (
      <SiPostgresql className="text-info h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
    ),
    iconBg: "bg-info/10 text-info",
    yOffsetClass: "translate-y-0 sm:-translate-y-2",
    floatDelay: 0,
  },
  {
    id: "mysql",
    icon: (
      <SiMysql className="text-primary h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
    ),
    iconBg: "bg-primary/10 text-primary",
    yOffsetClass: "translate-y-4 sm:translate-y-7 md:translate-y-9",
    floatDelay: 0.3,
  },
  {
    id: "seasyn",
    icon: (
      <div className="relative flex h-9 w-9 items-center justify-center sm:h-11 sm:w-11 md:h-13 md:w-13">
        <div className="border-primary absolute h-7 w-7 rotate-[-15deg] rounded-[7px] border-[3.5px] bg-transparent sm:h-8.5 sm:w-8.5 md:h-10 md:w-10" />
        <div className="border-secondary absolute h-7 w-7 translate-x-1.5 translate-y-1 rotate-[-15deg] rounded-[7px] border-[3.5px] bg-transparent sm:h-8.5 sm:w-8.5 md:h-10 md:w-10" />
      </div>
    ),
    iconBg: "bg-secondary/10 text-secondary",
    yOffsetClass: "translate-y-8 sm:translate-y-12 md:translate-y-16",
    floatDelay: 0.6,
  },
  {
    id: "mongodb",
    icon: (
      <SiMongodb className="text-accent h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
    ),
    iconBg: "bg-accent/10 text-accent",
    yOffsetClass: "translate-y-4 sm:translate-y-7 md:translate-y-9",
    floatDelay: 0.9,
  },
  {
    id: "sqlite",
    icon: (
      <SiSqlite className="text-chart-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
    ),
    iconBg: "bg-chart-4/10 text-chart-4",
    yOffsetClass: "translate-y-0 sm:-translate-y-2",
    floatDelay: 1.2,
  },
]

export function DatabaseTiles() {
  return (
    <section className="relative z-10 -mt-6 mb-16 flex w-full max-w-7xl items-center justify-center overflow-visible px-4 sm:-mt-2 sm:mb-24">
      {/* Background ambient radial glow */}
      <div className="bg-primary/5 dark:bg-primary/10 pointer-events-none absolute inset-0 -z-10 rounded-full blur-3xl" />

      {/* 3D Isometric Viewport with increased positive spacing between tiles */}
      <div
        className="flex w-full items-center justify-center gap-5 py-8 sm:gap-9 sm:py-14 md:gap-14 lg:gap-20 xl:gap-24"
        style={{ perspective: "1100px" }}
      >
        {TILES.map((tile) => (
          <motion.div
            key={tile.id}
            className={cn(
              "relative flex items-center justify-center",
              tile.yOffsetClass
            )}
            style={{
              transformStyle: "preserve-3d",
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: tile.floatDelay * 0.1,
              ease: "easeOut",
            }}
          >
            {/* The 3D Sleeping Square Wrapper */}
            <div
              className="relative flex items-center justify-center"
              style={{
                transform: "rotateX(45deg) rotateZ(45deg)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Clean minimal floating card surface without bottom colored square or black shadow */}
              <div
                className="bg-card/95 dark:bg-card/90 border-border/60 relative flex h-20 w-20 flex-col items-center justify-center rounded-2xl border backdrop-blur-md sm:h-26 sm:w-26 sm:rounded-3xl md:h-32 md:w-32 lg:h-36 lg:w-36"
                style={{
                  transform: "translateZ(0px)",
                }}
              >
                {/* Centered Database Icon aligned in the exact same direction as the tile */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-xl p-2 sm:rounded-2xl sm:p-2.5 md:p-3.5",
                      tile.iconBg
                    )}
                  >
                    {tile.icon}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default DatabaseTiles
