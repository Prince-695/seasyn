import { Link } from "react-router-dom"
import { Compass, Home, LayoutDashboard, FileText } from "lucide-react"
import { Navbar } from "@/components/home/Navbar"
import { Button } from "@/components/ui/button"

export const NotFoundPage = () => {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Navbar />

      <main className="relative flex flex-1 flex-col items-center justify-center px-4 pt-28 pb-16 text-center sm:pt-36 sm:pb-24">
        {/* Ambient Glows */}
        <div className="bg-primary/5 pointer-events-none absolute top-1/3 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
        <div className="bg-secondary/5 pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" />

        <div className="relative z-10 mx-auto max-w-lg">
          {/* Badge */}
          <div className="bg-secondary/10 border-secondary/30 text-secondary mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold shadow-2xs">
            <Compass
              className="h-3.5 w-3.5 animate-spin"
              style={{ animationDuration: "12s" }}
            />
            <span>404 • Destination Unreachable</span>
          </div>

          {/* Big Stylized 404 */}
          <h1 className="font-serif text-6xl font-bold tracking-tight sm:text-8xl">
            404
          </h1>

          {/* Heading */}
          <h2 className="text-foreground mt-3 font-serif text-xl font-semibold sm:text-2xl">
            Lost in transit
          </h2>

          {/* Description */}
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
            The data pipeline led to an endpoint or route that doesn&rsquo;t
            exist. It may have been moved, decommissioned, or never deployed.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/" className="w-full sm:w-auto">
              <Button
                variant="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full gap-2 px-5 text-sm font-semibold sm:w-auto"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>

            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="border-border/80 bg-card hover:bg-muted h-10 w-full gap-2 px-5 text-sm font-semibold sm:w-auto"
              >
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>

            <Link to="/docs" className="w-full sm:w-auto">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground h-10 w-full gap-2 px-4 text-sm font-medium sm:w-auto"
              >
                <FileText className="h-4 w-4" />
                Documentation
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default NotFoundPage
