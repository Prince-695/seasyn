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
      <span className="bg-highlight text-highlight-foreground border-border/70 inline-block rounded-xl border px-3.5 py-0.5 font-medium">
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
    <section className="relative mx-auto mt-20 flex w-full max-w-4xl flex-col items-center justify-center px-4 sm:mt-28 sm:px-6 md:px-8">
      {/* ── Ambient background layer ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-32 -inset-y-16 -z-10"
      >
        {/* Primary blue glow — top-center, the dominant orb */}
        <div className="bg-primary/20 absolute -top-20 left-1/2 h-125 w-175 -translate-x-1/2 rounded-full blur-[80px]" />

        {/* Amber accent — bottom-left */}
        <div className="bg-secondary/20 absolute bottom-0 -left-20 h-75 w-100 rounded-full blur-[70px]" />

        {/* Faint right-side blue echo */}
        <div className="bg-primary/15 absolute top-1/4 -right-10 h-65 w-80 rounded-full blur-[60px]" />

        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 w-full pt-6 sm:pt-10">
        <motion.div
          className="flex w-full flex-col items-center justify-center"
          variants={curtainRevealVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Center: Text Content */}
          <div className="flex w-full flex-col items-center text-center">
            <h1 className="text-foreground text-center text-3xl font-medium tracking-tight sm:text-5xl md:text-6xl lg:text-[4.25rem] lg:leading-[1.12]">
              {title}
            </h1>

            <p className="text-muted-foreground mt-5 max-w-2xl text-center text-base leading-relaxed sm:mt-6 sm:text-lg md:text-xl">
              {description}
            </p>

            {/* CTA row with right-side annotation in the open margin */}
            <div className="relative mt-8 flex w-full items-center justify-center">
              <Button
                onClick={onCtaClick}
                className="group bg-primary text-primary-foreground hover:bg-primary/90 border-primary/30 relative flex items-center justify-center gap-2.5 rounded-lg border px-7 py-6 text-base font-medium transition-all active:translate-y-px"
              >
                {ctaText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>

              {/* Editorial handwritten note — placed in the open right-hand flank */}
              <div className="pointer-events-none absolute top-1/2 right-0 hidden -translate-y-1/2 md:inline-flex lg:right-4 xl:right-8">
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
