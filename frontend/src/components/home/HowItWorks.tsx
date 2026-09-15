import { Plug, GitMerge, Radio, ArrowRight, CheckCircle2 } from "lucide-react"
import { SiPostgresql, SiMysql, SiMongodb, SiSqlite } from "react-icons/si"
import { Logo } from "@/components/Logo"
import { cn } from "@/lib/utils"
import { ScrollRevealText } from "@/components/ui/scroll-reveal-text"

interface WorkflowCard {
  stepNumber: string
  title: string
  description: string
  tagline: string
  icon: React.ComponentType<{ className?: string }>
  badges: string[]
  bannerBg: string
  illustration: React.ReactNode
}

const WORKFLOW_CARDS: WorkflowCard[] = [
  {
    stepNumber: "01",
    title: "Connect Databases",
    description:
      "Connect with your credentials. No extra software or background daemons to install.",
    tagline: "Quick & Secure",
    icon: Plug,
    badges: ["Encrypted", "No Data Stored"],
    bannerBg: "bg-secondary text-secondary-foreground",
    illustration: (
      <div className="flex items-center gap-1.5">
        <div className="bg-secondary-foreground/10 flex h-9 w-9 items-center justify-center rounded-lg">
          <SiPostgresql className="h-4.5 w-4.5" />
        </div>
        <div className="bg-secondary-foreground/10 flex h-9 w-9 items-center justify-center rounded-lg">
          <SiMysql className="h-4.5 w-4.5" />
        </div>
      </div>
    ),
  },
  {
    stepNumber: "02",
    title: "Match Tables & Fields",
    description:
      "Intelligent engine automatically aligns schemas and data types across SQL and NoSQL.",
    tagline: "Auto-Match Schema",
    icon: GitMerge,
    badges: ["SQL & NoSQL", "Auto-Verified"],
    bannerBg: "bg-card border border-border text-foreground",
    illustration: (
      <div className="bg-muted/60 flex h-9 w-9 items-center justify-center rounded-lg">
        <Logo size={28} />
      </div>
    ),
  },
  {
    stepNumber: "03",
    title: "Move Your Data",
    description:
      "Stream millions of rows with live telemetry. Auto-resumes cleanly if interrupted.",
    tagline: "Live Transfer",
    icon: Radio,
    badges: ["Low Memory", "Auto-Resume"],
    bannerBg: "bg-primary text-primary-foreground",
    illustration: (
      <div className="flex items-center gap-1.5">
        <div className="bg-primary-foreground/15 flex h-9 w-9 items-center justify-center rounded-lg">
          <SiMongodb className="h-4.5 w-4.5" />
        </div>
        <div className="bg-primary-foreground/15 flex h-9 w-9 items-center justify-center rounded-lg">
          <SiSqlite className="h-4.5 w-4.5" />
        </div>
      </div>
    ),
  },
]

export const HowItWorks = () => {
  return (
    <section className="relative z-10 mx-auto mt-36 mb-10 w-full max-w-6xl px-6 sm:mt-48 sm:mb-20 md:mt-56">
      {/* Section Header */}
      <div className="mb-14 flex flex-col items-center text-center">
        <div className="border-border/80 bg-secondary text-foreground mb-3 inline-flex items-center justify-center rounded-full border px-3 py-1 font-mono text-xs font-semibold">
          Workflow
        </div>

        <ScrollRevealText
          as="h2"
          lines={["Simple to start.", "Built to scale."]}
          className="text-foreground text-4xl leading-[1.05] sm:text-5xl sm:leading-[1.05] md:text-6xl md:leading-[1.05]"
          lineClassName="leading-[1.05]"
        />

        <p className="text-muted-foreground mt-3 max-w-xl text-base leading-snug sm:text-lg">
          Three simple steps to move your data safely.
        </p>
      </div>

      {/* 3-Card Grid Matching Reference Architecture */}
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 md:gap-8">
        {WORKFLOW_CARDS.map((card, index) => (
          <div
            key={card.stepNumber}
            className={cn(
              "border-border bg-card/60 hover:border-primary/50 flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all duration-300 sm:p-6",
              index === 1 && "md:-translate-y-4 md:shadow-sm"
            )}
          >
            {/* Top Narrative Block */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-mono text-xs font-semibold uppercase">
                  Step {card.stepNumber}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {card.badges.map((b) => (
                    <span
                      key={b}
                      className="border-border/60 bg-muted/40 text-muted-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium"
                    >
                      <CheckCircle2 className="text-primary h-3 w-3" />
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="text-foreground text-xl font-semibold sm:text-2xl">
                {card.title}
              </h3>

              <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                {card.description}
              </p>
            </div>

            {/* Bottom Styled Graphic Banner Block */}
            <div
              className={cn(
                "mt-6 flex min-h-40 flex-col justify-between rounded-xl p-5 sm:min-h-45 sm:p-6",
                card.bannerBg
              )}
            >
              {/* Top Row: Tagline & Illustration */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <card.icon className="h-4 w-4" />
                  <span>{card.tagline}</span>
                </div>
                {card.illustration}
              </div>

              {/* Bottom Row: Large Step Number & Arrow */}
              <div className="mt-6 flex items-end justify-between">
                <span className="font-mono text-5xl font-bold tracking-tighter sm:text-6xl">
                  {card.stepNumber}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-current/10">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default HowItWorks
