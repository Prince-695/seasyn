import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plug,
  GitMerge,
  Radio,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRightLeft,
  Activity,
  Terminal,
} from "lucide-react"
import { SiPostgresql, SiMongodb } from "react-icons/si"
import { cn } from "@/lib/utils"
import { ScrollRevealText } from "@/components/ui/scroll-reveal-text"

const steps = [
  {
    id: "connect",
    stepNumber: "01",
    label: "Connect",
    icon: Plug,
    tagline: "Agentless TLS Handshake",
    title: "Direct TLS Handshake",
    description:
      "Connect securely with temporary credentials. Zero agents, daemons, or persistent storage required.",
    badges: ["Zero Data at Rest", "TLS 1.3 Encrypted"],
  },
  {
    id: "map",
    stepNumber: "02",
    label: "Synthesize",
    icon: GitMerge,
    tagline: "Automated Schema Translation",
    title: "Automated Type Coercion",
    description:
      "Deep schema introspection maps SQL and NoSQL types with foreign key order preservation.",
    badges: ["SQL ↔ NoSQL Bridge", "Instant Type Validation"],
  },
  {
    id: "stream",
    stepNumber: "03",
    label: "Stream",
    icon: Radio,
    tagline: "Live Execution & Checksums",
    title: "Zero-Downtime Streaming",
    description:
      "Memory-only cursor streaming with continuous batch checkpoints and row-by-row checksums.",
    badges: ["38 MB RAM Ceiling", "Auto-Resume Checkpoints"],
  },
]

const mappingRows = [
  { source: "UUID", target: "ObjectId", note: "Auto-coerced" },
  { source: "JSONB", target: "Object", note: "Preserved" },
  { source: "TIMESTAMP", target: "ISODate", note: "Normalized" },
  { source: "VARCHAR(255)", target: "String", note: "Mapped" },
]

