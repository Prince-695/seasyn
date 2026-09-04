import { SiPostgresql, SiMysql, SiMongodb, SiSqlite } from "react-icons/si"
import { cn } from "@/lib/utils"
import type { DBType } from "@/types"

export function EngineIcon({
  type,
  className = "h-6 w-6",
}: {
  type: DBType
  className?: string
}) {
  switch (type) {
    case "postgres":
      return <SiPostgresql className={cn("text-info", className)} />
    case "mysql":
      return <SiMysql className={cn("text-primary", className)} />
    case "mongodb":
      return <SiMongodb className={cn("text-success", className)} />
    case "sqlite":
      return <SiSqlite className={cn("text-warning", className)} />
  }
}
