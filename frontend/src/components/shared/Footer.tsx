import { Link } from "react-router-dom"
import { Mail } from "lucide-react"
import { FaGithub } from "react-icons/fa"

const footerColumns = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "/" },
      { name: "Migration Studio", href: "/migration" },
      { name: "Database Editor", href: "/docs" },
      { name: "Schema Inspector", href: "/docs" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Documentation", href: "/docs" },
      { name: "API Reference", href: "/docs" },
      { name: "Guides", href: "/docs" },
      { name: "Changelog", href: "/docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/" },
      { name: "Careers", href: "/" },
      { name: "Contact", href: "/" },
      { name: "Blog", href: "/" },
    ],
  },
]

const Footer = () => {
  return (
    <footer className="relative w-full overflow-hidden border-t border-border bg-background px-6 pt-16 pb-8">
      {/* Footer Columns */}
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          {footerColumns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <h3 className="font-serif text-lg text-foreground italic">
                {col.title}
              </h3>
              <nav className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Copyright + Social */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Seasyn Studio. All rights
            reserved.
          </p>

          <div className="flex gap-3">
            <a
              href="mailto:hello@seasyn.io"
              className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground transition-all hover:border-primary hover:text-primary"
              aria-label="Email"
            >
              <Mail size={14} />
            </a>
            <a
              href="https://github.com/seasyn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground transition-all hover:border-primary hover:text-primary"
              aria-label="GitHub"
            >
              <FaGithub size={14} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground transition-all hover:border-primary hover:text-primary"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Giant "SEASYN" text at bottom — like WhisperFlow's large logo */}
      <div className="pointer-events-none relative z-0 mt-8 text-center select-none">
        <span className="text-[10rem] leading-none font-bold tracking-tighter text-foreground/5 sm:text-[14rem] md:text-[18rem]">
          SEASYN
        </span>
      </div>
    </footer>
  )
}

export default Footer
