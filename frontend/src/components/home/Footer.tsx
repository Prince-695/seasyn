import { Mail } from "lucide-react"
import { FaGithub } from "react-icons/fa"
import { Link } from "react-router-dom"

export const Footer = () => {
  return (
    <footer className="relative w-full overflow-hidden border-t border-border bg-background px-6 py-12">
      {/* "Halfly visible" Seasyn text background */}
      <div className="pointer-events-none absolute -bottom-33 left-1/2 -translate-x-1/2 text-[12rem] font-bold text-secondary/10 select-none md:text-[20rem]">
        SEASYN
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 border-b border-border/40 pb-8 md:flex-row md:items-start md:justify-between">
          {/* Logo & Subtitle */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-start">
                {/* First Ring: Database Source */}
                <div className="absolute h-7 w-7 rotate-[-15deg] rounded-[6px] border-4 border-primary bg-transparent" />
                {/* Second Ring: Database Target */}
                <div className="absolute h-7 w-7 translate-x-2 translate-y-1 rotate-[-15deg] rounded-[6px] border-4 border-secondary bg-transparent" />
              </div>
              <span className="ml-1 text-xl font-bold tracking-tight text-foreground">
                Seasyn
              </span>
            </div>
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Fluid DB Migrations
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
              Quick Links
            </h3>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              <Link
                to="/"
                className="text-sm text-muted-foreground transition-colors hover:text-secondary"
              >
                Home
              </Link>
              <Link
                to="/docs"
                className="text-sm text-muted-foreground transition-colors hover:text-secondary"
              >
                Documentation
              </Link>
              <Link
                to="/migration"
                className="text-sm text-muted-foreground transition-colors hover:text-secondary"
              >
                Start Migration
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-center text-xs text-muted-foreground md:flex-row">
          <div className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Seasyn Studio. All rights
            reserved.
          </div>

          <div className="flex gap-4">
            <a
              href="mailto:seasyn.app@gmail.com"
              className="rounded-full bg-muted p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
              aria-label="Email"
            >
              <Mail size={20} />
            </a>
            <a
              href="https://github.com/seasyn"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-muted p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
              aria-label="GitHub"
            >
              <FaGithub size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
