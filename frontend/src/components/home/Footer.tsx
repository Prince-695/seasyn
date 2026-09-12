import { Link } from "react-router-dom"
import { Mail, ArrowUpRight } from "lucide-react"
import { FaGithub, FaLinkedin } from "react-icons/fa"

const productLinks = [
  { name: "Features", href: "/#features" },
  { name: "How It Works", href: "/#workflow" },
  { name: "Technical FAQ", href: "/#faq" },
  { name: "Migration Studio", href: "/migration" },
]

const resourceLinks = [
  { name: "Documentation", href: "/docs" },
  { name: "Schema Inspector", href: "/docs" },
  { name: "Zero-Retention Security", href: "/docs" },
  {
    name: "GitHub Repository",
    href: "https://github.com/Prince-695/seasyn/",
    external: true,
  },
]

const platformLinks = [
  { name: "Get Started", href: "/sign-up" },
  { name: "Sign In", href: "/sign-in" },
  {
    name: "Contact Support",
    href: "mailto:seasyn.app@gmail.com",
    external: true,
  },
]

export const Footer = () => {
  return (
    <footer className="border-border/70 bg-background relative w-full overflow-hidden border-t pt-16 pb-12 sm:pt-20 sm:pb-16">
      {/* Giant "SEASYN" light text acting as background watermark */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 z-0 -translate-x-1/2 overflow-hidden select-none">
        <span className="text-foreground/[0.035] dark:text-foreground/4.5 block translate-y-[28%] font-sans text-[15vw] leading-none font-black tracking-tighter sm:text-[17vw] lg:text-[19vw]">
          SEASYN
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8">
        {/* Main Columns */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column (Spans 2 on desktop) */}
          <div className="flex flex-col gap-5 lg:col-span-2">
            <Link to="/" className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-start">
                <div className="border-primary absolute h-6 w-6 rotate-[-15deg] rounded-[5px] border-[3px] bg-transparent" />
                <div className="border-secondary absolute h-6 w-6 translate-x-1.5 translate-y-1 rotate-[-15deg] rounded-[5px] border-[3px] bg-transparent" />
              </div>
              <span className="text-foreground font-serif text-2xl font-bold tracking-tight">
                Seasyn
              </span>
            </Link>

            {/* <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              Stateless in-flight database migration engine. Stream data across
              PostgreSQL, MySQL, MongoDB, and SQLite with zero intermediate
              storage and real-time validation.
            </p> */}

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="mailto:seasyn.app@gmail.com"
                className="border-border/80 bg-background/80 text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5 flex h-9 w-9 items-center justify-center rounded-xl border transition-all"
                aria-label="Email"
              >
                <Mail size={16} />
              </a>
              <a
                href="https://github.com/Prince-695/seasyn/"
                target="_blank"
                rel="noopener noreferrer"
                className="border-border/80 bg-background/80 text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5 flex h-9 w-9 items-center justify-center rounded-xl border transition-all"
                aria-label="GitHub"
              >
                <FaGithub size={16} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="border-border/80 bg-background/80 text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5 flex h-9 w-9 items-center justify-center rounded-xl border transition-all"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={16} />
              </a>
            </div>

            {/* Live Status Pill */}
            {/* <div className="bg-muted/40 border-border/60 text-muted-foreground mt-2 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs">
              <span className="bg-success h-2 w-2 animate-pulse rounded-full" />
              <span>Stateless Streaming Active</span>
            </div> */}
          </div>

          {/* Product Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-foreground font-serif text-sm font-semibold tracking-wide uppercase">
              Product
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-foreground font-serif text-sm font-semibold tracking-wide uppercase">
              Resources
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                    >
                      {link.name}
                      <ArrowUpRight size={12} className="opacity-70" />
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-foreground font-serif text-sm font-semibold tracking-wide uppercase">
              Platform
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              {platformLinks.map((link) => (
                <li key={link.name}>
                  {link.external ? (
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                    >
                      {link.name}
                      <ArrowUpRight size={12} className="opacity-70" />
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Sub-row */}
        <div className="border-border/60 text-muted-foreground mt-16 flex flex-col items-center justify-between gap-4 border-t pt-8 text-xs sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Seasyn. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span>Zero Data Retention</span>
            <span>•</span>
            <span>Client-Side Isolation</span>
            <span>•</span>
            <a
              href="https://github.com/Prince-695/seasyn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Open Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
