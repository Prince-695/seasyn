import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  Cookie,
  Shield,
  KeyRound,
  Settings,
  Mail,
  ArrowLeft,
} from "lucide-react"
import Footer from "@/components/home/Footer"

const SECTIONS = [
  {
    id: "what-is-storage",
    number: "01",
    title: "What cookies & local storage are",
    icon: Cookie,
  },
  {
    id: "categories",
    number: "02",
    title: "Categories of storage we use",
    icon: Shield,
  },
  {
    id: "third-party-auth",
    number: "03",
    title: "Third-party authentication",
    icon: KeyRound,
  },
  {
    id: "controls",
    number: "04",
    title: "How to control cookies",
    icon: Settings,
  },
  { id: "contact", number: "05", title: "Contact us", icon: Mail },
]

export const CookiePolicyPage = () => {
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    )
    Object.values(sectionRefs.current).forEach(
      (el) => el && observer.observe(el)
    )
    return () => observer.disconnect()
  }, [])

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <main className="relative flex-1 pt-12 pb-24 sm:pt-16">
        <div className="bg-primary/5 pointer-events-none absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-2 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          {/* Masthead */}
          <header className="border-border/60 mb-8 border-b pb-5">
            <h1 className="font-serif text-2xl font-medium sm:text-4xl lg:text-5xl">
              Cookie Policy
            </h1>
            <p className="text-muted-foreground mt-2 text-xs sm:mt-3 sm:text-sm">
              Last updated September 2026
            </p>
          </header>

          {/* Plain-language summary */}
          <div className="border-secondary/30 bg-secondary/5 mb-8 rounded-2xl border p-4 sm:mb-12 sm:p-6 md:p-8">
            <p className="text-foreground mb-3 text-sm font-medium">In short</p>
            <ul className="text-muted-foreground grid gap-2 text-xs leading-relaxed sm:grid-cols-2 sm:text-sm">
              <li>
                We store exactly one local storage key, for your light/dark
                theme.
              </li>
              <li>
                Login relies on HttpOnly session cookies your scripts can't
                read.
              </li>
              <li>No ad pixels, no cross-site trackers, nothing sold.</li>
              <li>
                Google/GitHub sign-in popups may set their own short-lived
                cookies.
              </li>
            </ul>
          </div>

          {/* Mobile / Tablet Quick Navigation */}
          <div className="border-border/70 bg-card/60 mb-8 rounded-xl border p-3.5 sm:p-4 lg:hidden">
            <p className="text-muted-foreground mb-2.5 text-xs font-medium tracking-wider uppercase">
              On this page
            </p>
            <nav className="flex flex-wrap gap-1.5">
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    const el = document.getElementById(section.id)
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" })
                      setActiveId(section.id)
                    }
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    activeId === section.id
                      ? "border-primary/40 bg-primary/10 text-primary font-medium"
                      : "border-border/50 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="mr-1.5 font-mono text-[10px] opacity-60">
                    {section.number}
                  </span>
                  {section.title}
                </a>
              ))}
            </nav>
          </div>

          <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
            {/* Table of contents */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-muted-foreground mb-4 text-xs font-medium">
                  On this page
                </p>
                <ul className="border-border/60 space-y-1 border-l">
                  {SECTIONS.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className={`-ml-px block border-l-2 py-1.5 pl-4 text-sm transition-colors ${
                          activeId === section.id
                            ? "border-primary text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground border-transparent"
                        }`}
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Document body */}
            <div className="min-w-0">
              <section
                id="what-is-storage"
                ref={(el) => {
                  sectionRefs.current["what-is-storage"] = el
                }}
                className="scroll-mt-6 pb-7 sm:scroll-mt-10 sm:pb-10"
              >
                <SectionHeading
                  number="01"
                  icon={Cookie}
                  title="What cookies & local storage are"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  Cookies and local storage are small text files and key-value
                  pairs stored on your device by your browser. They let websites
                  keep you securely signed in, remember your interface
                  preferences, and deliver reliable platform services.
                </p>
              </section>

              <div className="border-border/60 border-t" />

              <section
                id="categories"
                ref={(el) => {
                  sectionRefs.current["categories"] = el
                }}
                className="scroll-mt-6 py-7 sm:scroll-mt-10 sm:py-10"
              >
                <SectionHeading
                  number="02"
                  icon={Shield}
                  title="Categories of storage we use"
                />
                <div className="max-w-3xl space-y-6">
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      Strictly essential cookies (session & security)
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      These cookies are mandatory for authentication. We use
                      secure, HttpOnly cookies for session verification and
                      token refreshing. Because they are HttpOnly, they cannot
                      be accessed or intercepted by client-side JavaScript.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      Functional & preference storage (local storage)
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      We store your UI theme selection under the{" "}
                      <code className="bg-card border-border/60 text-foreground rounded border px-1.5 py-0.5 font-mono text-xs break-all">
                        seasyn-ui-theme
                      </code>{" "}
                      key so your preferred dark or light mode persists between
                      sessions.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      Zero third-party advertising trackers
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      Seasyn does not load behavioral advertising cookies,
                      Facebook Pixel, Google AdSense, or cross-site tracking
                      scripts. We never monetize or sell your browsing patterns.
                    </p>
                  </div>
                </div>
              </section>

              <div className="border-border/60 border-t" />

              <section
                id="third-party-auth"
                ref={(el) => {
                  sectionRefs.current["third-party-auth"] = el
                }}
                className="scroll-mt-6 py-7 sm:scroll-mt-10 sm:py-10"
              >
                <SectionHeading
                  number="03"
                  icon={KeyRound}
                  title="Third-party authentication"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  When you use Google or GitHub single sign-on, those identity
                  providers may issue temporary session cookies in their
                  respective authentication popup windows to verify your
                  identity. These cookies are governed by each provider's own
                  privacy policy.
                </p>
              </section>

              <div className="border-border/60 border-t" />

              <section
                id="controls"
                ref={(el) => {
                  sectionRefs.current["controls"] = el
                }}
                className="scroll-mt-6 py-7 sm:scroll-mt-10 sm:py-10"
              >
                <SectionHeading
                  number="04"
                  icon={Settings}
                  title="How to control cookies"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  You can configure your browser to block or delete cookies at
                  any time:
                </p>
                <dl className="mt-4 max-w-3xl space-y-3 text-sm">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                    <dt className="text-foreground w-20 shrink-0 font-medium">
                      Chrome
                    </dt>
                    <dd className="text-muted-foreground">
                      Settings → Privacy and security → Cookies and other site
                      data
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                    <dt className="text-foreground w-20 shrink-0 font-medium">
                      Firefox
                    </dt>
                    <dd className="text-muted-foreground">
                      Settings → Privacy & Security → Cookies and Site Data
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                    <dt className="text-foreground w-20 shrink-0 font-medium">
                      Safari
                    </dt>
                    <dd className="text-muted-foreground">
                      Preferences → Privacy → Manage Website Data
                    </dd>
                  </div>
                </dl>
                <p className="text-muted-foreground mt-4 max-w-3xl text-xs">
                  Disabling strictly essential HttpOnly session cookies will
                  prevent you from logging into your workspace.
                </p>
              </section>

              <div className="border-border/60 border-t" />

              <section
                id="contact"
                ref={(el) => {
                  sectionRefs.current["contact"] = el
                }}
                className="scroll-mt-6 pt-7 sm:scroll-mt-10 sm:pt-10"
              >
                <SectionHeading number="05" icon={Mail} title="Contact us" />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  If you have questions regarding our cookie practices, please
                  reach out to:
                </p>
                <a
                  href="mailto:seasyn.app@gmail.com"
                  className="text-primary hover:text-primary/90 mt-3 inline-block font-mono text-sm font-medium break-all transition-colors"
                >
                  seasyn.app@gmail.com
                </a>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function SectionHeading({
  number,
  icon: Icon,
  title,
}: {
  number: string
  icon: React.ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <div className="mb-4 flex items-baseline gap-3 sm:gap-4">
      <span className="text-border shrink-0 font-serif text-2xl font-medium select-none sm:text-4xl">
        {number}
      </span>
      <h2 className="font-serif text-base leading-snug font-medium sm:text-xl">
        <Icon className="text-primary -mt-1 mr-2 inline h-4 w-4 shrink-0" />
        {title}
      </h2>
    </div>
  )
}

export default CookiePolicyPage
