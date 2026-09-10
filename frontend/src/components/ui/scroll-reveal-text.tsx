import React, { useRef } from "react"
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type MotionValue,
} from "framer-motion"
import { cn } from "@/lib/utils"

export interface ScrollRevealTextProps {
  /** Array of text lines to reveal, or a single string (split by newlines) */
  lines?: string[]
  children?: React.ReactNode
  /** "scroll" for continuous scrub with scroll position, "in-view" for entry animation */
  mode?: "scroll" | "in-view"
  /** HTML Tag to render as the main container */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div"
  /** Additional container styling */
  className?: string
  /** Styling applied to each line */
  lineClassName?: string
  /** Mask wrapper styling (defaults to overflow-hidden) */
  maskClassName?: string
  /** Offset for useScroll in "scroll" mode (default: ["start 92%", "center 52%"]) */
  scrollOffset?: [string, string]
}

interface ScrollLineProps {
  text: string
  index: number
  totalLines: number
  progress: MotionValue<number>
  lineClassName?: string
  maskClassName?: string
}

const ScrollScrubLine: React.FC<ScrollLineProps> = ({
  text,
  index,
  totalLines,
  progress,
  lineClassName,
  maskClassName,
}) => {
  // Stagger each line across progress [0, 1]
  const step = totalLines > 1 ? 0.35 / (totalLines - 1) : 0
  const start = Math.min(0.4, index * step)
  const end = Math.min(1, start + 0.6)

  const y = useTransform(progress, [start, end], ["115%", "0%"])
  const opacity = useTransform(progress, [start, start + 0.25], [0.1, 1])

  return (
    <span
      className={cn(
        "line-mask block overflow-hidden leading-[inherit]",
        maskClassName
      )}
    >
      <motion.span
        style={{ y, opacity }}
        className={cn(
          "scroll-reveal-line block will-change-transform",
          lineClassName
        )}
      >
        {text}
      </motion.span>
    </span>
  )
}

interface InViewLineProps {
  text: string
  index: number
  lineClassName?: string
  maskClassName?: string
}

const InViewLine: React.FC<InViewLineProps> = ({
  text,
  index,
  lineClassName,
  maskClassName,
}) => {
  return (
    <span
      className={cn(
        "line-mask block overflow-hidden leading-[inherit]",
        maskClassName
      )}
    >
      <motion.span
        initial={{ y: "115%", opacity: 0 }}
        whileInView={{ y: "0%", opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{
          duration: 0.85,
          ease: [0.16, 1, 0.3, 1],
          delay: index * 0.16,
        }}
        className={cn(
          "scroll-reveal-line block will-change-transform",
          lineClassName
        )}
      >
        {text}
      </motion.span>
    </span>
  )
}

export const ScrollRevealText: React.FC<ScrollRevealTextProps> = ({
  lines,
  children,
  mode = "scroll",
  as: Component = "h2",
  className,
  lineClassName,
  maskClassName,
  scrollOffset = ["start 92%", "center 52%"],
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const rawLines: string[] = React.useMemo(() => {
    if (lines && lines.length > 0) return lines
    if (typeof children === "string") {
      return children.split("\n").filter((l) => l.trim().length > 0)
    }
    return []
  }, [lines, children])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: scrollOffset as [
      `${number | "start" | "center" | "end"} ${number | "start" | "center" | "end" | `${number}%` | `${number}px`}`,
      `${number | "start" | "center" | "end"} ${number | "start" | "center" | "end" | `${number}%` | `${number}px`}`,
    ],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    restDelta: 0.001,
  })

  // If children is custom React elements rather than lines of string
  if (rawLines.length === 0 && children) {
    return (
      <Component
        ref={containerRef}
        className={cn("scroll-reveal-container", className)}
      >
        <span
          className={cn(
            "line-mask block overflow-hidden leading-[inherit]",
            maskClassName
          )}
        >
          <motion.span
            initial={{ y: "115%", opacity: 0 }}
            whileInView={{ y: "0%", opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "scroll-reveal-line block will-change-transform",
              lineClassName
            )}
          >
            {children}
          </motion.span>
        </span>
      </Component>
    )
  }

  return (
    <Component
      ref={containerRef}
      className={cn("scroll-reveal-container flex flex-col", className)}
    >
      {rawLines.map((line, idx) =>
        mode === "scroll" ? (
          <ScrollScrubLine
            key={idx}
            text={line}
            index={idx}
            totalLines={rawLines.length}
            progress={smoothProgress}
            lineClassName={lineClassName}
            maskClassName={maskClassName}
          />
        ) : (
          <InViewLine
            key={idx}
            text={line}
            index={idx}
            lineClassName={lineClassName}
            maskClassName={maskClassName}
          />
        )
      )}
    </Component>
  )
}

export default ScrollRevealText
