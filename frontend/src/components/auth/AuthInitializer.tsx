import type { ReactNode } from "react"
import { useAuth } from "@/hooks/useAuth"

interface AuthInitializerProps {
  children: ReactNode
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  useAuth()
  return <>{children}</>
}

export default AuthInitializer
