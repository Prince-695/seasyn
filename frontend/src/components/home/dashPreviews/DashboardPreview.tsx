import { useState } from "react"
import {
  motion,
  AnimatePresence,
  MotionConfig,
  type Variants,
} from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { cn } from "@/lib/utils"
import { HandwrittenAnnotation } from "@/components/ui/HandwrittenAnnotation"
import {
  ORG_NAME,
  PREVIEW_USER,
  SIDEBAR_NAV,
  type NavId,
} from "./dashboardPreviewData"
import { StatusDot } from "./primitives"
import { VIEWS } from "./views"

// ── Sidebar ───────────────────────────────────────────────────────────────

interface PreviewSidebarProps {
  activeNav: NavId
  onNavChange: (id: NavId) => void
}

function PreviewSidebar({ activeNav, onNavChange }: PreviewSidebarProps) {
  return (
    <aside className="border-border/60 bg-card hidden w-52 shrink-0 flex-col border-r p-3 md:flex">
      <div className="border-border/60 mb-3 flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Logo size={20} showText={false} />
          <div className="flex flex-col text-left leading-tight">
            <span className="text-foreground text-xs font-medium">
              {ORG_NAME}
            </span>
            <span className="text-muted-foreground font-mono text-[10px]">
              OWNER
            </span>
          </div>
        </div>
        <ChevronDown className="text-muted-foreground h-3.5 w-3.5 opacity-60" />
      </div>

      <nav className="flex flex-1 flex-col space-y-0.5">
        {SIDEBAR_NAV.map(({ id, label, icon: Icon }) => {
          const active = activeNav === id
          return (
            <Button
              key={id}
              variant={active ? "secondary" : "ghost"}
              size="sm"
              aria-current={active ? "page" : undefined}
              onClick={() => onNavChange(id)}
              className={cn(
                "h-8.5 w-full justify-start gap-2.5 rounded-lg px-2.5 text-xs font-medium transition-all",
                active
                  ? "text-foreground bg-muted font-medium shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Button>
          )
        })}
      </nav>

      <div className="border-border/60 mt-auto border-t pt-2.5">
        <div className="flex items-center gap-2 px-1">
          <div className="bg-primary/15 text-primary flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium">
            {PREVIEW_USER.initial}
          </div>
          <div className="flex flex-col text-left leading-none">
            <span className="text-foreground text-xs font-medium">
              {PREVIEW_USER.email}
            </span>
            <span className="text-muted-foreground mt-0.5 text-[10px]">
              {PREVIEW_USER.plan}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── Bottom fade ───────────────────────────────────────────────────────────

// Blurs the content that scrolls under the bottom edge (strongest at the bottom).
const CONTENT_BLUR_MASK = "linear-gradient(to top, black 30%, transparent 100%)"

// Fades the WHOLE card (content, border and shadow) into the page background.
// The wrapper that uses it extends 4rem below the card, so the card's bottom
// edge sits at `calc(100% - 4rem)`; alpha reaches 0 just above that edge.
const CARD_FADE_MASK =
  "linear-gradient(to bottom, black calc(100% - 15rem), rgb(0 0 0 / 0.55) calc(100% - 10rem), transparent calc(100% - 4.5rem))"

function BottomBlur() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 backdrop-blur-md"
      style={{
        maskImage: CONTENT_BLUR_MASK,
        WebkitMaskImage: CONTENT_BLUR_MASK,
      }}
    />
  )
}

// ── Main ──────────────────────────────────────────────────────────────────

const tabContentVariants: Variants = {
  initial: { opacity: 0, y: 10, filter: "blur(2px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.22, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(2px)",
    transition: { duration: 0.15, ease: "easeIn" },
  },
}

export interface DashboardPreviewProps {
  imageSrc?: string
  darkImageSrc?: string
  altText?: string
}

export function DashboardPreview() {
  const [activeNav, setActiveNav] = useState<NavId>("projects")

  const ActiveView = VIEWS[activeNav]
  const activeLabel = SIDEBAR_NAV.find((n) => n.id === activeNav)?.label

  return (
    <MotionConfig reducedMotion="user">
      <section className="relative z-10 mx-auto mt-16 flex w-full max-w-6xl flex-col items-center justify-center px-4 sm:mt-20 sm:mb-10 sm:px-6">
        {/* Editorial handwritten note — placed on the left side */}
        <div className="mb-3 flex w-full justify-start pl-2 sm:pl-6">
          <HandwrittenAnnotation
            text={["Data in motion.", "Zero downtime."]}
            tone="amber"
            underline
            rotate={-2}
            className="inline-flex"
          />
        </div>

        <div className="bg-primary/5 pointer-events-none absolute top-1/2 left-1/2 h-80 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full"
        >
          <div
            className="-mx-4 -mt-8 -mb-16 px-4 pt-8 pb-16"
            style={{
              maskImage: CARD_FADE_MASK,
              WebkitMaskImage: CARD_FADE_MASK,
            }}
          >
            <div className="border-border/70 bg-card relative flex h-160 w-full flex-col overflow-hidden rounded-2xl border-2 shadow-2xl">
              {/* Top bar */}
              <div className="border-border/60 bg-muted/40 flex h-11 shrink-0 items-center justify-between border-b px-4">
                <div className="flex items-center gap-2.5">
                  <StatusDot className="h-2 w-2" />
                  <span className="text-foreground text-xs font-medium">
                    {ORG_NAME} Workspace
                  </span>
                  <span className="text-border/80 hidden sm:inline">•</span>
                  <span className="text-muted-foreground hidden font-mono text-[11px] sm:inline">
                    Live Interactive Preview
                  </span>
                </div>
              </div>

              {/* Body - Live View */}
              <div className="relative flex flex-1 overflow-hidden">
                <PreviewSidebar
                  activeNav={activeNav}
                  onNavChange={setActiveNav}
                />

                {/* Non-scrolling wrapper so the blur stays pinned to the bottom */}
                <div className="bg-background/50 relative flex min-w-0 flex-1 flex-col overflow-hidden">
                  <div className="border-border/60 bg-card/40 flex h-10 shrink-0 items-center justify-between border-b px-4">
                    <div className="text-muted-foreground flex items-center gap-1.5 font-mono text-[11px]">
                      <span>Organization</span>
                      <span>/</span>
                      <span className="text-foreground font-medium">
                        {activeLabel}
                      </span>
                    </div>
                    <span className="text-muted-foreground hidden font-mono text-[11px] sm:inline">
                      Auto-sync active (SSE)
                    </span>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col p-4 pb-16 sm:p-5 sm:pb-16">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeNav}
                          variants={tabContentVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <ActiveView />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  <BottomBlur />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </MotionConfig>
  )
}

export default DashboardPreview
