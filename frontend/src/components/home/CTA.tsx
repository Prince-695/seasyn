import { ArrowRight, ShieldCheck, Zap, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollRevealText } from "@/components/ui/scroll-reveal-text"

interface CTAProps {
  onCtaClick?: () => void
}

export const CTA = ({ onCtaClick }: CTAProps) => {
  return (
    <section className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center px-6 pt-30 pb-32 text-center sm:pt-40 sm:pb-40 md:pt-50 md:pb-52">
      {/* Eyebrow Secondary Pill Badge */}
      <div className="bg-secondary text-secondary-foreground border-secondary/40 mb-6 inline-flex items-center justify-center rounded-md border px-3.5 py-1 text-xs font-semibold">
        Get Started
      </div>

      {/* Dramatic Big Serif Headline with Scroll Reveal & Highlighted Word */}
      <ScrollRevealText
        as="h2"
        lines={[
          "Your data in motion.",
          <>
            Always{" "}
            <span className="bg-highlight text-highlight-foreground border-border/70 inline-block rounded-lg border px-2.5 py-0.5 font-semibold sm:rounded-xl sm:px-3.5">
              in sync.
            </span>
          </>,
        ]}
        className="text-foreground items-center text-center font-serif text-5xl font-semibold sm:text-6xl md:text-7xl lg:text-8xl"
        lineClassName="font-serif leading-[1.08] py-1"
        maskClassName="py-1 -my-1"
      />

      {/* Subtitle */}
      <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg md:text-xl">
        Move your data quickly with zero downtime and zero data loss.
      </p>

      {/* CTA Action Button */}
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button
          onClick={onCtaClick}
          className="group bg-primary text-primary-foreground hover:bg-primary/90 border-primary/30 flex cursor-pointer items-center justify-center gap-2.5 rounded-lg border px-8 py-6 text-base font-semibold transition-all active:translate-y-px sm:text-lg"
        >
          <span>Start Migration</span>
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Micro Trust Indicators */}
      <div className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="text-secondary h-4 w-4" />
          100% Private
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="text-primary h-4 w-4" />
          Nothing to Install
        </span>
        <span className="flex items-center gap-1.5">
          <Activity className="text-accent h-4 w-4" />
          Live Progress
        </span>
      </div>
    </section>
  )
}

export default CTA
