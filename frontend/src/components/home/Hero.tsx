import { motion, type Variants } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HandwrittenAnnotation } from "@/components/ui/HandwrittenAnnotation"

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
  title = (
    <>
      <span className="bg-highlight text-highlight-foreground border-border/70 inline-block rounded-xl border px-3.5 py-0.5 font-semibold">
        Migrate database.
      </span>
      <br />
      In seconds, not sprint cycles.
    </>
  ),
  description = "Move and sync data between PostgreSQL, MySQL, MongoDB, and SQLite with zero downtime.",
  ctaText = "Launch Studio",
  onCtaClick,
}: HeroProps) => {
  return (
    <section className="relative z-10 mx-auto mt-20 flex w-full max-w-4xl flex-col items-center justify-center px-4 sm:mt-28 sm:px-6 md:px-8">
      <div className="relative z-10 w-full pt-6 sm:pt-10">
        <motion.div
          className="flex w-full flex-col items-center justify-center"
          variants={curtainRevealVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Center: Text Content */}
          <div className="flex w-full flex-col items-center text-center">
            <h1 className="text-foreground text-center text-3xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-[4.25rem] lg:leading-[1.12]">
              {title}
            </h1>

            <p className="text-muted-foreground mt-5 max-w-2xl text-center text-base leading-relaxed sm:mt-6 sm:text-lg md:text-xl">
              {description}
            </p>

            {/* CTA row with right-side annotation in the open margin */}
            <div className="relative mt-8 flex w-full items-center justify-center">
              <Button
                onClick={onCtaClick}
                className="group bg-primary text-primary-foreground hover:bg-primary/90 border-primary/30 relative flex items-center justify-center gap-2.5 rounded-lg border px-7 py-6 text-base font-semibold transition-all active:translate-y-px"
              >
                {ctaText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>

              {/* Editorial handwritten note — placed in the open right-hand flank */}
              <div className="pointer-events-none absolute right-0 lg:right-4 xl:right-8 top-1/2 -translate-y-1/2 hidden md:inline-flex">
                <HandwrittenAnnotation
                  text={["Different databases.", "A unified flow."]}
                  dot
                  underline
                  tone="blue"
                  rotate={-3}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
