import { memo } from "react"
import { cn } from "@/lib/utils"

/**
 * HandwrittenAnnotation
 *
 * Small editorial handwritten note inspired by technical blueprint annotations
 * and the reference visual.
 *
 * Characteristics:
 * - Uses Caveat handwriting typography with authentic cursive ligature feel
 * - Optional hand-drawn sketchy underline or glowing focal dot
 * - Slight natural rotation (-5° to +4°)
 * - Uses only existing theme variables: --primary, --secondary, --chart-4, --muted-foreground
 * - Zero new hex colors
 * - pointer-events-none, aria-hidden="true" (non-disruptive)
 */

export interface HandwrittenAnnotationProps {
  /** Single line or array of lines */
  text: string | string[]
  /** Color tone matching Seasyn palette variables */
  tone?: "blue" | "amber" | "lavender" | "muted"
  /** Rotation in degrees (e.g. -4, 3) */
  rotate?: number
  /** Whether to render the hand-drawn sketchy underline beneath the last line */
  underline?: boolean
  /** Whether to render the small glowing focal dot on the left */
  dot?: boolean
  /** Size variant */
  size?: "sm" | "base" | "lg"
  /** Extra positioning classes */
  className?: string
}

export const HandwrittenAnnotation = memo(function HandwrittenAnnotation({
  text,
  tone = "blue",
  rotate = -3,
  underline = false,
  dot = false,
  size = "base",
  className,
}: HandwrittenAnnotationProps) {
  const lines = Array.isArray(text) ? text : [text]

  const toneClasses = {
    blue: "text-primary/80 dark:text-chart-4/90 stroke-primary/80 dark:stroke-chart-4/90",
    amber: "text-secondary stroke-secondary",
    lavender: "text-chart-4 stroke-chart-4",
    muted: "text-muted-foreground stroke-muted-foreground",
  }[tone]

  const sizeClasses = {
    sm: "text-sm sm:text-base leading-tight",
    base: "text-base sm:text-lg lg:text-xl leading-tight",
    lg: "text-lg sm:text-xl lg:text-2xl leading-tight",
  }[size]

  return (
    <div
      aria-hidden="true"
      style={{ transform: `rotate(${rotate}deg)` }}
      className={cn(
        "font-handwriting pointer-events-none inline-flex flex-col items-start select-none",
        "transition-opacity duration-300",
        toneClasses,
        className
      )}
    >
      <div className="relative flex items-start gap-1.5">
        {/* Optional glowing technical focal dot */}
        {dot && (
          <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-90 shadow-[0_0_6px_currentColor]" />
        )}

        <div className="flex flex-col">
          {lines.map((line, idx) => (
            <span
              key={idx}
              className={cn(
                "font-medium tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_8px_currentColor]",
                sizeClasses
              )}
            >
              {line}
            </span>
          ))}

          {/* Hand-drawn sketchy underline beneath the text */}
          {underline && (
            <svg
              className="mt-0.5 h-2 w-full max-w-32.5 overflow-visible opacity-80 dark:opacity-95"
              viewBox="0 0 100 8"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M 2,5 C 28,1.5 65,6.5 98,3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
})

export default HandwrittenAnnotation
