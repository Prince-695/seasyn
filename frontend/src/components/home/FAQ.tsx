import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScrollRevealText } from "@/components/ui/scroll-reveal-text"

const faqData = [
  {
    question: "How does Seasyn ensure zero downtime during migration?",
    answer:
      "Seasyn utilizes non-blocking read streams with cursor-based pagination and change-data-capture (CDC) semantics. Your production source database continues servicing queries normally while data is streamed directly to the destination without locking tables.",
  },
  {
    question:
      "Are database credentials or table records stored on your servers?",
    answer:
      "Never. Seasyn operates with a strictly stateless architecture. Ephemeral connection secrets exist solely in volatile memory during the active session, and records stream socket-to-socket over TLS 1.3 without touching disk storage.",
  },
  {
    question: "How does automatic schema translation handle SQL to NoSQL?",
    answer:
      "Our introspection engine analyzes relational tables, constraints, foreign keys, and indexes, converting them into optimized document structures (e.g. SQL UUID to BSON ObjectId, JSONB to nested objects). You retain full granular control to override mappings before running.",
  },
  {
    question: "What happens if a network interruption occurs during migration?",
    answer:
      "Seasyn employs deterministic batch checkpointing. If a connection drops, the engine resumes from the last successfully committed batch ID rather than restarting from zero, preventing duplicate rows and wasted bandwidth.",
  },
  {
    question: "Which databases and versions are currently supported?",
    answer:
      "Seasyn natively supports PostgreSQL (12+), MySQL (8.0+), MongoDB (5.0+), and SQLite (3.x). We are actively expanding engine adapters to include Redis, ClickHouse, and Snowflake in upcoming releases.",
  },
  {
    question: "Do I need to install any background daemons or agents?",
    answer:
      "No. Seasyn is 100% agentless. It connects directly via standard database wire protocols. There are no kernel modules, sidecars, or persistent daemons to manage or configure on your servers.",
  },
]

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="relative z-10 mx-auto mt-36 flex w-full max-w-5xl flex-col items-center justify-center px-6">
      {/* Header with ScrollRevealText */}
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="bg-secondary text-secondary-foreground mb-3 inline-flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-semibold shadow-2xs">
          FAQ
        </div>

        <ScrollRevealText
          as="h2"
          lines={["Frequently Asked", "Questions."]}
          className="text-foreground font-serif text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl sm:leading-[1.05] md:text-6xl md:leading-[1.05]"
          lineClassName="font-serif leading-[1.05]"
        />

        <p className="text-muted-foreground mt-3 max-w-xl text-base leading-snug sm:text-lg">
          Everything you need to know about our stateless architecture,
          security, and migration guarantees.
        </p>
      </div>

      <div className="relative flex w-full flex-col gap-3.5">
        {/* Decorative background glows */}
        <div className="bg-primary/5 pointer-events-none absolute top-1/4 left-[-10%] -z-10 h-72 w-72 rounded-full blur-[120px]" />
        <div className="bg-secondary/5 pointer-events-none absolute right-[-10%] bottom-1/4 -z-10 h-72 w-72 rounded-full blur-[120px]" />

        {faqData.map((item, index) => {
          const isOpen = openIndex === index

          return (
            <div
              key={item.question}
              className={cn(
                "group border-border/80 bg-card overflow-hidden rounded-xl border transition-all duration-300",
                isOpen
                  ? "border-primary/40 shadow-sm"
                  : "hover:border-border hover:bg-card/80"
              )}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggleItem(index)}
                className="flex h-auto w-full items-center justify-between gap-4 p-4 text-left hover:bg-transparent sm:p-5"
              >
                <span
                  className={cn(
                    "text-base font-semibold transition-colors duration-200 sm:text-lg",
                    isOpen
                      ? "text-primary"
                      : "text-foreground group-hover:text-primary"
                  )}
                >
                  {item.question}
                </span>
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-300",
                    isOpen
                      ? "border-primary bg-primary text-primary-foreground rotate-180 shadow-xs"
                      : "border-border bg-muted/50 text-foreground group-hover:border-primary/50 group-hover:text-primary"
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>
              </Button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                      open: { opacity: 1, height: "auto" },
                      collapsed: { opacity: 0, height: 0 },
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="overflow-hidden"
                  >
                    <div className="text-muted-foreground px-4 pb-5 sm:px-5">
                      <div className="border-border/50 border-t pt-3.5">
                        <p className="text-sm leading-relaxed sm:text-base">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default FAQ
