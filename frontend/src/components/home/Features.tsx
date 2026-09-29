import { useState, useRef } from "react"
import {
  Zap,
  Database,
  ShieldCheck,
  Layers,
  type LucideIcon,
} from "lucide-react"
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollRevealText } from "@/components/ui/scroll-reveal-text"
import { HandwrittenAnnotation } from "@/components/ui/HandwrittenAnnotation"
import { cn } from "@/lib/utils"
import { SecurityMockup } from "./features/SecurityMockup"
import { IntegrationsMockup } from "./features/IntegrationsMockup"
import { SchemaTranslationMockup } from "./features/SchemaTranslationMockup"
import { TelemetryStreamMockup } from "./features/TelemetryStreamMockup"

interface FeatureItem {
  id: string
  title: string
  description: string
  icon: LucideIcon
  badge: string
  mockup: React.ComponentType
}

const FEATURES: FeatureItem[] = [
  {
    id: "cdc-pipeline",
    title: "Effortless Streaming, Lightning-Fast",
    description:
      "Stream gigabytes of live records with zero downtime, microsecond replication lag, and continuous sync telemetry.",
    icon: Zap,
    badge: "Live CDC Stream",
    mockup: TelemetryStreamMockup,
  },
  {
    id: "schema-diff",
    title: "Automatic Schema & Type Bridge",
    description:
      "Intelligently matches tables, column types, and foreign keys across heterogeneous SQL and NoSQL databases.",
    icon: Database,
    badge: "Auto Type Inference",
    mockup: SchemaTranslationMockup,
  },
  {
    id: "security",
    title: "Ephemeral & Zero Retention",
    description:
      "Direct point-to-point TLS 1.3 streaming. Your credentials and database records are never saved on our servers.",
    icon: ShieldCheck,
    badge: "End-to-End Encrypted",
    mockup: SecurityMockup,
  },
  {
    id: "integrations",
    title: "Universal Database Support",
    description:
      "Seamlessly bridge PostgreSQL, MySQL, MongoDB, SQLite, Supabase, and Snowflake in one unified workspace.",
    icon: Layers,
    badge: "Multi-Engine Matrix",
    mockup: IntegrationsMockup,
  },
]

export const Features = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Scroll-linked auto feature progression
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActiveIndex(
      Math.min(
        FEATURES.length - 1,
        Math.max(0, Math.floor(v * FEATURES.length))
      )
    )
  })

  const handleTabClick = (index: number) => {
    setActiveIndex(index)
    if (!containerRef.current) return
    const { offsetTop, offsetHeight } = containerRef.current
    const scrollableDistance = Math.max(0, offsetHeight - window.innerHeight)
    const targetScroll =
      offsetTop + (index / (FEATURES.length - 1 || 1)) * scrollableDistance
    window.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    })
  }

  const activeFeature = FEATURES[activeIndex]
  const ActiveMockup = activeFeature.mockup

  return (
    <div
      ref={containerRef}
      className="relative z-10 mt-6 mb-20 h-700 w-full sm:mt-10 sm:mb-32 md:mt-10 md:mb-40"
    >
      {/* Sticky Viewport Container - Centered Vertically and Horizontally */}
      <section className="sticky top-0 flex min-h-screen w-full flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center">
          {/* Section Header */}
          <div className="relative mb-8 flex flex-col items-center text-center sm:mb-10">
            <div className="relative mb-3 inline-flex items-center justify-center">
              <span className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-3.5 py-1 text-xs font-medium shadow-2xs">
                Capabilities
              </span>
            </div>

            <ScrollRevealText
              as="h2"
              lines={[
                "Control every migration",
                <span key="sub" className="text-primary font-serif italic">
                  in the moment.
                </span>,
              ]}
              className="text-foreground items-center text-center text-3xl sm:text-4xl md:text-5xl lg:leading-[1.15]"
              lineClassName="leading-[1.15]"
            />
          </div>

          {/* Editorial handwritten note — placed on the right side */}
          <div className="mb-2 hidden w-full justify-end pr-2 sm:flex sm:pr-6">
            <HandwrittenAnnotation
              text="Schema, translated."
              tone="lavender"
              rotate={2}
              underline
              className="inline-flex"
            />
          </div>

          <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-14">
            {/* Left Column: Feature Selectors */}
            <div className="flex w-full flex-col gap-2.5 sm:gap-3">
              {FEATURES.map((feature, idx) => {
                const isActive = activeIndex === idx
                const Icon = feature.icon

                return (
                  <Button
                    key={feature.id}
                    variant="ghost"
                    onClick={() => handleTabClick(idx)}
                    className={cn(
                      "group relative flex h-auto w-full cursor-pointer items-start justify-start rounded-xl py-2.5 pr-3 pl-4 text-left whitespace-normal transition-all duration-300 focus-visible:outline-none",
                      isActive
                        ? "bg-muted/35 hover:bg-muted/40"
                        : "hover:bg-muted/15"
                    )}
                  >
                    {/* Active Indicator Bar */}
                    <div
                      className={cn(
                        "bg-primary absolute top-2.5 bottom-2.5 left-0 w-1 rounded-full transition-all duration-300",
                        isActive
                          ? "scale-y-100 opacity-100"
                          : "scale-y-0 opacity-0"
                      )}
                    />

                    {/* Icon Box */}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 sm:h-11 sm:w-11",
                        isActive
                          ? "bg-primary/15 text-primary ring-primary/30 shadow-xs ring-1"
                          : "bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Title & Expandable Description */}
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "text-base font-medium transition-colors duration-300 sm:text-lg",
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {feature.title}
                      </div>

                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{
                              opacity: 1,
                              height: "auto",
                              transition: {
                                duration: 0.28,
                                delay: 0.05,
                                ease: [0.16, 1, 0.3, 1],
                              },
                            }}
                            exit={{
                              opacity: 0,
                              height: 0,
                              transition: { duration: 0.18, ease: "easeIn" },
                            }}
                            className="text-muted-foreground mt-1 overflow-hidden text-xs leading-relaxed sm:text-sm"
                          >
                            {feature.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </Button>
                )
              })}
            </div>

            {/* Right Column: Balanced Live Stage Showcase */}
            <div className="bg-muted/40 dark:bg-card/60 border-border/70 relative flex min-h-95 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border p-4 shadow-xs sm:min-h-110 sm:rounded-3xl sm:p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature.id}
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      duration: 0.35,
                      delay: 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    },
                  }}
                  exit={{
                    opacity: 0,
                    y: -12,
                    scale: 0.97,
                    transition: { duration: 0.2, ease: "easeIn" },
                  }}
                  className="flex w-full flex-col items-center"
                >
                  {/* Status Pill */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className="bg-muted/80 text-foreground border-border/80 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
                      <span className="bg-primary h-2 w-2 animate-pulse rounded-full" />
                      {activeFeature.badge}
                    </span>
                  </div>

                  {/* Mockup Display */}
                  <div className="flex w-full justify-center">
                    <ActiveMockup />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Features
