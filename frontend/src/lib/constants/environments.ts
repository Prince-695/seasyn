import type { Environment } from "@/types"

export interface EnvironmentBadgeConfig {
  label: string
  fullName: string
  className: string
  textColor: string
}

export const ENVIRONMENT_CONFIG: Record<Environment, EnvironmentBadgeConfig> = {
  development: {
    label: "Dev",
    fullName: "Development",
    className: "border-info/30 bg-info/10 text-info font-mono",
    textColor: "text-info",
  },
  staging: {
    label: "Staging",
    fullName: "Staging",
    className: "border-warning/30 bg-warning/10 text-warning font-mono",
    textColor: "text-warning",
  },
  production: {
    label: "Prod",
    fullName: "Production",
    className: "border-success/30 bg-success/10 text-success font-mono",
    textColor: "text-success",
  },
}

export type EnvFilter = "all" | Environment

export const ENV_FILTER_OPTIONS: Array<{
  value: EnvFilter
  label: string
  activeTextClass?: string
}> = [
  { value: "all", label: "All" },
  { value: "development", label: "Dev", activeTextClass: "text-info" },
  { value: "staging", label: "Staging", activeTextClass: "text-warning" },
  { value: "production", label: "Prod", activeTextClass: "text-success" },
]
