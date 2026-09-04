import { Link } from "react-router-dom"
import { Mail } from "lucide-react"
import { FaGithub, FaLinkedin } from "react-icons/fa"

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

export const Footer = () => {
  return (
    <footer className="border-border bg-background relative w-full overflow-hidden border-t px-6 pt-16 pb-8">
      {/* Footer Columns */}
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          {footerColumns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <h3 className="text-foreground font-serif text-lg italic">
                {col.title}
              </h3>
              <nav className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Copyright + Social */}
        <div className="border-border mt-16 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} Seasyn Studio. All rights
            reserved.
          </p>

          <div className="flex gap-3">
            <a
              href="mailto:hello@seasyn.io"
              className="border-border text-muted-foreground hover:border-primary hover:text-primary flex h-8 w-8 items-center justify-center border transition-all"
              aria-label="Email"
            >
              <Mail size={14} />
            </a>
            <a
              href="https://github.com/seasyn"
              target="_blank"
              rel="noopener noreferrer"
              className="border-border text-muted-foreground hover:border-primary hover:text-primary flex h-8 w-8 items-center justify-center border transition-all"
              aria-label="GitHub"
            >
              <FaGithub size={14} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="border-border text-muted-foreground hover:border-primary hover:text-primary flex h-8 w-8 items-center justify-center border transition-all"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Giant "SEASYN" text at bottom — like WhisperFlow's large logo */}
      <div className="pointer-events-none relative z-0 mt-8 text-center select-none">
        <span className="text-foreground/5 text-[10rem] leading-none font-bold tracking-tighter sm:text-[14rem] md:text-[18rem]">
          SEASYN
        </span>
      </div>
    </footer>
  )
}

export default Footer