export const HowItWorks = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const activeStep = steps[activeStepIndex]

  return (
    <section className="relative z-10 mx-auto mt-36 w-full max-w-6xl px-6">
      {/* Section Header with ScrollRevealText */}
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="bg-secondary text-secondary-foreground mb-2 inline-flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-semibold shadow-2xs">
          Workflow
        </div>

        <ScrollRevealText
          as="h2"
          lines={["Simple to start.", "Built to scale."]}
          className="text-foreground font-serif text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl sm:leading-[1.05] md:text-6xl md:leading-[1.05]"
          lineClassName="font-serif leading-[1.05]"
        />

        <p className="text-muted-foreground mt-3 max-w-xl text-base leading-snug sm:text-lg">
          Three streamlined phases from connection handshake to verified
          migration.
        </p>
      </div>

      {/* Step Selector Pills */}
      <div className="border-border/80 bg-card mx-auto mb-8 flex max-w-lg items-center justify-center gap-2 rounded-xl border p-1.5 shadow-xs">
        {steps.map((step, idx) => {
          const isActive = idx === activeStepIndex
          const Icon = step.icon
          return (
            <button
              key={step.id}
              onClick={() => setActiveStepIndex(idx)}
              className={cn(
                "group relative flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <span
                className={cn(
                  "font-mono text-[10px] sm:text-xs",
                  isActive
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                )}
              >
                {step.stepNumber}
              </span>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          )
        })}
      </div>

      {/* Interactive Step Content Box (Compact, Minimal Text) */}
      <div className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 items-center gap-6 p-6 sm:p-7 md:grid-cols-12 md:gap-10 lg:p-8"
          >
            {/* Left Column: Minimal Narrative */}
            <div className="flex flex-col md:col-span-5">
              <div className="text-primary mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
                <activeStep.icon className="h-3.5 w-3.5" />
                <span>{activeStep.tagline}</span>
              </div>

              <h3 className="text-foreground font-serif text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
                {activeStep.title}
              </h3>

              <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed">
                {activeStep.description}
              </p>

              {/* Minimal Badges */}
              <div className="mt-5 flex flex-wrap gap-2">
                {activeStep.badges.map((badge) => (
                  <span
                    key={badge}
                    className="border-border/70 bg-muted/40 text-foreground/90 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium"
                  >
                    <CheckCircle2 className="text-primary h-3.5 w-3.5" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Column: Dynamic Phase Mockup */}
            <div className="md:col-span-7">
              {activeStepIndex === 0 && (
                /* Step 1 Mockup: Direct TLS Handshake */
                <div className="border-border/80 bg-muted/30 rounded-xl border p-4 sm:p-5">
                  <div className="border-border/60 mb-3 flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-mac-close h-2.5 w-2.5 rounded-full" />
                      <span className="bg-mac-minimize h-2.5 w-2.5 rounded-full" />
                      <span className="bg-mac-maximize h-2.5 w-2.5 rounded-full" />
                    </div>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      tls_handshake.proto
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Source Endpoint */}
                    <div className="border-border bg-card flex items-center justify-between rounded-lg border p-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="bg-info/10 text-info flex h-8 w-8 items-center justify-center rounded-md">
                          <SiPostgresql className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-foreground text-xs font-semibold">
                            PostgreSQL Source
                          </div>
                          <div className="text-muted-foreground font-mono text-[10px]">
                            postgres://prod-db.internal:5432/core
                          </div>
                        </div>
                      </div>
                      <div className="bg-success/10 text-success inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                        <span className="bg-success h-1.5 w-1.5 animate-pulse rounded-full" />
                        Connected
                      </div>
                    </div>

                    {/* Bridge Indicator */}
                    <div className="relative flex items-center justify-center py-1">
                      <div className="absolute inset-0 flex items-center">
                        <div className="border-border w-full border-t border-dashed" />
                      </div>
                      <div className="border-secondary/40 bg-secondary/10 text-secondary relative inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] font-medium">
                        <Lock className="h-3 w-3" />
                        <span>Ephemeral TLS 1.3 Tunnel (1.2 ms)</span>
                      </div>
                    </div>

                    {/* Target Endpoint */}
                    <div className="border-border bg-card flex items-center justify-between rounded-lg border p-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="bg-accent/10 text-accent flex h-8 w-8 items-center justify-center rounded-md">
                          <SiMongodb className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-foreground text-xs font-semibold">
                            MongoDB Destination
                          </div>
                          <div className="text-muted-foreground font-mono text-[10px]">
                            mongodb+srv://cluster0.atlas.net/prod
                          </div>
                        </div>
                      </div>
                      <div className="bg-success/10 text-success inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                        <span className="bg-success h-1.5 w-1.5 rounded-full" />
                        Target Ready
                      </div>
                    </div>
                  </div>

                  <div className="border-border/50 text-muted-foreground mt-4 flex items-center justify-between border-t pt-3 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="text-secondary h-3.5 w-3.5" />
                      Zero Data at Rest
                    </span>
                    <span>No Daemons Required</span>
                  </div>
                </div>
              )}

              {activeStepIndex === 1 && (
                /* Step 2 Mockup: Type Translation Bridge */
                <div className="border-border/80 bg-muted/30 rounded-xl border p-4 sm:p-5">
                  <div className="border-border/60 mb-3 flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-mac-close h-2.5 w-2.5 rounded-full" />
                      <span className="bg-mac-minimize h-2.5 w-2.5 rounded-full" />
                      <span className="bg-mac-maximize h-2.5 w-2.5 rounded-full" />
                    </div>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      schema_introspection.diff
                    </span>
                  </div>

                  <div className="text-muted-foreground mb-2 flex items-center justify-between px-1 text-[10px] font-semibold tracking-wider uppercase">
                    <span>Source (Relational)</span>
                    <span>Target (Document)</span>
                  </div>

                  <div className="space-y-2">
                    {mappingRows.map((row) => (
                      <div
                        key={row.source}
                        className="border-border bg-card flex items-center justify-between rounded-lg border px-3 py-2 text-xs shadow-2xs"
                      >
                        <span className="bg-muted text-foreground rounded px-2 py-0.5 font-mono text-[11px] font-medium">
                          {row.source}
                        </span>
                        <div className="text-primary flex items-center gap-1">
                          <ArrowRightLeft className="h-3 w-3" />
                          <span className="text-muted-foreground font-mono text-[10px]">
                            {row.note}
                          </span>
                        </div>
                        <span className="bg-primary/10 text-primary rounded px-2 py-0.5 font-mono text-[11px] font-semibold">
                          {row.target}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-border/50 text-muted-foreground mt-4 flex items-center justify-between border-t pt-3 text-[11px]">
                    <span className="text-success flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      100% Type Compatibility Verified
                    </span>
                    <span className="font-mono text-[10px]">
                      FK Order: Verified
                    </span>
                  </div>
                </div>
              )}

              {activeStepIndex === 2 && (
                /* Step 3 Mockup: In-Flight Streaming & Checksum */
                <div className="border-border/80 bg-muted/30 rounded-xl border p-4 sm:p-5">
                  <div className="border-border/60 mb-3 flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-mac-close h-2.5 w-2.5 rounded-full" />
                      <span className="bg-mac-minimize h-2.5 w-2.5 rounded-full" />
                      <span className="bg-mac-maximize h-2.5 w-2.5 rounded-full" />
                    </div>
                    <div className="text-success flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="bg-success h-1.5 w-1.5 animate-pulse rounded-full" />
                      <span>STREAM_ACTIVE</span>
                    </div>
                  </div>

                  {/* Streaming Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-medium">
                        Table: accounts
                      </span>
                      <span className="text-primary font-mono font-semibold">
                        87.4% (87,400 / 100,000)
                      </span>
                    </div>
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div className="bg-primary h-full w-[87.4%] rounded-full transition-all duration-300" />
                    </div>
                  </div>

                  {/* Telemetry Grid */}
                  <div className="border-border/60 bg-card mt-3.5 grid grid-cols-3 gap-2 rounded-lg border p-2.5 text-center text-xs">
                    <div>
                      <div className="text-muted-foreground flex items-center justify-center gap-1 text-[10px]">
                        <Zap className="text-primary h-3 w-3" />
                        <span>Speed</span>
                      </div>
                      <div className="text-foreground font-mono font-bold">
                        94,200/s
                      </div>
                    </div>
                    <div className="border-border/60 border-x px-1">
                      <div className="text-muted-foreground flex items-center justify-center gap-1 text-[10px]">
                        <Activity className="text-secondary h-3 w-3" />
                        <span>RAM</span>
                      </div>
                      <div className="text-foreground font-mono font-bold">
                        38 MB
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground flex items-center justify-center gap-1 text-[10px]">
                        <ShieldCheck className="text-success h-3 w-3" />
                        <span>Checksum</span>
                      </div>
                      <div className="text-success font-mono font-bold">
                        CRC32 OK
                      </div>
                    </div>
                  </div>

                  {/* SSE Terminal Console */}
                  <div className="border-border bg-card/90 text-muted-foreground mt-3 rounded-lg border p-2.5 font-mono text-[10px]">
                    <div className="text-muted-foreground/70 mb-1 flex items-center gap-1.5">
                      <Terminal className="h-3 w-3" />
                      <span>SSE Live Event Pipe</span>
                    </div>
                    <div className="text-muted-foreground">
                      [12:44:02] Batch #174 committed (500 rows)
                    </div>
                    <div className="text-info">
                      [12:44:02] Batch #175 streaming in volatile buffer...
                    </div>
                    <div className="text-success flex items-center gap-1">
                      <span className="bg-success h-1 w-1 animate-pulse rounded-full" />
                      <span>
                        [12:44:03] Checksum verified: 87,400 rows match origin
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

export default HowItWorks
