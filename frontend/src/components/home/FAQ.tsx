import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollRevealText } from "@/components/ui/scroll-reveal-text"
import { Button } from "../ui/button"

const faqData = [
  {
    question: "How does Seasyn ensure zero downtime during migration?",
    answer:
      "We copy data in small batches without locking any tables. Your database stays live and serves users normally throughout.",
  },
  {
    question:
      "Are database credentials or table records stored on your servers?",
    answer:
      "Never. Your database passwords and records are never saved to disk. Everything is encrypted and kept only in memory while moving.",
  },
  {
    question: "How does automatic schema translation handle SQL to NoSQL?",
    answer:
      "We read your tables, relationships, and fields, then convert them into matching document formats. You can review and edit mappings before starting.",
  },
  {
    question: "What happens if a network interruption occurs during migration?",
    answer:
      "We save progress after every batch. If the connection drops, it resumes right where it stopped without duplicating data.",
  },
  {
    question: "Which databases and versions are currently supported?",
    answer:
      "PostgreSQL, MySQL, MongoDB, and SQLite are supported today. Support for Redis and Snowflake is coming soon.",
  },
  {
    question: "Do I need to install any background daemons or agents?",
    answer:
      "No. You don't need to install anything on your servers. We connect directly using standard database connections.",
  },
]

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="relative z-10 mx-auto mt-28 flex w-full max-w-5xl flex-col items-center justify-center px-4 sm:mt-36 sm:px-6">
      {/* Header with ScrollRevealText */}
      <div className="mb-10 flex flex-col items-center text-center sm:mb-12">
        <div className="bg-secondary text-secondary-foreground mb-3 inline-flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-semibold shadow-2xs">
          FAQ
        </div>

        <ScrollRevealText
          as="h2"
          lines={["Frequently Asked", "Questions."]}
          className="text-foreground font-serif text-3xl leading-[1.08] font-semibold sm:text-5xl sm:leading-[1.05] md:text-6xl md:leading-[1.05]"
          lineClassName="font-serif leading-[1.08] sm:leading-[1.05]"
        />

        <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-snug sm:text-base md:text-lg">
          Answers to common questions about how Seasyn works.
        </p>
      </div>

      <div className="relative flex w-full flex-col gap-2.5 sm:gap-3.5">
        {faqData.map((item, index) => {
          const isOpen = openIndex === index

          return (
            <div
              key={item.question}
              className={cn(
                "group border-border/80 bg-card overflow-hidden rounded-xl border transition-all duration-300",
                isOpen
                  ? "border-primary/40 shadow-xs"
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
                    "min-w-0 flex-1 text-sm leading-snug font-medium transition-colors duration-200 sm:text-base sm:leading-normal sm:font-semibold",
                    isOpen
                      ? "text-primary"
                      : "text-foreground group-hover:text-primary"
                  )}
                >
                  {item.question}
                </span>
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 sm:size-8",
                    isOpen
                      ? "border-primary bg-primary text-primary-foreground rotate-180 shadow-2xs"
                      : "border-border bg-muted/50 text-foreground group-hover:border-primary/50 group-hover:text-primary"
                  )}
                >
                  <ChevronDown className="size-3.5 sm:size-4" />
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
                    <div className="text-muted-foreground px-3.5 pb-4 sm:px-5 sm:pb-5">
                      <div className="border-border/50 border-t pt-3 sm:pt-3.5">
                        <p className="text-xs leading-relaxed font-normal sm:text-sm sm:leading-relaxed">
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
