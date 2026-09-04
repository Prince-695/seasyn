import { motion } from "framer-motion"
import { NavLink } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export const CTASection = () => {
  return (
    <section className="bg-secondary text-secondary-foreground relative w-full overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="via-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-transparent" />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-28 text-center md:py-40">
        <motion.h2
          className="text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          Start <span className="font-serif italic">migrating</span>
        </motion.h2>

        <motion.p
          className="text-secondary-foreground/60 mt-6 max-w-lg text-base leading-relaxed"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Effortless database migration across every engine.
          <br />
          Smart schema mapping, real-time streaming, and zero-footprint
          security.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <NavLink to="/sign-up">
            <Button className="group h-12 gap-2 rounded-full px-8 text-base">
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </NavLink>
          <NavLink to="/docs">
            <Button
              variant="outline"
              className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10 h-12 rounded-full bg-transparent px-8 text-base"
            >
              View Documentation
            </Button>
          </NavLink>
        </motion.div>

        <motion.p
          className="text-secondary-foreground/40 mt-8 text-xs tracking-wide"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Available for PostgreSQL, MySQL, SQLite, and MongoDB.
          <br />
          Free to start.
        </motion.p>
      </div>
    </section>
  )
}

export default CTASection
