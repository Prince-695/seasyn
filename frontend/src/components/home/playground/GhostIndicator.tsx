import { motion, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { checkSystemHealth } from "@/api/client"

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
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })
  const [status, setStatus] = useState<"ghost" | "waking" | "awake">("ghost")
  const hasCheckedRef = useRef(false)

  // Hit backend health API once when the user reaches the playground
  useEffect(() => {
    if (!isInView || hasCheckedRef.current) return
    hasCheckedRef.current = true

    // If sleeping / cold starting, switch message to "Waking Up" after 3.5s
    const wakingTimer = setTimeout(() => {
      setStatus("waking")
    }, 3500)

    checkSystemHealth(35000)
      .then((isHealthy) => {
        clearTimeout(wakingTimer)
        if (isHealthy) {
          setStatus("awake")
          onAwakened?.()
        } else {
          setStatus("ghost")
        }
      })
      .catch(() => {
        clearTimeout(wakingTimer)
        setStatus("ghost")
      })

    return () => {
      clearTimeout(wakingTimer)
    }
  }, [isInView, onAwakened])

  const isWaking = status === "waking" || isConverting

  const statusLabel = label ?? (isWaking ? "Waking Up" : "Ghost in the Machine")

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center gap-2.5 py-2 select-none"
    >
      {/* Animated Floating Ghost */}
      <motion.div
        animate={
          isWaking
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
          duration: isWaking ? 1.4 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative flex items-center justify-center drop-shadow-md filter"
      >
        <svg
          viewBox="0 0 100 115"
          className="h-16 w-14"
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
              duration: isWaking ? 2 : 4,
              repeat: Infinity,
              repeatDelay: isWaking ? 1 : 2,
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
              duration: isWaking ? 2 : 4,
              repeat: Infinity,
              repeatDelay: isWaking ? 1 : 2,
            }}
          />
        </svg>

        {/* Soft shadow below ghost */}
        <motion.div
          animate={{
            scaleX: [1.2, 0.8, 1.2],
            opacity: isWaking ? [0.3, 0.55, 0.3] : [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: isWaking ? 1.4 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="bg-foreground/20 absolute -bottom-2 h-1.5 w-10 rounded-full blur-[2px]"
        />
      </motion.div>

      {/* Friendly Status Label */}
      <span className="text-muted-foreground text-center font-mono text-[10px] tracking-widest uppercase">
        {statusLabel}
      </span>
    </div>
  )
}
