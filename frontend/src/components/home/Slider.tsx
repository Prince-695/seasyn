import { motion } from "framer-motion"
import { SiMongodb, SiMysql, SiPostgresql, SiSqlite } from "react-icons/si"

const DATABASES = [
  { name: "MongoDB", icon: SiMongodb },
  { name: "MySQL", icon: SiMysql },
  { name: "PostgreSQL", icon: SiPostgresql },
  { name: "SQLite", icon: SiSqlite },
]

// Duplicate multiple times to ensure the screen is filled and there's enough content for infinite scroll
const MARQUEE_ITEMS = [...DATABASES, ...DATABASES, ...DATABASES, ...DATABASES]

export const Slider = () => {
  return (
    <section className="max-w-8xl bg-accent relative mt-30 flex w-full flex-col items-center justify-center overflow-hidden rounded-t-4xl p-8">
      <div className="mb-8 text-center md:mb-10">
        <h2 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          Supported <span className="text-secondary">Databases</span>
        </h2>
      </div>

      <div className="relative flex w-full overflow-hidden">
        {/* <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-background to-transparent sm:w-24 md:w-32"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-background to-transparent sm:w-24 md:w-32"></div> */}

        <motion.div
          className="flex w-max items-center gap-8 pr-8 md:gap-16 md:pr-16"
          animate={{ x: [0, "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 30,
          }}
        >
          {MARQUEE_ITEMS.map((db, index) => (
            <div key={index} className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all md:h-16 md:w-16">
                <db.icon className="text-primary/50 h-6 w-6 md:h-8 md:w-8" />
              </div>
              <span className="text-secondary/30 text-xl font-bold whitespace-nowrap md:text-2xl">
                {db.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// export default Slider
