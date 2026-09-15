import { Link } from "react-router-dom"
import { Cookie, Shield, Settings, ArrowLeft, Mail } from "lucide-react"
import { Navbar } from "@/components/home/Navbar"
import Footer from "@/components/home/Footer"

export const CookiePolicyPage = () => {
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
              <Cookie className="h-3.5 w-3.5" />
              <span>Transparent Storage Policy</span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Cookie Policy
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
                1. What Are Cookies & Local Storage?
              </h2>
              <p className="text-muted-foreground mt-2">
                Cookies and local storage are small text files and key-value
                pairs stored on your device by your browser. They allow websites
                to keep you securely signed in, remember your user interface
                preferences, and deliver reliable platform services.
              </p>
            </section>

            {/* Section 2 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <div className="mb-3 flex items-center gap-2">
                <Shield className="text-primary h-4 w-4" />
                <h2 className="font-serif text-lg font-semibold sm:text-xl">
                  2. Categories of Storage We Use
                </h2>
              </div>
              <div className="space-y-4">
                <div className="border-border/40 bg-background/50 rounded-xl border p-4">
                  <h3 className="text-foreground font-semibold">
                    A. Strictly Essential Cookies (Session & Security)
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    These cookies are mandatory for authentication. We use
                    secure, HttpOnly cookies for session verification and token
                    refreshing. Because they are HttpOnly, they cannot be
                    accessed or intercepted by client-side JavaScript.
                  </p>
                </div>

                <div className="border-border/40 bg-background/50 rounded-xl border p-4">
                  <h3 className="text-foreground font-semibold">
                    B. Functional & Preference Storage (Local Storage)
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    We store your UI theme selection under the{" "}
                    <code className="text-primary font-mono text-xs">
                      seasyn-ui-theme
                    </code>{" "}
                    key in browser local storage so your preferred dark or light
                    mode persists between sessions.
                  </p>
                </div>

                <div className="border-border/40 bg-background/50 rounded-xl border p-4">
                  <h3 className="text-foreground font-semibold">
                    C. Zero Third-Party Advertising Trackers
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Seasyn does <strong className="text-foreground">not</strong>{" "}
                    load behavioral advertising cookies, Facebook Pixel, Google
                    AdSense, or cross-site tracking scripts. We never monetize
                    or sell your browsing patterns.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <h2 className="font-serif text-lg font-semibold sm:text-xl">
                3. Third-Party Authentication
              </h2>
              <p className="text-muted-foreground mt-2">
                When you use Google or GitHub single-sign-on, those identity
                providers may issue temporary session cookies in their
                respective authentication popup windows to authenticate your
                identity. These cookies are governed by the respective
                provider&rsquo;s privacy policy.
              </p>
            </section>

            {/* Section 4 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <div className="mb-3 flex items-center gap-2">
                <Settings className="text-secondary h-4 w-4" />
                <h2 className="font-serif text-lg font-semibold sm:text-xl">
                  4. How to Control Cookies
                </h2>
              </div>
              <p className="text-muted-foreground">
                You can configure your browser to block or delete cookies at any
                time:
              </p>
              <ul className="text-muted-foreground mt-3 list-disc space-y-1.5 pl-5">
                <li>
                  <strong className="text-foreground">Chrome:</strong> Settings
                  &rarr; Privacy and security &rarr; Cookies and other site
                  data.
                </li>
                <li>
                  <strong className="text-foreground">Firefox:</strong> Settings
                  &rarr; Privacy &amp; Security &rarr; Cookies and Site Data.
                </li>
                <li>
                  <strong className="text-foreground">Safari:</strong>{" "}
                  Preferences &rarr; Privacy &rarr; Manage Website Data.
                </li>
              </ul>
              <p className="text-muted-foreground mt-3 text-xs">
                * Note: Disabling strictly essential HttpOnly session cookies
                will prevent you from logging into your workspace.
              </p>
            </section>

            {/* Section 5 */}
            <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
              <div className="mb-2 flex items-center gap-2">
                <Mail className="text-primary h-4 w-4" />
                <h2 className="font-serif text-lg font-semibold sm:text-xl">
                  5. Contact Us
                </h2>
              </div>
              <p className="text-muted-foreground">
                If you have questions regarding our cookie practices, please
                reach out to:
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

export default CookiePolicyPage
