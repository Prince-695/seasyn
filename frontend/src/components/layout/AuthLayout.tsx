import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"

interface AuthLayoutProps {
  children: ReactNode
  title: string
  description: string
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen">
      <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="w-full max-w-lg space-y-6 rounded-lg border border-border/50 bg-card/40 p-8 shadow-lg backdrop-blur-sm"
        >
          {/* Logo */}
          <div className="flex flex-col items-center">
            <Link
              to="/"
              className="flex items-center gap-3 transition-opacity hover:opacity-90"
            >
              <div className="relative flex h-8 w-8 items-center justify-start">
                <div className="absolute h-7 w-7 rotate-[-15deg] rounded-[6px] border-4 border-primary bg-transparent" />
                <div className="absolute h-7 w-7 translate-x-2 translate-y-1 rotate-[-15deg] rounded-[6px] border-4 border-foreground bg-transparent" />
              </div>
              <span className="ml-1 text-xl font-bold tracking-tight text-foreground">
                Seasyn
              </span>
            </Link>
          </div>

          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              {description}
            </p>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  )
}
export default AuthLayout
