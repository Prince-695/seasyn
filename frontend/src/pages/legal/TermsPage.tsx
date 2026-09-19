import { Link } from "react-router-dom"
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Mail,
} from "lucide-react"
import { Navbar } from "@/components/home/Navbar"
import Footer from "@/components/home/Footer"

export const TermsPage = () => {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Navbar />

      <main className="relative flex-1 pt-28 pb-16 sm:pt-32 sm:pb-24">
        {/* Subtle Ambient Glow */}
        <div className="bg-primary/5 pointer-events-none absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb / Back Link */}
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="border-border/60 mb-10 border-b pb-8">
            <div className="bg-secondary/10 border-secondary/30 text-secondary mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold">
              <FileText className="h-3.5 w-3.5" />
              <span>Service Terms Agreement</span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Terms & Conditions
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Last updated: September 2026 • Version 1.1
            </p>
          </div>

          {/* Document Content */}
          <div className="space-y-8 text-sm leading-relaxed">
            {/* Section 1 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <h2 className="font-serif text-lg font-semibold sm:text-xl">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground mt-2">
                By creating an account, connecting a database, or accessing any
                migration tools provided by Seasyn (&ldquo;the Service&rdquo;),
                you agree to be bound by these Terms and Conditions. If you are
                using the Service on behalf of an organization, you warrant that
                you possess the authority to bind that entity.
              </p>
            </section>

            {/* Section 2 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-primary h-4 w-4" />
                <h2 className="font-serif text-lg font-semibold sm:text-xl">
                  2. Database Access & Authorization
                </h2>
              </div>
              <p className="text-muted-foreground">
                You explicitly represent and warrant that:
              </p>
              <ul className="text-muted-foreground mt-3 list-disc space-y-1.5 pl-5">
                <li>
                  You are the legal owner of, or possess explicit authorized
                  credentials for, any source or target database registered in
                  your Seasyn workspace.
                </li>
                <li>
                  Your migration activity adheres to your organization&rsquo;s
                  internal data governance and compliance policies.
                </li>
                <li>
                  You will not configure credentials for third-party databases
                  without express written consent.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <h2 className="font-serif text-lg font-semibold sm:text-xl">
                3. Acceptable Use Policy
              </h2>
              <p className="text-muted-foreground mt-2">
                You agree not to misuse the Seasyn platform. Prohibited
                activities include:
              </p>
              <ul className="text-muted-foreground mt-3 list-disc space-y-1.5 pl-5">
                <li>
                  Attempting to bypass memory limits or launching
                  denial-of-service attacks against the pipeline engine.
                </li>
                <li>
                  Reverse engineering, decompiling, or probing for
                  vulnerabilities in Seasyn&rsquo;s proprietary replication
                  connectors.
                </li>
                <li>
                  Transmitting malicious code, ransomware, or infringing content
                  through live migration pipelines.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <h2 className="font-serif text-lg font-semibold sm:text-xl">
                4. Intellectual Property & Customer Ownership
              </h2>
              <p className="text-muted-foreground mt-2">
                You retain complete, exclusive ownership of all schemas, rows,
                and data payload records streamed through Seasyn. Seasyn claims
                no intellectual property rights over customer databases. All
                trademarks, connector libraries, UI designs, and logos remain
                the exclusive property of Seasyn.
              </p>
            </section>

            {/* Section 5 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="text-secondary h-4 w-4" />
                <h2 className="font-serif text-lg font-semibold sm:text-xl">
                  5. Disclaimer of Warranties & Liability
                </h2>
              </div>
              <p className="text-muted-foreground">
                Seasyn is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS
                AVAILABLE&rdquo; basis. While our engine performs real-time type
                coercion and schema validation:
              </p>
              <ul className="text-muted-foreground mt-3 list-disc space-y-1.5 pl-5">
                <li>
                  We strongly advise maintaining independent, verifiable backups
                  prior to initiating major production migrations.
                </li>
                <li>
                  To the maximum extent permitted by law, Seasyn will not be
                  liable for downstream database downtime, schema lockouts, or
                  network interruption caused by external cloud providers.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <h2 className="font-serif text-lg font-semibold sm:text-xl">
                6. Termination
              </h2>
              <p className="text-muted-foreground mt-2">
                You may terminate your account at any time. We reserve the right
                to suspend or terminate access to workspaces that violate our
                Acceptable Use Policy or generate malicious network behavior.
              </p>
            </section>

            {/* Section 7 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <div className="mb-2 flex items-center gap-2">
                <Mail className="text-primary h-4 w-4" />
                <h2 className="font-serif text-lg font-semibold sm:text-xl">
                  7. Inquiries & Feedback
                </h2>
              </div>
              <p className="text-muted-foreground">
                For questions regarding these Terms or enterprise agreements,
                please contact:
              </p>
              <a
                href="mailto:seasyn.app@gmail.com"
                className="text-primary hover:text-primary/90 mt-2 inline-block font-mono font-medium transition-colors"
              >
                seasyn.app@gmail.com
              </a>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default TermsPage
