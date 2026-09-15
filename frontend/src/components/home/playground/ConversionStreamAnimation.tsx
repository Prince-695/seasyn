import { motion } from "framer-motion"
import { GhostIndicator } from "./GhostIndicator"

interface ConversionStreamAnimationProps {
  isConverting: boolean
  isApiConnected?: boolean | null
}

export const ConversionStreamAnimation = ({
  isConverting,
  isApiConnected = false,
}: ConversionStreamAnimationProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-2 py-4">
      {!isApiConnected ? (
        <GhostIndicator
          label={
            isConverting ? "Haunting the Pipeline..." : "Ghost in the Machine"
          }
        />
      ) : (
        /* Floating Center Equalizer Wave Loader (When API Connected) */
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <div className="flex h-16 items-end justify-center gap-1.5">
            {[0.35, 0.65, 0.95, 0.5, 0.85, 0.45, 0.9, 0.6, 0.4].map(
              (heightScale, i) => (
                <motion.div
                  key={i}
                  animate={
                    isConverting
                      ? {
                          height: [
                            `${heightScale * 100}%`,
                            "100%",
                            "20%",
                            `${heightScale * 100}%`,
                          ],
                        }
                      : { height: `${heightScale * 60}%` }
                  }
                  transition={{
                    duration: isConverting ? 0.6 : 1.8,
                    repeat: Infinity,
                    delay: i * 0.08,
                    ease: "easeInOut",
                  }}
                  className={`w-1.5 rounded-full ${
                    i % 2 === 0
                      ? "bg-primary shadow-sm"
                      : "bg-secondary shadow-sm"
                  }`}
                />
              )
            )}
          </div>

          <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            {isConverting ? "Streaming Data" : "Live Pipeline"}
          </span>
        </div>
      )}
    </div>
  )
}
