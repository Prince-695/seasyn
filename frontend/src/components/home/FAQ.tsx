import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { ScrollRevealText } from "@/components/ui/scroll-reveal-text"
import { cn } from "@/lib/utils"

const FAQ_ITEMS = [
  {
    id: "zero-downtime",
    question: "How does Seasyn ensure zero downtime during migration?",
    answer:
      "We stream and copy data in real-time continuous batches without locking any tables. Your production database stays fully operational and serves live customer queries without disruption.",
  },
  {
    id: "security-privacy",
    question:
      "Are database credentials or table records stored on your servers?",
    answer:
      "Never. All database credentials and payload records remain 100% ephemeral in memory and are encrypted with TLS 1.3 in-flight. Nothing is ever written to disk or retained on our servers.",
  },
  {
    id: "schema-translation",
    question: "How does automatic schema translation handle SQL to NoSQL?",
    answer:
      "Our Type Bridge engine automatically introspects relational tables, primary keys, foreign constraints, and column data types, mapping them into optimized document structures. You can preview and customize all field mappings before executing.",
  },
  {
    id: "network-resilience",
    question: "What happens if a network interruption occurs during migration?",
    answer:
      "State checkpoints are recorded after every batch synchronization. If a connection drops, the engine automatically resumes from the exact last verified offset without creating duplicate rows.",
  },
  {
    id: "supported-engines",
    question: "Which databases and engines are currently supported?",
    answer:
      "PostgreSQL, MySQL, MongoDB, SQLite, and Supabase are fully supported in production. Connectors for Redis, Snowflake, and BigQuery are in active preview.",
  },
  {
    id: "agentless-setup",
    question: "Do I need to install any background daemons or agents?",
    answer:
      "No. Seasyn requires zero agent installations on your host infrastructure. It connects directly over standard secure database ports with standard connection strings.",
  },
]

export const FAQ = () => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const activeFaq = FAQ_ITEMS[selectedIndex]

  return (
    <section className="relative z-10 mx-auto mt-36 mb-16 flex w-full max-w-5xl flex-col items-center justify-center px-4 sm:mt-48 sm:mb-24 md:mt-56">
      {/* Section Header */}
      <div className="mb-10 flex flex-col items-center text-center sm:mb-12">
        <div className="bg-secondary text-secondary-foreground mb-3 inline-flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-semibold shadow-2xs">
          FAQ
        </div>
        <ScrollRevealText
          as="h2"
          lines={[
            <>
              <span className="font-medium">Good</span>{" "}
              <span className="text-secondary italic">questions.</span>
            </>,
          ]}
          className="text-foreground mt-1 items-center text-center font-serif text-4xl sm:text-5xl md:text-6xl"
          lineClassName="leading-tight py-0.5"
          maskClassName="py-0.5 -my-0.5"
        />
      </div>

      {/* Main Split Message Box Panel */}
      <div className="bg-muted/40 dark:bg-card/40 relative w-full overflow-hidden rounded-3xl border p-4 shadow-sm sm:p-6 md:p-8 lg:p-10">
        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:gap-8">
          {/* Left Column: Questions List Box (50%) */}
          <div className="bg-card flex flex-col rounded-2xl border p-4 shadow-2xs sm:p-5">
            <h3 className="text-foreground mb-3 px-1 font-serif text-lg font-semibold sm:text-xl">
              Questions
            </h3>

            <div className="flex max-h-105 flex-col gap-2 overflow-y-auto pr-1">
              {FAQ_ITEMS.map((item, index) => {
                const isSelected = selectedIndex === index

                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedIndex(index)}
                    className={cn(
                      "relative h-auto w-full cursor-pointer justify-start rounded-xl p-3 pl-4 text-left text-xs font-medium whitespace-normal transition-all duration-200 focus-visible:outline-none sm:text-sm",
                      isSelected
                        ? "bg-secondary/10 text-foreground border-secondary/30 hover:bg-secondary/15 hover:text-foreground border font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {/* Active Left Indicator Bar */}
                    {isSelected && (
                      <span className="bg-secondary absolute top-2.5 bottom-2.5 left-0 w-1 rounded-full" />
                    )}
                    <span>{item.question}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Right Column: Chat/Message Format Answer Box (50%) */}
          <div className="flex flex-col justify-between p-2 sm:p-4">
            <div>
              <h3 className="text-muted-foreground mb-4 font-serif text-lg font-medium sm:text-xl">
                Answer
              </h3>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFaq.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col"
                >
                  {/* Outgoing Prompt / Question Bubble */}
                  <div className="mb-4 flex justify-end">
                    <div className="text-muted-foreground max-w-md text-right text-xs leading-relaxed font-medium sm:text-sm">
                      {activeFaq.question}
                    </div>
                  </div>

                  {/* Main Answer Message Card */}
                  <div className="bg-card rounded-2xl border p-5 shadow-xs sm:p-7">
                    <p className="text-foreground text-sm leading-relaxed sm:text-base">
                      {activeFaq.answer}
                    </p>
                  </div>

                  {/* Avatar / Brand Icon with Secondary Accent */}
                  <div className="mt-3.5 flex items-center gap-2.5">
                    <div className="bg-secondary/10 border-secondary/30 flex h-8 w-8 items-center justify-center rounded-full border shadow-2xs">
                      <Logo size={16} showText={false} />
                    </div>
                    <span className="text-muted-foreground text-xs font-semibold">
                      Seasyn Migration Engine
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FAQ
