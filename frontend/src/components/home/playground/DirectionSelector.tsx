import { ArrowRight } from "lucide-react"
import { SiPostgresql, SiMongodb, SiMysql } from "react-icons/si"
import { Button } from "@/components/ui/button"
import type { ConversionDirection } from "@/lib/constants/playgroundPresets"

interface DirectionSelectorProps {
  direction: ConversionDirection
  onChange: (dir: ConversionDirection) => void
}

export const DirectionSelector = ({
  direction,
  onChange,
}: DirectionSelectorProps) => {
  const isSqlToNoSql = direction === "sql-to-nosql"

  return (
    <div className="flex w-full items-center justify-center">
      <div className="bg-muted/80 border-border inline-flex items-center gap-1.5 rounded-xl border p-1">
        <Button
          variant={isSqlToNoSql ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange("sql-to-nosql")}
          className={`relative flex h-8.5 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            isSqlToNoSql
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <div className="flex items-center -space-x-1">
            <SiPostgresql className="size-3.5 text-blue-300" />
            <SiMysql className="size-3.5 text-sky-400" />
          </div>
          <span>SQL</span>
          <ArrowRight className="size-3 opacity-70" />
          <SiMongodb className="size-3.5 text-emerald-400" />
          <span>NoSQL</span>
        </Button>

        <Button
          variant={!isSqlToNoSql ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange("nosql-to-sql")}
          className={`relative flex h-8.5 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            !isSqlToNoSql
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <SiMongodb className="size-3.5 text-emerald-400" />
          <span>NoSQL</span>
          <ArrowRight className="size-3 opacity-70" />
          <div className="flex items-center -space-x-1">
            <SiPostgresql className="size-3.5 text-blue-300" />
            <SiMysql className="size-3.5 text-sky-400" />
          </div>
          <span>SQL</span>
        </Button>
      </div>
    </div>
  )
}
