import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { PageTransition } from "./PageTransition"

interface AuthLayoutProps {
  children: ReactNode
  title: string
  description: string
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="bg-background relative flex h-screen max-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-2 sm:px-6">
      {/* Decorative ambient background glows */}
      <div className="bg-primary/5 pointer-events-none absolute -top-20 left-1/4 -z-10 h-64 w-64 rounded-full blur-[100px]" />
      <div className="bg-secondary/5 pointer-events-none absolute right-1/4 -bottom-20 -z-10 h-64 w-64 rounded-full blur-[100px]" />

      <PageTransition className="w-full max-w-110">
        <div className="border-border/70 bg-muted/40 dark:bg-muted/25 rounded-2xl border p-6 shadow-xs sm:p-7">
          {/* Logo */}
          <div className="mb-3 flex flex-col items-center">
            <Link
              to="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <div className="relative flex h-8 w-8 items-center justify-start">
                <div className="border-primary absolute h-7 w-7 rotate-[-15deg] rounded-lg border-[3.5px] bg-transparent" />
                <div className="border-secondary absolute h-7 w-7 translate-x-1.5 translate-y-1 rotate-[-15deg] rounded-lg border-[3.5px] bg-transparent" />
              </div>
              <span className="text-foreground ml-1 font-serif text-xl font-bold tracking-tight">
                Seasyn
              </span>
            </Link>
          </div>

          {/* Title & Description */}
          <div className="mb-4 text-center">
            <h1 className="text-foreground font-serif text-3xl font-bold tracking-tight sm:text-[32px]">
              {title}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          </div>

          {children}
        </div>
      </PageTransition>
    </div>
  )
}
export default AuthLayout
