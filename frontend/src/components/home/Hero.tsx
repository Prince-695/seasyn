import { motion, type Variants } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroProps {
  badge?: React.ReactNode
  title?: React.ReactNode
  description?: string
  ctaText?: string
  onCtaClick?: () => void
}

const curtainRevealVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
  },
}

export const Hero = ({
  // badge = (
  //   <div className="border-border bg-muted/60 text-foreground mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide shadow-2xs">
  //     <Zap className="text-primary fill-primary/20 h-3.5 w-3.5" />
  //     <span>Cross-Database Migration Studio</span>
  //   </div>
  // ),
  title = (
    <>
      <span className="bg-highlight text-highlight-foreground inline-block rounded-2xl px-3.5 py-0.5 font-semibold shadow-2xs">
        Migrate database.
      </span>
      <br />
      In seconds, not sprint cycles.
    </>
  ),
  description = "The universal sync engine for PostgreSQL, MySQL, MongoDB, and SQLite. Stream millions of records cross-paradigm with zero downtime and live throughput telemetry.",
  ctaText = "Launch Studio",
  onCtaClick,
}: HeroProps) => {
  return (
    <section className="relative z-10 mt-35 flex w-full max-w-6xl">
      <div className="w-full pt-10">
        <motion.div
          className="flex w-full flex-col items-center justify-between gap-16 lg:flex-row"
          variants={curtainRevealVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Center: Text Content */}
          <div className="flex flex-1 flex-col items-center">
            {/* {badge} */}

            <h1 className="text-foreground text-center text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl lg:leading-[1.1]">
              {title}
            </h1>

            <p className="text-muted-foreground mt-6 max-w-3xl text-center text-lg leading-relaxed md:text-xl">
              {description}
            </p>

            <div className="relative mt-8 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                onClick={onCtaClick}
                className="group bg-primary text-primary-foreground hover:bg-primary/90 relative flex items-center justify-center gap-2.5 rounded-xl px-7 py-6 text-base font-semibold shadow-md transition-all hover:shadow-lg"
              >
                {ctaText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
