import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

const STATS = [
  {
    metric: "4x faster setup",
    quote: "From connecting to migrating in under a minute.",
    variant: "primary" as const,
  },
  {
    metric: "99.9% data integrity",
    quote: "Every row verified, every type correctly mapped.",
    variant: "accent" as const,
  },
  {
    metric: "Zero stored credentials",
    quote: "Your secrets never touch our servers.",
    variant: "primary" as const,
  },
  {
    metric: "4 database engines",
    quote: "Postgres, MySQL, MongoDB, and SQLite — fully supported.",
    variant: "accent" as const,
  },
]

export const StatsSection = () => {
  return (
    <section className="w-full bg-secondary text-secondary-foreground px-6 pb-24 md:pb-32">
      <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2">
        {STATS.map((stat, index) => (
          <motion.div
            key={index}
            className={`group relative flex cursor-default flex-col justify-between overflow-hidden p-8 transition-all md:p-10 ${
              stat.variant === "primary"
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-accent-foreground"
            }`}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {/* Arrow icon */}
            <ArrowUpRight className="absolute top-6 right-6 h-5 w-5 opacity-40 transition-all group-hover:opacity-100" />

            <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
              {stat.metric}
            </h3>
            <p className="mt-3 max-w-xs text-sm leading-relaxed opacity-70">
              &ldquo;{stat.quote}&rdquo;
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default StatsSection
