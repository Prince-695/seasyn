import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Logo } from "@/components/Logo"
import { PageTransition } from "./PageTransition"

interface AuthLayoutProps {
  children: ReactNode
  title: string
  description: string
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="bg-background relative flex h-screen max-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-2 sm:px-6">
      <PageTransition className="w-full max-w-110">
        <div className="border-border bg-card/60 rounded-xl border p-6 shadow-xs sm:p-7">
          {/* Logo */}
          <div className="mb-3 flex flex-col items-center">
            <Link
              to="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <Logo showText size={32} />
            </Link>
          </div>

          {/* Title & Description */}
          <div className="mb-4 text-center">
            <h1 className="text-foreground font-serif text-3xl font-semibold sm:text-[32px]">
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
