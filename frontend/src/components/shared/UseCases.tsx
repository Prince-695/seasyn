import { motion } from "framer-motion"
import { NavLink } from "react-router-dom"
import { Button } from "@/components/ui/button"

const USE_CASE_TAGS = [
  "Startups",
  "Enterprise",
  "DevOps",
  "Backend Engineers",
  "Data Teams",
  "Database Admins",
  "CTOs",
  "Agencies",
  "Freelancers",
]

export const UseCases = () => {
  return (
    <section className="relative w-full overflow-hidden bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="grid items-start gap-16 lg:grid-cols-2">
          {/* Left Column — Heading + Tags */}
          <div>
            <motion.h2
              className="text-4xl leading-[1.15] font-bold tracking-tight md:text-5xl lg:text-6xl"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              Made for the
              <br />
              way <span className="font-serif italic">you</span> migrate
            </motion.h2>

            <motion.p
              className="mt-4 text-base text-secondary-foreground/50"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Select one to see Seasyn in action.
            </motion.p>

            {/* Pill Tags */}
            <motion.div
              className="mt-10 flex flex-wrap gap-3"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {USE_CASE_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="cursor-pointer rounded-full border border-secondary-foreground/25 px-5 py-2 text-sm font-medium text-secondary-foreground/80 transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right Column — Description + CTA */}
          <motion.div
            className="flex flex-col justify-center"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <h3 className="text-3xl font-bold tracking-tight md:text-4xl">
              One tool. Your workflow.
            </h3>

            <p className="mt-4 max-w-md text-base leading-relaxed text-secondary-foreground/60">
              Whether you&apos;re scaling infrastructure, replatforming, or
              moving to the cloud, Seasyn adapts to how you work. No lock-in, no
              complexity.
            </p>

            <div className="mt-8">
              <NavLink to="/sign-up">
                <Button className="h-11 rounded-full px-8 text-base">
                  Start Migrating
                </Button>
              </NavLink>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default UseCases
