import { Mail } from "lucide-react"
import { FaGithub, FaLinkedin } from "react-icons/fa"

import { Link } from "react-router-dom"

const Footer = () => {
  return (
    <footer className="relative w-full overflow-hidden border-t border-border bg-background px-6 py-12">
      {/* "Halfly visible" Seasyn text background */}
      <div className="pointer-events-none absolute -bottom-33 left-1/2 -translate-x-1/2 text-[12rem] font-bold text-secondary/11 select-none md:text-[20rem]">
        SEASYN
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="">
          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-md font-bold tracking-wide text-foreground uppercase">
              Quick Links
            </h3>
            <nav className="flex gap-4">
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
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 text-center text-xs text-muted-foreground md:flex-row">
          <div className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Seasyn Studio. All rights
            reserved.
          </div>

          <div className="flex gap-4">
            <a
              href="mailto:hello@seasyn.io"
              className="rounded-full bg-muted p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
              aria-label="Email"
            >
              <Mail size={20} />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-muted p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
              aria-label="GitHub"
            >
              <FaGithub size={20} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-muted p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
