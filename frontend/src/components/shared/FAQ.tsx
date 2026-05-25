import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

const faqData = [
  {
    question: "What is Seasyn?",
    answer:
      "Seasyn is an intelligent, stateless bridge designed for seamless database migrations. It allows you to move data between Postgres, MySQL, SQLite, and MongoDB without the need for persistent storage or middle-man servers.",
  },
  {
    question: "Is my database credential data safe?",
    answer:
      "Absolutely. Seasyn is built with a 'Stateless' philosophy. We don't store your database credentials or your data on our servers. Migrations happen directly between your source and destination, ensuring maximum security and privacy.",
  },
  {
    question: "Which databases are supported?",
    answer:
      "Currently, we support Postgres, MySQL, SQLite, and MongoDB. We are constantly working on adding more database variants, including other SQL dialects and NoSQL engines.",
  },
  {
    question: "Do I need to install anything on my server?",
    answer:
      "No installation is required on your servers. Seasyn uses standard connection protocols to introspect and convert schemas in real-time, providing a zero-footprint migration experience.",
  },
  {
    question: "Can I migrate between SQL and NoSQL?",
    answer:
      "Yes! Seasyn includes a built-in transformation engine that automatically handles the schema conversion between relational (SQL) and document-based (NoSQL) formats.",
  },
]

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="relative z-10 mx-auto mt-32 flex w-full max-w-6xl flex-col items-center justify-center gap-9 px-6 pb-32">
      {/* Header */}
      <div className="mb-1 flex text-center">
        <h2 className="mb-4 text-5xl font-bold tracking-wider text-foreground md:text-5xl">
          Everything <p className="text-primary-1">You Need to Know</p>
        </h2>
      </div>

      <div className="relative flex w-2/3 flex-col gap-4">
        {/* Decorative background glows using primary-1 and primary-2 */}
        <div className="pointer-events-none absolute top-1/4 left-[-15%] -z-10 h-72 w-72 rounded-full bg-primary-1/5 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-15%] bottom-1/4 -z-10 h-72 w-72 rounded-full bg-primary-2/5 blur-[120px]" />

        {faqData.map((item, index) => {
          const isOpen = openIndex === index

          return (
            <div
              key={index}
              className={cn(
                "group overflow-hidden rounded-xl border-b border-border bg-card/40 backdrop-blur-sm transition-all duration-300",
                isOpen
                  ? "border-primary-2 shadow-2xl shadow-primary-1/5"
                  : "hover:border-primary-1/20 hover:bg-card/60"
              )}
            >
              <button
                onClick={() => toggleItem(index)}
                className="flex w-full items-center justify-between bg-transparent p-2 text-left md:p-4"
              >
                <span
                  className={cn(
                    "text-lg font-semibold transition-colors duration-300 md:text-xl",
                    isOpen
                      ? "text-primary-1"
                      : "text-foreground group-hover:text-primary-2"
                  )}
                >
                  {item.question}
                </span>
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-500 ease-in-out",
                    isOpen
                      ? "rotate-180 text-primary-foreground shadow-lg shadow-primary-1/20"
                      : "text-primary-2 group-hover:text-primary-1"
                  )}
                >
                  <ChevronDown className="h-6 w-6" />
                </div>
              </button>

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
                      duration: 0.4,
                      ease: [0.04, 0.62, 0.23, 0.98],
                    }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 pb-4 text-muted-foreground md:px-4">
                      <div className="border-t border-border/40 pt-4">
                        <p className="text-base leading-relaxed md:text-lg">
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
