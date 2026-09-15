import { useState } from "react"
import { Copy, Check, ArrowUpRight, Code2, Play } from "lucide-react"
import { SiPostgresql, SiMongodb } from "react-icons/si"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import type {
  ConversionDirection,
  ConversionResult,
} from "@/lib/constants/playgroundPresets"

interface ConvertedOutputViewerProps {
  direction: ConversionDirection
  targetName: string
  result: ConversionResult
  hasConverted: boolean
  isConverting: boolean
  onConvert: () => void
  onLaunchStudio?: () => void
}

export const ConvertedOutputViewer = ({
  direction,
  targetName,
  result,
  hasConverted,
  isConverting,
  onConvert,
  onLaunchStudio,
}: ConvertedOutputViewerProps) => {
  const [copied, setCopied] = useState(false)
  const isSqlToNoSql = direction === "sql-to-nosql"

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.formattedPayload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="bg-card border-border flex h-full flex-col rounded-2xl border p-4.5 shadow-xs transition-all">
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b pb-3.5">
        <div className="flex items-center gap-2">
          <div className="bg-secondary/15 text-secondary border-secondary/30 rounded-lg border p-1.5">
            {isSqlToNoSql ? (
              <SiMongodb className="size-4 text-emerald-400" />
            ) : (
              <SiPostgresql className="text-primary size-4" />
            )}
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Target Output
            </span>
            <h3 className="text-foreground text-sm font-bold">
              {isSqlToNoSql
                ? `MongoDB: ${targetName}`
                : `PostgreSQL: ${targetName}`}
            </h3>
          </div>
        </div>

        {/* Copy Button */}
        {hasConverted && (
          <Button
            variant="outline"
            size="xs"
            onClick={handleCopy}
            className="border-border hover:bg-muted flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                <span className="font-semibold text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="text-muted-foreground size-3.5" />
                <span>Copy</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Code Display Area or Empty Awaiting State */}
      <div className="bg-muted/30 border-border relative my-3 flex flex-1 flex-col justify-center overflow-hidden rounded-xl border">
        <AnimatePresence mode="wait">
          {!hasConverted ? (
            <motion.div
              key="awaiting"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="my-auto flex flex-col items-center justify-center gap-3 p-6 text-center"
            >
              <div className="bg-secondary/10 border-secondary/20 text-secondary rounded-2xl border p-3">
                <Code2 className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-foreground text-sm font-semibold">
                  Ready for Real-Time Transformation
                </h4>
                <p className="text-muted-foreground max-w-70 text-xs">
                  Click convert to execute live type mapping and watch data
                  stream into target structure.
                </p>
              </div>
              <Button
                size="sm"
                onClick={onConvert}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 mt-1 flex h-8 items-center gap-1.5 rounded-lg px-4 text-xs font-semibold"
              >
                <Play className="size-3.5 fill-current" />
                <span>Start Live Stream</span>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="converted"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative flex h-full flex-col"
            >
              <div className="bg-muted/60 border-border text-muted-foreground flex items-center justify-between border-b px-3 py-1.5 font-mono text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="bg-secondary size-1.5 rounded-full" />
                  <span>
                    {isSqlToNoSql
                      ? "BSON Document Store"
                      : "Normalized SQL Statement"}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold ${isConverting ? "text-secondary animate-pulse" : "text-emerald-500"}`}
                >
                  {isConverting ? "Streaming..." : "Live In-Sync"}
                </span>
              </div>

              <pre className="text-foreground/90 flex-1 scrollbar-thin overflow-auto p-3 font-mono text-xs leading-relaxed">
                <code>{result.formattedPayload}</code>
              </pre>

              {isConverting && (
                <div className="bg-background/30 pointer-events-none absolute inset-0 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="bg-secondary size-2 animate-ping rounded-full" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Footer */}
      <div className="border-border mt-auto flex items-center justify-between gap-2 border-t pt-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <span
            className={`inline-block size-1.5 rounded-full ${hasConverted ? "bg-emerald-500" : "bg-muted-foreground"}`}
          />
          <span>{hasConverted ? "100% Type Accuracy" : "Awaiting Stream"}</span>
        </div>

        {onLaunchStudio && (
          <Button
            variant="default"
            size="xs"
            onClick={onLaunchStudio}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 rounded-lg text-xs font-medium"
          >
            <span>Launch Studio</span>
            <ArrowUpRight className="size-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
