import { useState, useSyncExternalStore } from "react"
import {
  motion,
  AnimatePresence,
  MotionConfig,
  type Variants,
} from "framer-motion"
import {
  ChevronDown,
  SlidersHorizontal,
  Image as ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import {
  ORG_NAME,
  PREVIEW_USER,
  SIDEBAR_NAV,
  type NavId,
} from "./dashboardPreviewData"
import { StatusDot } from "./primitives"
import { VIEWS } from "./views"

// ── Hook ──────────────────────────────────────────────────────────────────

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", notify)
      return () => mql.removeEventListener("change", notify)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

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
            <span className="text-foreground text-xs font-semibold">
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
                  ? "text-foreground bg-muted font-semibold shadow-2xs"
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
          <div className="bg-primary/15 text-primary flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold">
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

// ── Live / Static toggle ──────────────────────────────────────────────────

type ViewMode = "live" | "image"

const MODES = [
  { id: "live", label: "Live", icon: SlidersHorizontal },
  { id: "image", label: "Static", icon: ImageIcon },
] as const

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode
  onChange: (m: ViewMode) => void
}) {
  return (
    <div className="bg-muted/70 border-border/60 inline-flex rounded-lg border p-0.5">
      {MODES.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={value === id ? "secondary" : "ghost"}
          size="xs"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className="h-6 gap-1 px-2.5 text-[11px] font-medium"
        >
          <Icon className="h-3 w-3" />
          <span>{label}</span>
        </Button>
      ))}
    </div>
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

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
}

interface DashboardPreviewProps {
  imageSrc?: string
  darkImageSrc?: string
  altText?: string
}

export function DashboardPreview({
  imageSrc = "/dashboard.png",
  darkImageSrc = "/dashboard-dark.png",
  altText = "Seasyn Dashboard Preview",
}: DashboardPreviewProps) {
  const { theme } = useTheme()
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)")
  const [viewMode, setViewMode] = useState<ViewMode>("live")
  const [activeNav, setActiveNav] = useState<NavId>("projects")

  const isDark = theme === "dark" || (theme === "system" && prefersDark)
  const activeImage = isDark ? darkImageSrc : imageSrc
  const showImage = viewMode === "image" && Boolean(activeImage)

  const ActiveView = VIEWS[activeNav]
  const activeLabel = SIDEBAR_NAV.find((n) => n.id === activeNav)?.label

  return (
    <MotionConfig reducedMotion="user">
      <section className="relative z-10 mx-auto mt-14 flex w-full max-w-6xl flex-col items-center justify-center px-4 sm:mt-16 sm:mb-10 sm:px-6">
        <div className="bg-primary/5 pointer-events-none absolute top-1/2 left-1/2 h-80 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full"
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
              {activeImage && (
                <ViewToggle value={viewMode} onChange={setViewMode} />
              )}
            </div>

            {/* Body */}
            <AnimatePresence mode="wait">
              {showImage ? (
                <motion.div
                  key="image-view"
                  {...fade}
                  className="bg-card flex flex-1 items-center justify-center overflow-hidden"
                >
                  <img
                    src={activeImage}
                    alt={altText}
                    className="h-full w-full object-cover object-top"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="live-view"
                  {...fade}
                  className="relative flex flex-1 overflow-hidden"
                >
                  <PreviewSidebar
                    activeNav={activeNav}
                    onNavChange={setActiveNav}
                  />

                  <div className="bg-background/50 relative flex flex-1 flex-col overflow-y-auto">
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

                    <div className="flex flex-col p-4 sm:p-5">
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

                    <div className="from-background/95 via-background/60 pointer-events-none sticky inset-x-0 bottom-0 h-24 bg-linear-to-t to-transparent backdrop-blur-[3px]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>
    </MotionConfig>
  )
}

export default DashboardPreview
