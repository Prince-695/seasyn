import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DBType } from "@/types"

interface ConnectionFieldGuideProps {
  selectedEngine: DBType
}

export function ConnectionFieldGuide({
  selectedEngine,
}: ConnectionFieldGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border-primary/20 bg-primary/5 rounded-xl border p-2.5 text-xs shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Zap className="text-primary h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground text-xs font-medium">
            Field Guide
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary hover:bg-primary/10 hover:text-primary h-6 cursor-pointer gap-1 px-2 text-[11px] font-medium"
        >
          <span>{isExpanded ? "Hide" : "Explain Fields"}</span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.div>
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="guide-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-primary/15 mt-2 space-y-1.5 border-t pt-2 text-[11px]">
              {selectedEngine !== "sqlite" ? (
                <ul className="text-muted-foreground space-y-1">
                  <li>
                    <strong className="text-foreground">Host / Server:</strong>{" "}
                    Server domain or IP (e.g.{" "}
                    <code className="font-mono text-[10px]">
                      ep-example.neon.tech
                    </code>
                    ,{" "}
                    <code className="font-mono text-[10px]">
                      cluster.mongodb.net
                    </code>
                    , or{" "}
                    <code className="font-mono text-[10px]">127.0.0.1</code>).
                  </li>
                  <li>
                    <strong className="text-foreground">Port Number:</strong>{" "}
                    Network port (
                    <code className="font-mono text-[10px]">5432</code>{" "}
                    Postgres,{" "}
                    <code className="font-mono text-[10px]">3306</code> MySQL,{" "}
                    <code className="font-mono text-[10px]">27017</code>{" "}
                    MongoDB).
                  </li>
                  <li>
                    <strong className="text-foreground">Database Name:</strong>{" "}
                    Logical database name to inspect and migrate (e.g.{" "}
                    <code className="font-mono text-[10px]">neondb</code> or{" "}
                    <code className="font-mono text-[10px]">production</code>).
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Database User & Password:
                    </strong>{" "}
                    Credentials with read/write access permissions.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      SSL Security Mode:
                    </strong>{" "}
                    Use <code className="font-mono text-[10px]">Require</code>{" "}
                    for cloud-hosted databases (Neon, Supabase, Atlas), or{" "}
                    <code className="font-mono text-[10px]">Disable</code> for
                    localhost.
                  </li>
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  <strong className="text-foreground">
                    Database File Path:
                  </strong>{" "}
                  Absolute file path to the SQLite{" "}
                  <code className="font-mono text-[10px]">.db</code> file (e.g.{" "}
                  <code className="font-mono text-[10px]">
                    /var/data/production.db
                  </code>
                  ).
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
