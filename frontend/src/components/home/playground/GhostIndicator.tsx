import { motion } from "framer-motion"

interface GhostIndicatorProps {
  label?: string
}

export const GhostIndicator = ({
  label = "Ghost in the Machine",
}: GhostIndicatorProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-2 select-none">
      {/* Animated Floating Ghost */}
      <motion.div
        animate={{
          x: [-14, 14, -14],
          y: [-5, 5, -5],
          rotate: [-4, 4, -4],
        }}
        transition={{
          duration: 3,
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
          {/* Ghost Body in Clean Shade of White */}
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
            className="stroke-border/50 fill-white"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Left Eye */}
          <motion.circle
            cx="36"
            cy="46"
            r="5.5"
            className="fill-neutral-900"
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
          />

          {/* Right Eye */}
          <motion.circle
            cx="64"
            cy="46"
            r="5.5"
            className="fill-neutral-900"
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
          />
        </svg>

        {/* Soft shadow below ghost */}
        <motion.div
          animate={{
            scaleX: [1.2, 0.8, 1.2],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="bg-foreground/20 absolute -bottom-2 h-1.5 w-10 rounded-full blur-[2px]"
        />
      </motion.div>

      {/* Friendly Status Label */}
      <span className="text-muted-foreground text-center font-mono text-[10px] tracking-widest uppercase">
        {label}
      </span>
    </div>
  )
}
