import type { DBType } from "@/types"

export interface EngineOption {
  type: DBType
  name: string
  paradigm: string
  description: string
  colorClass: string
  badgeClass: string
}

export const ENGINE_DEFAULTS: Record<
  DBType,
  { port?: number; ssl_mode?: string }
> = {
  postgres: { port: 5432, ssl_mode: "disable" },
  mysql: { port: 3306, ssl_mode: "disable" },
  mongodb: { port: 27017 },
  sqlite: {},
}

export const ENGINES: EngineOption[] = [
  {
    type: "postgres",
    name: "PostgreSQL",
    paradigm: "Relational • SQL",
    description:
      "Advanced open-source relational database with robust transactional ACID guarantees.",
    colorClass: "border-info/30 hover:border-info/60",
    badgeClass: "border-info/30 bg-info/10 text-info",
  },
  {
    type: "mysql",
    name: "MySQL",
    paradigm: "Relational • SQL",
    description:
      "Ubiquitous, high-speed relational database optimized for web applications and scale.",
    colorClass: "border-primary/30 hover:border-primary/60",
    badgeClass: "border-primary/30 bg-primary/10 text-primary",
  },
  {
    type: "mongodb",
    name: "MongoDB",
    paradigm: "Document • NoSQL",
    description:
      "Flexible JSON-like document model supporting dynamic schemas and nested objects.",
    colorClass: "border-success/30 hover:border-success/60",
    badgeClass: "border-success/30 bg-success/10 text-success",
  },
  {
    type: "sqlite",
    name: "SQLite",
    paradigm: "Embedded • Serverless",
    description:
      "Self-contained, serverless zero-configuration file database engine.",
    colorClass: "border-warning/30 hover:border-warning/60",
    badgeClass: "border-warning/30 bg-warning/10 text-warning",
  },
]
