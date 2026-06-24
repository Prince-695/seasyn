import { motion } from "framer-motion"

const TESTIMONIALS = [
  {
    quote:
      "Seasyn just handled our Postgres-to-Mongo migration in minutes. What used to take our team days of manual work is now a single command.",
    name: "Arjun Patel",
    title: "CTO, NexaCloud",
  },
  {
    quote:
      "The real-time streaming logs are incredible. I could see every row being migrated live — no more guessing if things are working.",
    name: "Sarah Chen",
    title: "Lead Backend Engineer, DataPipe",
  },
  {
    quote:
      "Zero stored credentials is the killer feature. Our security team approved Seasyn in a day — that never happens with migration tools.",
    name: "Marcus Williams",
    title: "VP Engineering, ShieldOps",
  },
  {
    quote:
      "We migrated 4 million rows from MySQL to PostgreSQL without a single data integrity issue. The schema mapping was spot-on.",
    name: "Priya Sharma",
    title: "Database Admin, FinScale",
  },
  {
    quote:
      "I've tried every migration tool on the market. Seasyn is the only one that doesn't feel like it was built in 2005.",
    name: "Tom Reeves",
    title: "Founder, DevForge",
  },
  {
    quote:
      "The fact that I can migrate between SQL and NoSQL with automatic type mapping? That's not just convenient — it's revolutionary.",
    name: "Elena Rossi",
    title: "Data Engineer, Orbital",
  },
]

/** Duplicated for infinite scroll effect */
const MARQUEE_ITEMS = [...TESTIMONIALS, ...TESTIMONIALS]

export const Testimonials = () => {
  return (
    <section className="relative w-full overflow-hidden bg-secondary py-24 text-secondary-foreground md:py-32">
      {/* Section Heading */}
      <motion.div
        className="mb-16 px-6 text-center"
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <h2 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Love letters to <span className="font-serif italic">Seasyn</span>
        </h2>
      </motion.div>

      {/* Scrolling Testimonial Cards — horizontal marquee like WhisperFlow */}
      <div className="relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-secondary to-transparent sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-secondary to-transparent sm:w-32" />

        <motion.div
          className="flex w-max gap-6 pr-6"
          animate={{ x: [0, "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 40,
          }}
        >
          {MARQUEE_ITEMS.map((testimonial, index) => (
            <div
              key={index}
              className="flex w-80 shrink-0 flex-col justify-between border border-secondary-foreground/10 bg-secondary-foreground/5 p-6 backdrop-blur-sm md:w-96"
            >
              {/* Avatar placeholder */}
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-secondary-foreground/10 text-sm font-bold text-secondary-foreground/60">
                  {testimonial.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <p className="text-sm leading-relaxed text-secondary-foreground/70">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>
              <div className="mt-6 border-t border-secondary-foreground/10 pt-4">
                <p className="text-sm font-semibold text-secondary-foreground">
                  {testimonial.name}
                </p>
                <p className="text-xs text-secondary-foreground/50">
                  {testimonial.title}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Testimonials
