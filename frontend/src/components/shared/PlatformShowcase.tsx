import { motion } from "framer-motion"
import { NavLink } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { SiMongodb, SiMysql, SiPostgresql, SiSqlite } from "react-icons/si"
import {
  Database,
  ArrowRightLeft,
  Shield,
  Terminal,
  Workflow,
  Server,
} from "lucide-react"

const PLATFORMS = [
  { name: "PostgreSQL", icon: SiPostgresql },
  { name: "MySQL", icon: SiMysql },
  { name: "MongoDB", icon: SiMongodb },
  { name: "SQLite", icon: SiSqlite },
]

/** Floating icon positions (placed along a curved path like WhisperFlow's app icons) */
const FLOATING_ICONS = [
  { Icon: Database, x: "8%", y: "30%", delay: 0 },
  { Icon: ArrowRightLeft, x: "15%", y: "60%", delay: 0.3 },
  { Icon: Shield, x: "25%", y: "20%", delay: 0.6 },
  { Icon: Terminal, x: "70%", y: "25%", delay: 0.2 },
  { Icon: Workflow, x: "80%", y: "55%", delay: 0.5 },
  { Icon: Server, x: "88%", y: "35%", delay: 0.8 },
]

export const PlatformShowcase = () => {
  return (
    <section className="relative w-full overflow-hidden bg-secondary text-secondary-foreground">
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-24 md:py-32">
        {/* Platform badges */}
        <motion.div
          className="mb-10 flex flex-wrap justify-center gap-3"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {PLATFORMS.map((platform) => (
            <div
              key={platform.name}
              className="flex items-center gap-2 rounded-full border border-secondary-foreground/20 px-4 py-1.5 text-sm font-medium text-secondary-foreground/80"
            >
              <platform.icon className="h-4 w-4" />
              {platform.name}
            </div>
          ))}
        </motion.div>

        {/* Heading */}
        <motion.h2
          className="max-w-2xl text-center text-4xl leading-[1.15] font-bold tracking-tight md:text-5xl lg:text-6xl"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Migrate across all your databases, on any platform
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          className="mt-6 max-w-md text-center text-base leading-relaxed text-secondary-foreground/60"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Seamless schema translation between every database engine on your
          infrastructure.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          className="mt-8"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <NavLink to="/docs">
            <Button
              variant="outline"
              className="h-11 rounded-full border-secondary-foreground/30 bg-transparent px-8 text-secondary-foreground hover:bg-secondary-foreground/10"
            >
              See it in action
            </Button>
          </NavLink>
        </motion.div>

        {/* Floating DB Icons */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          {FLOATING_ICONS.map(({ Icon, x, y, delay }, index) => (
            <motion.div
              key={index}
              className="absolute flex h-12 w-12 items-center justify-center rounded-xl border border-secondary-foreground/10 bg-secondary-foreground/5 backdrop-blur-sm"
              style={{ left: x, top: y }}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + delay }}
              animate={{
                y: [0, -8, 0],
              }}
              // @ts-expect-error framer-motion allows transition in animate context
              whileInView_transition={{
                y: {
                  duration: 3 + index * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            >
              <Icon className="h-5 w-5 text-secondary-foreground/50" />
            </motion.div>
          ))}
        </div>

        {/* Product Visual — Terminal Mockup */}
        <motion.div
          className="relative mt-16 w-full max-w-3xl"
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="overflow-hidden border border-secondary-foreground/20 bg-secondary shadow-lg">
            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-secondary-foreground/10 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <div className="h-3 w-3 rounded-full bg-accent" />
              <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
              <span className="ml-4 font-mono text-xs text-secondary-foreground/40">
                seasyn — migration terminal
              </span>
            </div>
            {/* Terminal body */}
            <div className="p-6 font-mono text-sm leading-relaxed text-secondary-foreground/70">
              <p>
                <span className="text-primary">$</span> seasyn migrate --source
                postgres --dest mongodb
              </p>
              <p className="mt-2 text-secondary-foreground/40">
                ✓ Connected to source: PostgreSQL 15.2
              </p>
              <p className="text-secondary-foreground/40">
                ✓ Connected to destination: MongoDB 7.0
              </p>
              <p className="text-secondary-foreground/40">
                ✓ Introspected 12 tables, 156 columns
              </p>
              <p className="text-accent">
                ↳ Mapping: users → users (14 fields)
              </p>
              <p className="text-accent">
                ↳ Mapping: orders → orders (22 fields)
              </p>
              <motion.p
                className="mt-2 text-primary"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ▶ Streaming rows... 3,247 / 10,000 (32.5%)
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default PlatformShowcase
