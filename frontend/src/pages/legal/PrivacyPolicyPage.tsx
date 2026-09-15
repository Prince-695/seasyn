import { Link } from "react-router-dom"
import { ShieldCheck, Lock, Database, ArrowLeft, Mail } from "lucide-react"
import { Navbar } from "@/components/home/Navbar"
import Footer from "@/components/home/Footer"

export const PrivacyPolicyPage = () => {
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
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Zero-Retention Privacy Commitment</span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Last updated: September 2026 • Version 1.1
            </p>
          </div>

          {/* Document Content */}
          <div className="space-y-8 text-sm leading-relaxed">
            {/* Section 1 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <div className="mb-3 flex items-center gap-2">
                <Database className="text-primary h-4 w-4" />
                <h2 className="font-serif text-lg font-semibold sm:text-xl">
                  1. Zero-Retention Memory Pipeline
                </h2>
              </div>
              <p className="text-muted-foreground">
                Seasyn is engineered from the ground up as a stateless in-flight
                migration engine. When you execute a migration between databases
                (PostgreSQL, MySQL, MongoDB, or SQLite):
              </p>
              <ul className="text-muted-foreground mt-3 list-disc space-y-1.5 pl-5">
                <li>
                  Your payload records and table contents stream strictly
                  in-memory and are never written to disk or stored on our
                  servers.
                </li>
                <li>
                  Once rows are acknowledged by your destination database,
                  in-flight buffers are immediately deallocated and garbage
                  collected.
                </li>
                <li>
                  Database passwords and credentials remain encrypted in transit
                  and are only held in memory for the duration of the active
                  migration connection.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <div className="mb-3 flex items-center gap-2">
                <Lock className="text-secondary h-4 w-4" />
                <h2 className="font-serif text-lg font-semibold sm:text-xl">
                  2. Information We Collect
                </h2>
              </div>
              <p className="text-muted-foreground">
                We only collect minimal metadata strictly necessary to provide
                the account workspace and run authenticated services:
              </p>
              <ul className="text-muted-foreground mt-3 list-disc space-y-1.5 pl-5">
                <li>
                  <strong className="text-foreground">
                    Account Information:
                  </strong>{" "}
                  Your name, email address, password hash (hashed via
                  Argon2/bcrypt), and organization profile.
                </li>
                <li>
                  <strong className="text-foreground">
                    Connection Metadata:
                  </strong>{" "}
                  Database hostname, port, database name, and username.
                  Passwords are encrypted with AES-256-GCM.
                </li>
                <li>
                  <strong className="text-foreground">
                    Diagnostic Telemetry:
                  </strong>{" "}
                  Migration runtime duration, row counts, throughput (MB/s), and
                  error codes. We never inspect or store row values.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <h2 className="font-serif text-lg font-semibold sm:text-xl">
                3. Encryption & In-Flight Security
              </h2>
              <p className="text-muted-foreground mt-2">
                All communications between your browser, the Seasyn API, and
                your database endpoints are secured with TLS 1.3 encryption.
                Authentication tokens are delivered exclusively through secure,
                HttpOnly cookies to mitigate cross-site scripting (XSS) risks.
              </p>
            </section>

            {/* Section 4 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <h2 className="font-serif text-lg font-semibold sm:text-xl">
                4. Third-Party Services
              </h2>
              <p className="text-muted-foreground mt-2">
                We use trusted infrastructure partners to operate our platform:
              </p>
              <ul className="text-muted-foreground mt-3 list-disc space-y-1.5 pl-5">
                <li>
                  <strong className="text-foreground">
                    Cloud Infrastructure:
                  </strong>{" "}
                  Secure server hosting with SOC 2 compliance.
                </li>
                <li>
                  <strong className="text-foreground">OAuth Providers:</strong>{" "}
                  Google and GitHub for optional single-sign-on verification.
                </li>
                <li>
                  <strong className="text-foreground">
                    Transactional Email:
                  </strong>{" "}
                  Email delivery services for verification codes and security
                  alerts.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <h2 className="font-serif text-lg font-semibold sm:text-xl">
                5. User Rights & Data Erasure
              </h2>
              <p className="text-muted-foreground mt-2">
                Under GDPR, CCPA, and applicable global privacy regulations, you
                have full ownership of your data. You may request account
                export, organization deletion, or total profile erasure at any
                time by visiting your Profile settings or contacting our
                security team.
              </p>
            </section>

            {/* Section 6 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <div className="mb-2 flex items-center gap-2">
                <Mail className="text-primary h-4 w-4" />
                <h2 className="font-serif text-lg font-semibold sm:text-xl">
                  6. Contact & Data Protection Inquiries
                </h2>
              </div>
              <p className="text-muted-foreground">
                If you have questions regarding this Privacy Policy or our
                security architecture, please reach out to us at:
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

export default PrivacyPolicyPage
