import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  FileText,
  CheckCircle2,
  Ban,
  Copyright,
  AlertTriangle,
  LogOut,
  Mail,
  ArrowLeft,
} from "lucide-react"
import Footer from "@/components/home/Footer"

const SECTIONS = [
  {
    id: "acceptance",
    number: "01",
    title: "Acceptance of terms",
    icon: FileText,
  },
  {
    id: "database-access",
    number: "02",
    title: "Database access & authorization",
    icon: CheckCircle2,
  },
  {
    id: "acceptable-use",
    number: "03",
    title: "Acceptable use policy",
    icon: Ban,
  },
  {
    id: "ip",
    number: "04",
    title: "Intellectual property & ownership",
    icon: Copyright,
  },
  {
    id: "warranties",
    number: "05",
    title: "Disclaimer of warranties & liability",
    icon: AlertTriangle,
  },
  { id: "termination", number: "06", title: "Termination", icon: LogOut },
  { id: "contact", number: "07", title: "Inquiries & feedback", icon: Mail },
]

export const TermsPage = () => {
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
            <h1 className="font-serif text-2xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
              Terms & Conditions
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
                Only connect databases you own or are authorized to access.
              </li>
              <li>
                Your schemas and data stay yours; the platform and code stay
                ours.
              </li>
              <li>
                Service is provided "as is," so keep independent backups before
                migrating.
              </li>
              <li>Don't attack, reverse-engineer, or abuse the pipeline.</li>
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
                id="acceptance"
                ref={(el) => {
                  sectionRefs.current["acceptance"] = el
                }}
                className="scroll-mt-6 pb-7 sm:scroll-mt-10 sm:pb-10"
              >
                <SectionHeading
                  number="01"
                  icon={FileText}
                  title="Acceptance of terms"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  By creating an account, connecting a database, or accessing
                  any migration tools provided by Seasyn ("the Service"), you
                  agree to be bound by these Terms and Conditions. If you are
                  using the Service on behalf of an organization, you warrant
                  that you possess the authority to bind that entity.
                </p>
              </section>

              <div className="border-border/60 border-t" />

              <section
                id="database-access"
                ref={(el) => {
                  sectionRefs.current["database-access"] = el
                }}
                className="scroll-mt-6 py-7 sm:scroll-mt-10 sm:py-10"
              >
                <SectionHeading
                  number="02"
                  icon={CheckCircle2}
                  title="Database access & authorization"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  You explicitly represent and warrant that:
                </p>
                <ul className="text-muted-foreground mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed">
                  <li>
                    You are the legal owner of, or possess explicit authorized
                    credentials for, any source or target database registered in
                    your Seasyn workspace.
                  </li>
                  <li>
                    Your migration activity adheres to your organization's
                    internal data governance and compliance policies.
                  </li>
                  <li>
                    You will not configure credentials for third-party databases
                    without express written consent.
                  </li>
                </ul>
              </section>

              <div className="border-border/60 border-t" />

              <section
                id="acceptable-use"
                ref={(el) => {
                  sectionRefs.current["acceptable-use"] = el
                }}
                className="scroll-mt-6 py-7 sm:scroll-mt-10 sm:py-10"
              >
                <SectionHeading
                  number="03"
                  icon={Ban}
                  title="Acceptable use policy"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  You agree not to misuse the Seasyn platform. Prohibited
                  activities include:
                </p>
                <ul className="text-muted-foreground mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed">
                  <li>
                    Attempting to bypass memory limits or launching
                    denial-of-service attacks against the pipeline engine.
                  </li>
                  <li>
                    Reverse engineering, decompiling, or probing for
                    vulnerabilities in Seasyn's proprietary replication
                    connectors.
                  </li>
                  <li>
                    Transmitting malicious code, ransomware, or infringing
                    content through live migration pipelines.
                  </li>
                </ul>
              </section>

              <div className="border-border/60 border-t" />

              <section
                id="ip"
                ref={(el) => {
                  sectionRefs.current["ip"] = el
                }}
                className="scroll-mt-6 py-7 sm:scroll-mt-10 sm:py-10"
              >
                <SectionHeading
                  number="04"
                  icon={Copyright}
                  title="Intellectual property & ownership"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  You retain complete, exclusive ownership of all schemas, rows,
                  and data payload records streamed through Seasyn. Seasyn
                  claims no intellectual property rights over customer
                  databases. All trademarks, connector libraries, UI designs,
                  and logos remain the exclusive property of Seasyn.
                </p>
              </section>

              <div className="border-border/60 border-t" />

              <section
                id="warranties"
                ref={(el) => {
                  sectionRefs.current["warranties"] = el
                }}
                className="scroll-mt-6 py-7 sm:scroll-mt-10 sm:py-10"
              >
                <SectionHeading
                  number="05"
                  icon={AlertTriangle}
                  title="Disclaimer of warranties & liability"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  Seasyn is provided on an "as is" and "as available" basis.
                  While our engine performs real-time type coercion and schema
                  validation:
                </p>
                <ul className="text-muted-foreground mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed">
                  <li>
                    We strongly advise maintaining independent, verifiable
                    backups prior to initiating major production migrations.
                  </li>
                  <li>
                    To the maximum extent permitted by law, Seasyn will not be
                    liable for downstream database downtime, schema lockouts, or
                    network interruption caused by external cloud providers.
                  </li>
                </ul>
              </section>

              <div className="border-border/60 border-t" />

              <section
                id="termination"
                ref={(el) => {
                  sectionRefs.current["termination"] = el
                }}
                className="scroll-mt-6 py-7 sm:scroll-mt-10 sm:py-10"
              >
                <SectionHeading number="06" icon={LogOut} title="Termination" />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  You may terminate your account at any time. We reserve the
                  right to suspend or terminate access to workspaces that
                  violate our Acceptable Use Policy or generate malicious
                  network behavior.
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
                  number="07"
                  icon={Mail}
                  title="Inquiries & feedback"
                />
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                  For questions regarding these Terms or enterprise agreements,
                  please contact:
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

export default TermsPage
