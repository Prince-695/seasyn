import type { DBType } from "@/types"

export const ENGINE_DEFAULTS: Record<
  DBType,
  { port?: number; ssl_mode?: string }
> = {
  postgres: { port: 5432, ssl_mode: "disable" },
  mysql: { port: 3306, ssl_mode: "disable" },
  mongodb: { port: 27017 },
  sqlite: {},
}
