import { Activity } from "lucide-react"
import { ScrollRevealText } from "@/components/ui/scroll-reveal-text"
import { SecurityMockup } from "./features/SecurityMockup"
import { IntegrationsMockup } from "./features/IntegrationsMockup"
import { SchemaTranslationMockup } from "./features/SchemaTranslationMockup"
import { TelemetryStreamMockup } from "./features/TelemetryStreamMockup"

const FIRST_THREE_CARDS = [
  {
    title: "Stateless Security",
    description:
      "Per-request ephemeral credentials guarantee total privacy with zero data stored on middle-man servers.",
    mockup: SecurityMockup,
  },
  {
    title: "Universal Compatibility",
    description:
      "Move data seamlessly between PostgreSQL, MySQL, MongoDB, and SQLite with zero vendor lock-in.",
    mockup: IntegrationsMockup,
  },
  {
    title: "Schema Translation",
    description:
      "Automatic introspection discovers foreign keys, relationships, and types, instantly mapping SQL & NoSQL.",
    mockup: SchemaTranslationMockup,
  },
]

export const Features = () => {
  return (
    <section className="z-10 mt-40 w-full max-w-6xl px-6">
      {/* Section Header */}
      <div className="mb-10 flex flex-col items-center justify-center text-center md:mb-12">
        <div className="bg-secondary text-secondary-foreground mb-1 inline-flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-semibold shadow-2xs">
          Features
        </div>

        <ScrollRevealText
          as="h2"
          lines={[
            "Effortless database migrations,",
            "built for zero downtime.",
          ]}
          className="text-foreground font-serif text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl sm:leading-[1.05] md:text-6xl md:leading-[1.05]"
          lineClassName="font-serif leading-[1.05]"
        />

        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-snug sm:text-lg">
          Intelligent schema introspection, cross-paradigm translation, and
          high-velocity streaming with zero data retention.
        </p>
      </div>

      {/* Row 1: First 3 Cards in the Same Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {FIRST_THREE_CARDS.map((card) => {
          const MockupComponent = card.mockup
          return (
            <div
              key={card.title}
              className="bg-card border-border/80 flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-colors sm:p-5"
            >
              <MockupComponent />

              <div className="mt-3.5 text-center">
                <h3 className="text-foreground font-serif text-lg leading-tight font-bold tracking-tight sm:text-xl">
                  {card.title}
                </h3>
                <p className="text-muted-foreground mx-auto mt-1 max-w-xs text-xs leading-snug sm:text-[13px]">
                  {card.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Row 2: 4th Card in Next Row (Horizontal Layout) */}
      <div className="bg-card border-border/80 mt-6 flex flex-col items-center justify-between gap-6 rounded-2xl border p-5 shadow-xs transition-colors md:flex-row md:p-6">
        <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
          <div className="bg-primary/10 text-primary mb-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold">
            <Activity className="h-3.5 w-3.5" />
            <span>High-Velocity Engine</span>
          </div>

          <h3 className="text-foreground font-serif text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
            High-Throughput Streaming & Telemetry
          </h3>
          <p className="text-muted-foreground mt-1.5 max-w-lg text-sm leading-snug sm:text-base">
            High-performance data streaming ensures even multi-gigabyte
            databases migrate with minimal RAM overhead, sub-millisecond
            latency, and live telemetry tracking.
          </p>
        </div>

        <div className="w-full md:w-1/2 lg:w-5/12">
          <TelemetryStreamMockup />
        </div>
      </div>
    </section>
  )
}

export default Features
