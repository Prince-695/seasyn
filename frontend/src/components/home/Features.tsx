import { useState } from "react"
import {
  ShieldCheck,
  Zap,
  Lock,
  MousePointer,
  GripVertical,
  ArrowRight,
  Activity,
  Database,
} from "lucide-react"
import { SiPostgresql, SiMysql, SiMongodb } from "react-icons/si"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ScrollRevealText } from "@/components/ui/scroll-reveal-text"

/* =========================================================================
   Mockup 1: Stateless & Agentless Architecture (Compact & Static)
   ========================================================================= */
const SecurityMockup = () => {
  return (
    <div className="bg-muted/40 dark:bg-muted/15 border-border/40 relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-xl border p-3">
      {/* macOS Window Frame */}
      <div className="bg-card border-border relative w-full max-w-xs rounded-lg border p-2.5 shadow-sm">
        {/* macOS Window Controls */}
        <div className="mb-2 flex items-center gap-1.5">
          <span className="bg-mac-close h-2 w-2 rounded-full" />
          <span className="bg-mac-minimize h-2 w-2 rounded-full" />
          <span className="bg-mac-maximize h-2 w-2 rounded-full" />
        </div>

        {/* Feature Rows */}
        <div className="flex flex-col gap-1.5">
          {/* Row 1: Elevated Card with Pink Icon & Pointer Cursor (Static) */}
          <div className="bg-card border-border relative z-10 flex items-start gap-2.5 rounded-lg border p-2 shadow-md">
            <div className="bg-secondary text-secondary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-md shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-foreground truncate text-[11px] font-semibold">
                Ephemeral Credentials
              </h4>
              <p className="text-muted-foreground truncate text-[10px] leading-tight">
                Zero data retention — 100% in-flight
              </p>
            </div>

            {/* Static Mouse Pointer Cursor */}
            <div className="pointer-events-none absolute -right-1.5 -bottom-1.5 drop-shadow-sm">
              <MousePointer className="fill-foreground/20 text-foreground h-3.5 w-3.5" />
            </div>
          </div>

          {/* Row 2: Agentless Connection */}
          <div className="bg-muted/50 border-border/40 flex items-start gap-2.5 rounded-lg border p-1.5 px-2">
            <div className="bg-primary/15 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-foreground truncate text-[11px] font-semibold">
                Zero Configuration
              </h4>
              <p className="text-muted-foreground truncate text-[10px] leading-tight">
                Direct connections without agents
              </p>
            </div>
          </div>

          {/* Row 3: Centralized Governance */}
          <div className="bg-muted/50 border-border/40 flex items-start gap-2.5 rounded-lg border p-1.5 px-2">
            <div className="bg-accent/15 text-accent flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
              <Lock className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-foreground truncate text-[11px] font-semibold">
                Centralized Governance
              </h4>
              <p className="text-muted-foreground truncate text-[10px] leading-tight">
                TLS 1.3 encrypted streaming
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   Mockup 2: Universal Compatibility (Compact & Static with Interactive Toggles)
   ========================================================================= */
const IntegrationsMockup = () => {
  const [activeEngines, setActiveEngines] = useState({
    postgres: true,
    mongodb: true,
    mysql: false,
  })

  const toggleEngine = (key: keyof typeof activeEngines) => {
    setActiveEngines((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="bg-muted/40 dark:bg-muted/15 border-border/40 relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-xl border p-3">
      <div className="bg-card border-border flex w-full max-w-xs flex-col gap-2 rounded-lg border p-2.5 shadow-sm">
        {/* Top "+ Add new integration" Button */}
        <button
          type="button"
          className="border-border hover:border-primary/40 hover:text-primary bg-muted/20 text-muted-foreground flex w-full cursor-pointer items-center justify-center gap-1 rounded-md border border-dashed px-2 py-1 text-[11px] font-medium transition-colors"
        >
          <span className="text-xs leading-none">+</span>
          <span>Add new integration</span>
        </button>

        {/* Database Engine Rows */}
        <div className="flex flex-col gap-1.5">
          {/* PostgreSQL */}
          <div className="bg-muted/40 border-border/50 flex items-center justify-between rounded-lg border p-1.5 px-2">
            <div className="flex items-center gap-2">
              <GripVertical className="text-muted-foreground/40 h-3 w-3 shrink-0" />
              <div className="bg-info/10 flex h-6 w-6 items-center justify-center rounded-md">
                <SiPostgresql className="text-info h-3.5 w-3.5" />
              </div>
              <span className="text-foreground text-[11px] font-semibold">
                PostgreSQL
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleEngine("postgres")}
              className={cn(
                "relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200",
                activeEngines.postgres
                  ? "bg-accent"
                  : "bg-input dark:bg-input/80"
              )}
            >
              <span
                className={cn(
                  "bg-background block h-3 w-3 rounded-full shadow-xs transition-transform duration-200",
                  activeEngines.postgres ? "translate-x-3" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* MongoDB */}
          <div className="bg-muted/40 border-border/50 flex items-center justify-between rounded-lg border p-1.5 px-2">
            <div className="flex items-center gap-2">
              <GripVertical className="text-muted-foreground/40 h-3 w-3 shrink-0" />
              <div className="bg-success/10 flex h-6 w-6 items-center justify-center rounded-md">
                <SiMongodb className="text-success h-3.5 w-3.5" />
              </div>
              <span className="text-foreground text-[11px] font-semibold">
                MongoDB
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleEngine("mongodb")}
              className={cn(
                "relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200",
                activeEngines.mongodb
                  ? "bg-accent"
                  : "bg-input dark:bg-input/80"
              )}
            >
              <span
                className={cn(
                  "bg-background block h-3 w-3 rounded-full shadow-xs transition-transform duration-200",
                  activeEngines.mongodb ? "translate-x-3" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* MySQL */}
          <div className="bg-muted/40 border-border/50 flex items-center justify-between rounded-lg border p-1.5 px-2">
            <div className="flex items-center gap-2">
              <GripVertical className="text-muted-foreground/40 h-3 w-3 shrink-0" />
              <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-md">
                <SiMysql className="text-primary h-3.5 w-3.5" />
              </div>
              <span className="text-foreground text-[11px] font-semibold">
                MySQL
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleEngine("mysql")}
              className={cn(
                "relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200",
                activeEngines.mysql ? "bg-accent" : "bg-input dark:bg-input/80"
              )}
            >
              <span
                className={cn(
                  "bg-background block h-3 w-3 rounded-full shadow-xs transition-transform duration-200",
                  activeEngines.mysql ? "translate-x-3" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   Mockup 3: Real-Time Schema Translation & Introspection (Compact & Static)
   ========================================================================= */
const SchemaTranslationMockup = () => {
  return (
    <div className="bg-muted/40 dark:bg-muted/15 border-border/40 relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-xl border p-3">
      <div className="bg-card border-border flex w-full max-w-xs flex-col gap-2 rounded-lg border p-2.5 shadow-sm">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Database className="text-primary h-3.5 w-3.5" />
            <span className="text-foreground text-[11px] font-semibold">
              Type Bridge
            </span>
          </div>
          <span className="bg-accent/15 text-accent inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold">
            <span className="bg-accent h-1.5 w-1.5 rounded-full" />
            Introspected
          </span>
        </div>

        {/* Translation Mappings List */}
        <div className="flex flex-col gap-1.5">
          {/* Mapping Item 1 */}
          <div className="bg-muted/40 border-border/50 flex items-center justify-between rounded-md border p-1.5 px-2 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="bg-info/15 text-info py-0.2 rounded px-1 font-mono text-[9px] font-bold">
                SQL
              </span>
              <span className="text-foreground font-mono font-medium">
                user_id: UUID
              </span>
            </div>
            <ArrowRight className="text-muted-foreground/60 h-3 w-3 shrink-0" />
            <div className="flex items-center gap-1">
              <span className="bg-success/15 text-success py-0.2 rounded px-1 font-mono text-[9px] font-bold">
                BSON
              </span>
              <span className="text-foreground font-mono font-medium">
                _id: ObjectId
              </span>
            </div>
          </div>

          {/* Mapping Item 2 */}
          <div className="bg-muted/40 border-border/50 flex items-center justify-between rounded-md border p-1.5 px-2 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="bg-info/15 text-info py-0.2 rounded px-1 font-mono text-[9px] font-bold">
                SQL
              </span>
              <span className="text-foreground font-mono font-medium">
                config: JSONB
              </span>
            </div>
            <ArrowRight className="text-muted-foreground/60 h-3 w-3 shrink-0" />
            <div className="flex items-center gap-1">
              <span className="bg-success/15 text-success py-0.2 rounded px-1 font-mono text-[9px] font-bold">
                BSON
              </span>
              <span className="text-foreground font-mono font-medium">
                config: Doc
              </span>
            </div>
          </div>

          {/* Mapping Item 3 */}
          <div className="bg-muted/40 border-border/50 flex items-center justify-between rounded-md border p-1.5 px-2 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="bg-info/15 text-info py-0.2 rounded px-1 font-mono text-[9px] font-bold">
                SQL
              </span>
              <span className="text-foreground font-mono font-medium">
                ts: TIMESTAMPTZ
              </span>
            </div>
            <ArrowRight className="text-muted-foreground/60 h-3 w-3 shrink-0" />
            <div className="flex items-center gap-1">
              <span className="bg-success/15 text-success py-0.2 rounded px-1 font-mono text-[9px] font-bold">
                BSON
              </span>
              <span className="text-foreground font-mono font-medium">
                ts: ISODate
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   Mockup 4: High-Throughput Streaming & Telemetry (Compact & Static)
   ========================================================================= */
const TelemetryStreamMockup = () => {
  return (
    <div className="bg-muted/40 dark:bg-muted/15 border-border/40 relative flex h-full min-h-[170px] w-full items-center justify-center overflow-hidden rounded-xl border p-3">
      <div className="bg-card border-border flex w-full max-w-md flex-col gap-2.5 rounded-lg border p-3.5 shadow-sm">
        {/* Header with Live Throughput */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-primary h-4 w-4 animate-pulse" />
            <span className="text-foreground text-xs font-semibold">
              Live Migration Stream
            </span>
          </div>
          <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold">
            <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
            125,480 rec/s
          </span>
        </div>

        {/* Progress Bar (Animated Live Streaming Motion) */}
        <div className="bg-muted/60 relative h-2.5 w-full overflow-hidden rounded-full">
          <motion.div
            initial={{ width: "30%" }}
            animate={{ width: ["30%", "85%", "30%"] }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="bg-primary h-full rounded-full"
          />
        </div>

        <div className="text-muted-foreground flex items-center justify-between text-[11px]">
          <span>Synchronizing records</span>
          <span className="text-foreground font-mono font-medium">
            2,450,000 / 3,000,000
          </span>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/40 border-border/50 rounded-lg border p-2">
            <span className="text-muted-foreground block text-[9px] font-semibold tracking-wider uppercase">
              RAM Overhead
            </span>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-foreground font-mono text-xs font-bold">
                38 MB
              </span>
              <span className="text-accent bg-accent/15 py-0.2 rounded px-1.5 text-[9px] font-bold">
                Adaptive
              </span>
            </div>
          </div>

          <div className="bg-muted/40 border-border/50 rounded-lg border p-2">
            <span className="text-muted-foreground block text-[9px] font-semibold tracking-wider uppercase">
              P99 Latency
            </span>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-foreground font-mono text-xs font-bold">
                0.4 ms
              </span>
              <span className="text-primary bg-primary/15 py-0.2 rounded px-1.5 text-[9px] font-bold">
                Real-time
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   Features Component: 3 Cards in Row 1 + 1 Horizontal Card in Row 2
   ========================================================================= */
const firstThreeCards = [
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
        {/* Pill Badge in shade of pink using existing secondary color variable */}
        <div className="bg-secondary text-secondary-foreground mb-1 inline-flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-semibold shadow-2xs">
          Features
        </div>

        {/* Scroll-Revealed Masked Kinetic Heading (Tighter line spacing) */}
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

      {/* Row 1: First 3 Cards in the Same Row (Tight line spacing, compact) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {firstThreeCards.map((card) => {
          const MockupComponent = card.mockup
          return (
            <div
              key={card.title}
              className="bg-card border-border/80 flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-colors sm:p-5"
            >
              {/* Top Compact Mockup */}
              <MockupComponent />

              {/* Bottom Content Area with decreased text spacing */}
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

      {/* Row 2: 4th Card in Next Row (Horizontal Layout, tight line spacing) */}
      <div className="bg-card border-border/80 mt-6 flex flex-col items-center justify-between gap-6 rounded-2xl border p-5 shadow-xs transition-colors md:flex-row md:p-6">
        {/* Left Side: Text Content */}
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

        {/* Right Side: Horizontal Telemetry Stream Mockup */}
        <div className="w-full md:w-1/2 lg:w-5/12">
          <TelemetryStreamMockup />
        </div>
      </div>
    </section>
  )
}

export default Features
