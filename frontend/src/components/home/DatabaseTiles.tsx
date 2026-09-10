import { motion } from "framer-motion"
import { SiPostgresql, SiMysql, SiMongodb, SiSqlite } from "react-icons/si"
import { cn } from "@/lib/utils"

interface TileItem {
  id: string
  icon: React.ReactNode
  extrusionColor: string
  glowColor: string
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
    extrusionColor: "bg-info/35 dark:bg-info/40",
    glowColor: "bg-info/20",
    iconBg: "bg-info/10 text-info",
    yOffsetClass: "translate-y-0 sm:-translate-y-2",
    floatDelay: 0,
  },
  {
    id: "mysql",
    icon: (
      <SiMysql className="text-primary h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
    ),
    extrusionColor: "bg-primary/35 dark:bg-primary/40",
    glowColor: "bg-primary/20",
    iconBg: "bg-primary/10 text-primary",
    yOffsetClass: "translate-y-4 sm:translate-y-8 md:translate-y-10",
    floatDelay: 0.3,
  },
  {
    id: "seasyn",
    icon: (
      <div className="relative flex h-9 w-9 items-center justify-center sm:h-11 sm:w-11 md:h-13 md:w-13">
        <div className="border-primary absolute h-7 w-7 rotate-[-15deg] rounded-[7px] border-[3.5px] bg-transparent shadow-2xs sm:h-9 sm:w-9 md:h-10 md:w-10" />
        <div className="border-secondary absolute h-7 w-7 translate-x-1.5 translate-y-1 rotate-[-15deg] rounded-[7px] border-[3.5px] bg-transparent shadow-2xs sm:h-9 sm:w-9 md:h-10 md:w-10" />
      </div>
    ),
    extrusionColor: "bg-secondary/40 dark:bg-secondary/45",
    glowColor: "bg-secondary/25",
    iconBg: "bg-secondary/10 text-secondary",
    yOffsetClass: "translate-y-8 sm:translate-y-14 md:translate-y-18",
    floatDelay: 0.6,
  },
  {
    id: "mongodb",
    icon: (
      <SiMongodb className="text-accent h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
    ),
    extrusionColor: "bg-accent/35 dark:bg-accent/40",
    glowColor: "bg-accent/20",
    iconBg: "bg-accent/10 text-accent",
    yOffsetClass: "translate-y-4 sm:translate-y-8 md:translate-y-10",
    floatDelay: 0.9,
  },
  {
    id: "sqlite",
    icon: (
      <SiSqlite className="text-chart-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
    ),
    extrusionColor: "bg-chart-4/35 dark:bg-chart-4/40",
    glowColor: "bg-chart-4/20",
    iconBg: "bg-chart-4/10 text-chart-4",
    yOffsetClass: "translate-y-0 sm:-translate-y-2",
    floatDelay: 1.2,
  },
]

export function DatabaseTiles() {
  return (
    <section className="relative z-10 -mt-6 mb-16 flex w-full max-w-6xl items-center justify-center overflow-visible px-4 sm:-mt-2 sm:mb-24">
      {/* Background ambient radial glow */}
      <div className="bg-primary/5 dark:bg-primary/10 pointer-events-none absolute inset-0 -z-10 rounded-full blur-3xl" />

      {/* 3D Isometric Viewport with generous positive spacing to avoid overlapping */}
      <div
        className="flex w-full items-center justify-center gap-3 py-8 sm:gap-6 sm:py-14 md:gap-9 lg:gap-14"
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
            {/* The 3D Sleeping Square Wrapper (preserved user's rotateX(45deg)) */}
            <div
              className="relative flex items-center justify-center"
              style={{
                transform: "rotateX(45deg) rotateZ(45deg)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Bottom 3D Colored Extrusion Slice */}
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl sm:rounded-3xl",
                  tile.extrusionColor
                )}
                style={{
                  transform:
                    "translateZ(-14px) translateY(12px) translateX(6px)",
                }}
              />

              {/* Top Face: Clean minimal card surface without extra color shadow or black shadow/border */}
              <div
                className="bg-card/95 dark:bg-card/90 relative flex h-20 w-20 flex-col items-center justify-center rounded-2xl backdrop-blur-md sm:h-28 sm:w-28 sm:rounded-3xl md:h-34 md:w-34 lg:h-38 lg:w-38"
                style={{
                  transform: "translateZ(0px)",
                }}
              >
                {/* Centered Database Icon (counter-rotated -45deg to stay upright on the 3D plane) */}
                <div
                  className="relative flex items-center justify-center"
                  style={{ transform: "rotateZ(-45deg)" }}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-xl p-2.5 shadow-2xs sm:rounded-2xl sm:p-3 md:p-3.5",
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
