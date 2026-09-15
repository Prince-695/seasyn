import { motion } from "framer-motion"
import { SiPostgresql, SiMysql, SiMongodb, SiSqlite } from "react-icons/si"
import { Logo } from "@/components/Logo"
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
    icon: <Logo size={36} className="p-0.5" />,
    iconBg: "bg-secondary/10 text-secondary",
    yOffsetClass: "translate-y-8 sm:translate-y-12 md:translate-y-16",
    floatDelay: 0.6,
  },
  {
    id: "mongodb",
    icon: (
      <SiMongodb className="text-success h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
    ),
    iconBg: "bg-success/10 text-success",
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
                transform: "rotateX(45deg) rotateZ(35deg)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Sleek floating tile surface blending seamlessly with the background */}
              <div
                className="border-border/30 bg-card/20 hover:border-border/60 hover:bg-card/30 relative flex h-20 w-20 flex-col items-center justify-center rounded-xl border backdrop-blur-[1px] transition-colors duration-300 sm:h-26 sm:w-26 sm:rounded-2xl md:h-32 md:w-32 lg:h-36 lg:w-36"
                style={{
                  transform: "translateZ(0px)",
                }}
              >
                {/* Centered Database Icon */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={cn(
                      "border-border/20 flex items-center justify-center rounded-xl border p-2 sm:rounded-2xl sm:p-2.5 md:p-3.5",
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
