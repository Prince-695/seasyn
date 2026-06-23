import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { NavLink } from "react-router-dom"
import { Button } from "@/components/ui/button"

const floatingWords = [
  "schema mapping",
  "zero credentials",
  "real-time logs",
  "batch streaming",
  "auto-introspection",
  "type conversion",
  "data integrity",
  "live progress",
]

export const HeroSection = () => {
  return (
    <section className="relative flex min-h-[90vh] w-full flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-20">
      {/* Floating spiral words — decorative, like WhisperFlow's curved text */}
      <div className="pointer-events-none absolute inset-0 select-none">
        {floatingWords.map((word, i) => {
          const angle = (i / floatingWords.length) * 360
          const radius = 340 + i * 20
          const x = Math.cos((angle * Math.PI) / 180) * radius
          const y = Math.sin((angle * Math.PI) / 180) * radius
          return (
            <motion.span
              key={word}
              className="absolute top-1/2 left-1/2 hidden text-sm text-muted-foreground/20 lg:block"
              style={{
                x: x - 50,
                y: y - 10,
                rotate: angle + 90,
              }}
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {word}
            </motion.span>
          )
        })}
      </div>

      {/* Main Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="max-w-4xl text-5xl leading-[1.1] font-bold tracking-tight text-foreground md:text-7xl lg:text-8xl">
          Don&apos;t worry,{" "}
          <span className="font-serif italic">just migrate.</span>
        </h1>

        <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          The database migration engine that moves data between Postgres, MySQL,
          SQLite, and MongoDB. No stored credentials—no middle&#8209;man.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <NavLink to="/sign-up">
            <Button className="group h-12 gap-2 rounded-full px-8 text-base">
              Start Migrating
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </NavLink>
        </div>

        <p className="mt-6 text-xs tracking-wide text-muted-foreground/60">
          Available for PostgreSQL, MySQL, SQLite, and MongoDB
        </p>
      </motion.div>

      {/* Animated flowing ribbon — inspired by WhisperFlow's bottom wave */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-border"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </section>
  )
}

export default HeroSection
