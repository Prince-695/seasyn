import { motion } from "framer-motion"
import { NavLink } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Sparkles, Activity } from "lucide-react"

interface FeatureBlock {
  badge: string
  badgeIcon: React.ReactNode
  heading: string
  description: string
  reversed?: boolean
  visual: React.ReactNode
}

const SchemaVisual = () => (
  <div className="overflow-hidden border border-border bg-card shadow-md">
    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
      <div className="h-3 w-3 rounded-full bg-primary" />
      <div className="h-3 w-3 rounded-full bg-accent" />
      <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
      <span className="ml-3 text-xs text-muted-foreground">Schema Mapping</span>
    </div>
    <div className="p-5">
      {/* Source → Dest mapping visualization */}
      <div className="space-y-3 font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="w-28 text-muted-foreground">VARCHAR(255)</span>
          <span className="text-primary">→</span>
          <span className="border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary">
            String
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-28 text-muted-foreground">INTEGER</span>
          <span className="text-primary">→</span>
          <span className="border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary">
            NumberInt
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-28 text-muted-foreground">TIMESTAMP</span>
          <span className="text-primary">→</span>
          <span className="border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary">
            ISODate
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-28 text-muted-foreground">JSONB</span>
          <span className="text-primary">→</span>
          <span className="border border-accent/30 bg-accent/10 px-2 py-0.5 text-accent-foreground">
            Object
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-28 text-muted-foreground">BOOLEAN</span>
          <span className="text-primary">→</span>
          <span className="border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary">
            Boolean
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3 text-accent" />
        <span>Auto-detected 5 column mappings</span>
      </div>
    </div>
  </div>
)

const StreamingVisual = () => (
  <div className="overflow-hidden border border-border bg-card shadow-md">
    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
      <div className="h-3 w-3 rounded-full bg-primary" />
      <div className="h-3 w-3 rounded-full bg-accent" />
      <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
      <span className="ml-3 text-xs text-muted-foreground">Live Migration</span>
    </div>
    <div className="p-5">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>users table</span>
          <span>7,842 / 10,000 rows</span>
        </div>
        <div className="h-2 w-full bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            whileInView={{ width: "78%" }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </div>
      </div>
      {/* Stats row */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="border border-border p-2 text-center">
          <p className="text-lg font-bold text-foreground">784</p>
          <p className="text-[10px] text-muted-foreground">rows/sec</p>
        </div>
        <div className="border border-border p-2 text-center">
          <p className="text-lg font-bold text-foreground">00:12</p>
          <p className="text-[10px] text-muted-foreground">elapsed</p>
        </div>
        <div className="border border-border p-2 text-center">
          <p className="text-lg font-bold text-foreground">~3s</p>
          <p className="text-[10px] text-muted-foreground">ETA</p>
        </div>
      </div>
      {/* Log lines */}
      <div className="space-y-1 font-mono text-xs text-muted-foreground">
        <p>
          <span className="text-accent">[INFO]</span> Batch 16 committed (500
          rows)
        </p>
        <p>
          <span className="text-accent">[INFO]</span> Batch 17 streaming...
        </p>
        <motion.p
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <span className="text-primary">[LIVE]</span> Processing row 7,842...
        </motion.p>
      </div>
    </div>
  </div>
)

const FEATURES: FeatureBlock[] = [
  {
    badge: "Schema Intelligence",
    badgeIcon: <Sparkles className="h-4 w-4" />,
    heading: "Smart Schema Mapping",
    description:
      "Seasyn automatically introspects your source database and maps column types, relationships, and indexes to the destination. SQL to NoSQL and back — without manual configuration or guesswork.",
    visual: <SchemaVisual />,
  },
  {
    badge: "Live Monitoring",
    badgeIcon: <Activity className="h-4 w-4" />,
    heading: "Real-time Streaming",
    description:
      "Watch your migration happen live. SSE-powered streaming logs, animated progress bars, and row-by-row tracking give you full visibility into every batch — no page refreshes needed.",
    reversed: true,
    visual: <StreamingVisual />,
  },
]

export const FeatureHighlight = () => {
  return (
    <section className="w-full bg-background px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl space-y-24 md:space-y-32">
        {FEATURES.map((feature, index) => (
          <motion.div
            key={index}
            className={`grid items-center gap-12 lg:grid-cols-2 ${
              feature.reversed ? "lg:direction-rtl" : ""
            }`}
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            {/* Visual */}
            <div
              className={`${feature.reversed ? "lg:direction-ltr lg:order-2" : ""}`}
            >
              {feature.visual}
            </div>

            {/* Text */}
            <div
              className={`flex flex-col ${feature.reversed ? "lg:direction-ltr lg:order-1" : ""}`}
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground">
                  {feature.badgeIcon}
                  {feature.badge}
                </span>
              </div>

              <h3 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                <span className="font-serif italic">{feature.heading}</span>
              </h3>

              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                {feature.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <NavLink to="/sign-up">
                  <Button
                    variant="outline"
                    className="h-10 rounded-full px-6 text-sm"
                  >
                    Try Seasyn
                  </Button>
                </NavLink>
                <NavLink to="/docs">
                  <Button
                    variant="outline"
                    className="h-10 rounded-full px-6 text-sm"
                  >
                    Learn More
                  </Button>
                </NavLink>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default FeatureHighlight
