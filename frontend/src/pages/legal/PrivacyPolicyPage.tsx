import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  Database,
  Lock,
  ShieldCheck,
  Share2,
  RefreshCw,
  Mail,
  ArrowLeft,
} from "lucide-react"
import Footer from "@/components/home/Footer"

const SECTIONS = [
  {
    id: "zero-retention",
    number: "01",
    title: "Zero-retention memory pipeline",
    icon: Database,
  },
  {
    id: "information",
    number: "02",
    title: "Information we collect",
    icon: Lock,
  },
  {
    id: "encryption",
    number: "03",
    title: "Encryption & in-flight security",
    icon: ShieldCheck,
  },
  {
    id: "third-party",
    number: "04",
    title: "Third-party services",
    icon: Share2,
  },
  {
    id: "rights",
    number: "05",
    title: "User rights & data erasure",
    icon: RefreshCw,
  },
  {
    id: "contact",
    number: "06",
    title: "Contact & data protection",
    icon: Mail,
  },
]

export const PrivacyPolicyPage = () => {
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
              Privacy Policy
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
                Your database rows stream in memory and are never written to
                disk.
              </li>
              <li>
                We keep account info, connection metadata, and run diagnostics,
                not row values.
              </li>
              <li>
                Everything is encrypted in transit with TLS 1.3, credentials
                with AES-256-GCM.
              </li>
              <li>
                You can export or erase your data any time from your profile.
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
                id="zero-retention"
                ref={(el) => {
                  sectionRefs.current["zero-retention"] = el
                }}
                className="scroll-mt-6 pb-7 sm:scroll-mt-10 sm:pb-10"
              >
                <SectionHeading
                  number="01"
                  icon={Database}
                  title="Zero-retention memory pipeline"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  Seasyn is engineered from the ground up as a stateless
                  in-flight migration engine. When you run a migration between
                  databases (PostgreSQL, MySQL, MongoDB, or SQLite):
                </p>
                <ul className="text-muted-foreground mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed">
                  <li>
                    Your payload records and table contents stream strictly in
                    memory and are never written to disk or stored on our
                    servers.
                  </li>
                  <li>
                    Once rows are acknowledged by your destination database,
                    in-flight buffers are immediately deallocated and garbage
                    collected.
                  </li>
                  <li>
                    Database passwords and credentials remain encrypted in
                    transit and are only held in memory for the duration of the
                    active migration connection.
                  </li>
                </ul>
              </section>

              <div className="border-border/60 border-t" />

              <section
                id="information"
                ref={(el) => {
                  sectionRefs.current["information"] = el
                }}
                className="scroll-mt-6 py-7 sm:scroll-mt-10 sm:py-10"
              >
                <SectionHeading
                  number="02"
                  icon={Lock}
                  title="Information we collect"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  We only collect minimal metadata strictly necessary to provide
                  the account workspace and run authenticated services:
                </p>
                <div className="mt-5 max-w-3xl space-y-5">
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      Account information
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      Your name, email address, password hash (hashed via
                      Argon2/bcrypt), and organization profile.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      Connection metadata
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      Database hostname, port, database name, and username.
                      Passwords are encrypted with AES-256-GCM.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      Diagnostic telemetry
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      Migration runtime duration, row counts, throughput (MB/s),
                      and error codes. We never inspect or store row values.
                    </p>
                  </div>
                </div>
              </section>

              <div className="border-border/60 border-t" />

              <section
                id="encryption"
                ref={(el) => {
                  sectionRefs.current["encryption"] = el
                }}
                className="scroll-mt-6 py-7 sm:scroll-mt-10 sm:py-10"
              >
                <SectionHeading
                  number="03"
                  icon={ShieldCheck}
                  title="Encryption & in-flight security"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  All communications between your browser, the Seasyn API, and
                  your database endpoints are secured with TLS 1.3 encryption.
                  Authentication tokens are delivered exclusively through
                  secure, HttpOnly cookies to mitigate cross-site scripting
                  (XSS) risks.
                </p>
              </section>

              <div className="border-border/60 border-t" />

              <section
                id="third-party"
                ref={(el) => {
                  sectionRefs.current["third-party"] = el
                }}
                className="scroll-mt-6 py-7 sm:scroll-mt-10 sm:py-10"
              >
                <SectionHeading
                  number="04"
                  icon={Share2}
                  title="Third-party services"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  We use trusted infrastructure partners to operate our
                  platform:
                </p>
                <dl className="mt-4 max-w-3xl space-y-3 text-sm">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                    <dt className="text-foreground w-40 shrink-0 font-medium">
                      Cloud infrastructure
                    </dt>
                    <dd className="text-muted-foreground">
                      Secure server hosting with SOC 2 compliance
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                    <dt className="text-foreground w-40 shrink-0 font-medium">
                      OAuth providers
                    </dt>
                    <dd className="text-muted-foreground">
                      Google and GitHub for optional single sign-on
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                    <dt className="text-foreground w-40 shrink-0 font-medium">
                      Transactional email
                    </dt>
                    <dd className="text-muted-foreground">
                      Delivery of verification codes and security alerts
                    </dd>
                  </div>
                </dl>
              </section>

              <div className="border-border/60 border-t" />

              <section
                id="rights"
                ref={(el) => {
                  sectionRefs.current["rights"] = el
                }}
                className="scroll-mt-6 py-7 sm:scroll-mt-10 sm:py-10"
              >
                <SectionHeading
                  number="05"
                  icon={RefreshCw}
                  title="User rights & data erasure"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  Under GDPR, CCPA, and applicable global privacy regulations,
                  you have full ownership of your data. You may request account
                  export, organization deletion, or total profile erasure at any
                  time from your profile settings or by contacting our security
                  team.
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
                <SectionHeading
                  number="06"
                  icon={Mail}
                  title="Contact & data protection"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  If you have questions regarding this Privacy Policy or our
                  security architecture, please reach out to us at:
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

export default PrivacyPolicyPage
