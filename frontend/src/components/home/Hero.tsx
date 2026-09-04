import { motion, type Variants } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroProps {
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
    transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] },
  },
}

export const Hero = ({
  title = (
    <>
      Fluid Database Migrations,
      <br />
      <span className="">Zero Friction.</span>
    </>
  ),
  description = "The intelligent, stateless bridge between Postgres, MySQL, SQLite, and MongoDB. No persistent data, no stored credentials—just fast, secure migrations.",
  ctaText = "Start Migrating",
  onCtaClick,
}: HeroProps) => {
  return (
    <section className="relative z-10 mt-40 flex w-full max-w-6xl">
      <div className="w-full pt-10">
        <motion.div
          className="flex w-full flex-col items-center justify-between gap-16 lg:flex-row"
          variants={curtainRevealVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left: Text Content */}
          <div className="flex flex-1 flex-col items-center">
            <h1 className="text-foreground text-center text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl lg:leading-[1.1]">
              {title}
            </h1>

            <p className="text-muted-foreground mt-6 max-w-3xl text-center text-lg leading-relaxed md:text-xl">
              {description}
            </p>

            <div className="relative mt-10 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                onClick={onCtaClick}
                className="group border-primary bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground relative flex items-center justify-center gap-3 border p-6 font-medium transition-all"
              >
                {ctaText}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
