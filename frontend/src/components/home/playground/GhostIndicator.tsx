import { motion } from "framer-motion"
import { useEffect, useRef } from "react"

export interface GhostIndicatorProps {
  label?: string
  isConverting?: boolean
  onAwakened?: () => void
}

export const GhostIndicator = ({
  label,
  isConverting = false,
  onAwakened,
}: GhostIndicatorProps) => {
  const hasAwakened = useRef(false)

  // Fire once, the first time conversion starts
  useEffect(() => {
    if (isConverting && !hasAwakened.current) {
      hasAwakened.current = true
      onAwakened?.()
    }
  }, [isConverting, onAwakened])

  const statusLabel = label ?? (isConverting ? "Waking Up" : "Ghost in the Machine")

  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-2 select-none">
      {/* Animated Floating Ghost */}
      <motion.div
        animate={
          isConverting
            ? {
                x: [-18, 18, -18],
                y: [-9, 9, -9],
                rotate: [-7, 7, -7],
                scale: [1, 1.06, 1],
              }
            : {
                x: [-14, 14, -14],
                y: [-5, 5, -5],
                rotate: [-4, 4, -4],
                scale: 1,
              }
        }
        transition={{
          duration: isConverting ? 1.4 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative flex items-center justify-center filter drop-shadow-md"
      >
        <svg
          viewBox="0 0 100 115"
          className="w-14 h-16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ghost Body */}
          <path
            d="M 12 55 
               C 12 20, 24 6, 50 6 
               C 76 6, 88 20, 88 55 
               L 88 95 
               Q 81.6 102 75.3 95 
               Q 69 88 62.6 95 
               Q 56.3 102 50 95 
               Q 43.6 88 37.3 95 
               Q 31 102 24.6 95 
               Q 18.3 88 12 95 
               Z"
            className="fill-card stroke-border"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Left Eye */}
          <motion.circle
            cx="36"
            cy="46"
            r="5.5"
            className="fill-foreground"
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{
              duration: isConverting ? 2 : 4,
              repeat: Infinity,
              repeatDelay: isConverting ? 1 : 2,
            }}
          />

          {/* Right Eye */}
          <motion.circle
            cx="64"
            cy="46"
            r="5.5"
            className="fill-foreground"
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{
              duration: isConverting ? 2 : 4,
              repeat: Infinity,
              repeatDelay: isConverting ? 1 : 2,
            }}
          />
        </svg>

        {/* Soft shadow below ghost */}
        <motion.div
          animate={{
            scaleX: [1.2, 0.8, 1.2],
            opacity: isConverting ? [0.3, 0.55, 0.3] : [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: isConverting ? 1.4 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-2 w-10 h-1.5 rounded-full bg-foreground/20 blur-[2px]"
        />
      </motion.div>

      {/* Friendly Status Label */}
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center">
        {statusLabel}
      </span>
    </div>
  )
}