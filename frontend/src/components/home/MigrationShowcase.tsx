import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Radio,
  Sparkles,
  ArrowRightLeft,
  Activity,
  Timer,
  Zap,
  Terminal,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"

const schemaMappings = [
  { source: "VARCHAR(255)", target: "String" },
  { source: "INTEGER", target: "NumberInt" },
  { source: "TIMESTAMP", target: "ISODate" },
  { source: "JSONB", target: "Object" },
  { source: "BOOLEAN", target: "Boolean" },
]

export const MigrationShowcase = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  // Dynamic state for interactive schema row highlighting
  const [activeMappingIndex, setActiveMappingIndex] = useState(0)

  // Dynamic state for live streaming telemetry simulation
  const [rowCount, setRowCount] = useState(7842)
  const [rate, setRate] = useState(784)

  // Cycle highlighted schema mapping every 2.4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveMappingIndex((prev) => (prev + 1) % schemaMappings.length)
    }, 2400)
    return () => clearInterval(timer)
  }, [])

  // Simulate live row ingestion and fluctuating rate
  useEffect(() => {
    const interval = setInterval(() => {
      setRowCount((prev) => {
        if (prev >= 9880) return 7250
        return prev + Math.floor(Math.random() * 16) + 9
      })
      setRate(776 + Math.floor(Math.random() * 18))
    }, 380)
    return () => clearInterval(interval)
  }, [])

  const currentBatch = Math.floor(rowCount / 500)
  const percentComplete = Math.min(100, (rowCount / 10000) * 100).toFixed(1)

  const handleStartMigration = () => {
    navigate(isAuthenticated ? "/dashboard" : "/sign-up")
  }

  return (
    <section className="relative z-10 mx-auto mt-32 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* Section Headline with Scroll Fade */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-3xl text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Intelligent Data Pipeline</span>
        </div>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Automated Translation. Live Execution.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          From automated schema inference to real-time streaming telemetry —
          experience database migration engineered for zero friction.
        </p>
      </motion.div>

      <div className="mt-16 space-y-16 lg:space-y-24">
        {/* ─── Part 1: Schema Intelligence / Smart Schema Mapping ───────────────── */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Visual: Interactive Schema Mapping Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="order-2 lg:order-1 lg:col-span-6"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-md transition-all hover:border-border hover:shadow-lg sm:p-7">
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-mac-close" />
                    <span className="h-2.5 w-2.5 rounded-full bg-mac-minimize" />
                    <span className="h-2.5 w-2.5 rounded-full bg-mac-maximize" />
                  </div>

                  <span className="text-sm font-bold tracking-tight text-foreground">
                    Schema Mapping
                  </span>
                </div>
              </div>

              {/* Source -> Target Subheader */}
              <div className="mt-4 flex items-center justify-between px-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                <span>Relational Source (SQL)</span>
                <span>Document Target (NoSQL)</span>
              </div>

              {/* Animated Translation Rows */}
              <div className="mt-3 space-y-2.5">
                {schemaMappings.map((mapping, idx) => {
                  const isHighlighted = idx === activeMappingIndex
                  return (
                    <div
                      key={mapping.source}
                      onMouseEnter={() => setActiveMappingIndex(idx)}
                      className={cn(
                        "group flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-300",
                        isHighlighted
                          ? "border-primary/40 bg-primary/5 shadow-xs"
                          : "border-border/60 bg-muted/30 hover:border-primary/20 hover:bg-muted/50"
                      )}
                    >
                      <div className="font-mono text-xs font-semibold text-foreground">
                        <span
                          className={cn(
                            "rounded-md border px-2.5 py-1 transition-colors",
                            isHighlighted
                              ? "border-primary/30 bg-card text-foreground"
                              : "border-border/70 bg-card text-foreground"
                          )}
                        >
                          {mapping.source}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "flex items-center gap-1.5 transition-all duration-300",
                          isHighlighted
                            ? "translate-x-0.5 text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                      </div>

                      <div className="font-mono text-xs font-semibold">
                        <span
                          className={cn(
                            "rounded-md border px-2.5 py-1 transition-all duration-300",
                            isHighlighted
                              ? "border-primary bg-primary text-primary-foreground shadow-xs shadow-primary/20"
                              : "border-primary/25 bg-primary/10 text-primary"
                          )}
                        >
                          {mapping.target}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Card Footer Status */}
              <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 text-success">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="font-medium">
                    100% type compatibility verified
                  </span>
                </div>
                <span className="hidden font-mono text-[11px] sm:inline">
                  Auto-sync active
                </span>
              </div>
            </div>
          </motion.div>

          {/* Narrative: Schema Intelligence */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="order-1 lg:order-2 lg:col-span-6"
          >
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase">
              <Cpu className="h-4 w-4" />
              <span>Schema Intelligence</span>
            </div>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Smart Schema Mapping
            </h3>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Seasyn automatically introspects your source database and maps
              column types, relationships, and indexes to the destination. SQL
              to NoSQL and back — without manual configuration or guesswork.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-foreground/90">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>
                  Automatic type coercion across disparate database paradigms
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>
                  Preserves complex structures including JSONB, arrays, and
                  nested objects
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>
                  Full preview and custom override control before committing
                  transforms
                </span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* ─── Part 2: Live Monitoring / Real-time Streaming ───────────────────── */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Narrative: Live Monitoring */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-6"
          >
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-success uppercase">
              <Radio className="h-4 w-4 animate-pulse text-success" />
              <span>Live Monitoring</span>
            </div>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Real-time Streaming
            </h3>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Watch your migration happen live. SSE-powered streaming logs,
              animated progress bars, and row-by-row tracking give you full
              visibility into every batch — no page refreshes needed.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleStartMigration}
                className="group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-5 text-sm font-semibold shadow-sm transition-all"
              >
                <span>Start Free Migration</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>

          {/* Visual: Live Migration Streaming Card with Active Counter */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-6"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-md transition-all hover:border-border hover:shadow-lg sm:p-7">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-mac-close" />
                    <span className="h-2.5 w-2.5 rounded-full bg-mac-minimize" />
                    <span className="h-2.5 w-2.5 rounded-full bg-mac-maximize" />
                  </div>

                  <span className="text-sm font-bold tracking-tight text-foreground">
                    Live Migration
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-muted/40 px-2.5 py-1 font-mono text-xs text-foreground">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
                  <span className="font-semibold">users table</span>
                </div>
              </div>

              {/* Progress Section */}
              <div className="mt-6 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">
                    Migration Progress
                  </span>
                  <span className="font-mono text-foreground transition-all">
                    {rowCount.toLocaleString()} / 10,000 rows
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
                <div className="flex justify-end text-[11px] font-medium text-muted-foreground">
                  <span>{percentComplete}% completed</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Zap className="h-3 w-3 text-primary" />
                    <span>Rate</span>
                  </div>
                  <div className="font-mono text-lg font-bold text-foreground">
                    {rate}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    rows/sec
                  </div>
                </div>

                <div className="space-y-1 border-x border-border/60 px-2">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Timer className="h-3 w-3 text-info" />
                    <span>Duration</span>
                  </div>
                  <div className="font-mono text-lg font-bold text-foreground">
                    00:12
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    elapsed
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Activity className="h-3 w-3 text-success" />
                    <span>ETA</span>
                  </div>
                  <div className="font-mono text-lg font-bold text-foreground">
                    ~3s
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    remaining
                  </div>
                </div>
              </div>

              {/* Streaming Logs Console */}
              <div className="mt-5 space-y-2 rounded-xl border border-border/70 bg-secondary p-3.5 font-mono text-xs text-secondary-foreground">
                <div className="flex items-center justify-between border-b border-border/40 pb-2 text-[10px] tracking-wider text-muted-foreground uppercase">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3 w-3" />
                    <span>Real-time SSE Event Stream</span>
                  </div>
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="h-2 w-2 rounded-full bg-mac-close/90" />
                    <span className="h-2 w-2 rounded-full bg-mac-minimize/90" />
                    <span className="h-2 w-2 rounded-full bg-mac-maximize/90" />
                  </div>
                </div>
                <div className="space-y-1 pt-1">
                  <div className="text-muted-foreground transition-all">
                    [INFO] Batch {currentBatch} committed (500 rows)
                  </div>
                  <div className="text-info transition-all">
                    [INFO] Batch {currentBatch + 1} streaming...
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                    <span className="font-medium">
                      [LIVE] Processing row {rowCount.toLocaleString()}...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default MigrationShowcase
