import {
  ArrowRight,
  Database,
  Server,
  HardDrive,
  Box,
  Cloud,
  Hexagon,
  Component,
  MousePointer2,
} from "lucide-react"
import { Navbar } from "../components/shared/Navbar"
import Footer from "../components/shared/Footer"
import FAQ from "../components/shared/FAQ"
import Features from "@/components/shared/Features"

export const Home = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-x-hidden bg-background px-6 pb-32 text-foreground">
        {/* Background Glows */}
        {/* <div className="absolute top-[-120px] left-[-120px] h-[320px] w-[320px] rounded-full bg-primary-1/10 blur-[100px] transform-gpu will-change-transform" />
        <div className="absolute right-[-100px] bottom-[-150px] h-[350px] w-[350px] rounded-full bg-primary-2/10 blur-[100px] transform-gpu will-change-transform" /> */}

        {/* Hero Section */}
        <section className="relative z-10 mt-42 flex w-full max-w-6xl flex-col items-center justify-between gap-16 text-left lg:flex-row">
          {/* Left: Text Content */}
          <div className="flex flex-1 flex-col items-start">
            {/* Headline */}
            <h1 className="text-left text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl lg:leading-[1.1]">
              Fluid Database{" "}
              <span className="bg-linear-to-r from-primary-1 to-primary-2 bg-clip-text text-transparent italic">
                Migrations,
              </span>{" "}
              <br />
              <span className="">Zero Friction.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-xl text-left text-lg leading-relaxed text-muted-foreground md:text-xl">
              The intelligent, stateless bridge between Postgres, MySQL, SQLite,
              and MongoDB. No persistent data, no stored credentials—just fast,
              secure migrations.
            </p>

            {/* Action Buttons */}
            <div className="relative mt-10 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-start">
              <button className="group relative flex h-14 items-center justify-center gap-3 rounded-xl border border-primary-1 px-6 font-medium text-primary-1 transition-all hover:bg-primary-1/5">
                Start Migrating
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              {/* David's Phantom Cursor */}
              <div className="pointer-events-none absolute top-20 left-48 flex animate-[cursor-float_4s_infinite_ease-in-out] items-start">
                <MousePointer2 className="h-6 w-6 fill-primary-1 text-primary-1 drop-shadow-md" />
                <span className="mt-4 ml-1 rounded-md bg-primary-1 px-2 py-1 text-[10px] font-bold text-primary-foreground shadow-lg">
                  Princess 
                </span>
              </div>
            </div>
          </div>

          {/* Right: Architecture Diagram */}
          <div className="relative flex min-h-100 w-full flex-1 items-center justify-center">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(to_right,var(--border)_1px,transparent_1px)] bg-size-[60px_60px] opacity-50" />
            {/* Background Concentric Rings */}
            <div className="absolute h-105 w-105 rounded-full border border-border/40 bg-card/5 shadow-[0_0_60px_-15px_rgba(59,130,246,0.1)]" />
            <div className="absolute h-65 w-65 rounded-full border border-primary-1/20 bg-primary-1/5" />
            <div className="absolute h-30 w-30 rounded-full border border-primary-1/40 bg-primary-1/10" />

            {/* Connection Lines */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 1000 500"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="line-gradient-left"
                  x1="100%"
                  y1="0%"
                  x2="0%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--primary-1)"
                    stopOpacity="0.5"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary-2)"
                    stopOpacity="0.1"
                  />
                </linearGradient>
                <linearGradient
                  id="line-gradient-right"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--primary-1)"
                    stopOpacity="0.5"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary-2)"
                    stopOpacity="0.1"
                  />
                </linearGradient>
              </defs>

              {/* Left side connections */}
              <path
                d="M 500 250 C 420 250, 320 180, 60 120"
                stroke="url(#line-gradient-left)"
                strokeWidth="3"
              />
              <path
                d="M 500 250 C 400 250, 250 250, 60 250"
                stroke="url(#line-gradient-left)"
                strokeWidth="3"
              />
              <path
                d="M 500 250 C 420 250, 320 320, 60 380"
                stroke="url(#line-gradient-left)"
                strokeWidth="3"
              />

              {/* Right side connections */}
              <path
                d="M 500 250 C 580 250, 680 180, 940 120"
                stroke="url(#line-gradient-right)"
                strokeWidth="3"
              />
              <path
                d="M 500 250 C 600 250, 750 250, 940 250"
                stroke="url(#line-gradient-right)"
                strokeWidth="3"
              />
              <path
                d="M 500 250 C 580 250, 680 320, 940 380"
                stroke="url(#line-gradient-right)"
                strokeWidth="3"
              />
            </svg>

            {/* Central Hub */}
            <div className="relative z-20 flex h-24 w-24 transform items-center justify-center rounded-2xl bg-primary-1 text-primary-foreground shadow-xl shadow-primary-1/30 transition-transform hover:scale-105">
              <Database className="h-10 w-10" />
            </div>

            {/* Left Column Items (Inputs) */}
            <div className="absolute left-0 z-10 flex flex-col gap-8">
              <div className="group flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-md transition-all hover:border-primary-1 hover:shadow-primary-1/20">
                <Server className="h-7 w-7 text-primary-1" />
              </div>
              <div className="group flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-md transition-all hover:border-primary-2 hover:shadow-primary-2/20">
                <HardDrive className="h-7 w-7 text-primary-2" />
              </div>
              <div className="group flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-md transition-all hover:border-chart-3 hover:shadow-chart-3/20">
                <Box className="h-7 w-7 text-chart-3" />
              </div>
            </div>

            {/* Right Column Items (Outputs) */}
            <div className="absolute right-0 z-10 flex flex-col gap-8">
              <div className="group flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-md transition-all hover:border-chart-4 hover:shadow-chart-4/20">
                <Cloud className="h-7 w-7 text-chart-4" />
              </div>
              <div className="group flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-md transition-all hover:border-chart-5 hover:shadow-chart-5/20">
                <Hexagon className="h-7 w-7 text-chart-5" />
              </div>
              <div className="group flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-md transition-all hover:border-primary-1 hover:shadow-primary-1/20">
                <Component className="h-7 w-7 text-primary-1" />
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="relative z-10 mt-32 w-full max-w-6xl px-4">
          <div className="group relative rounded-3xl border border-border bg-card/50 p-2 shadow-xl backdrop-blur-sm transition-all hover:border-primary-1/30">
            {/* Inner Glow */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-b from-primary-1/5 to-transparent" />

            {/* Placeholder Content */}
            <div className="relative flex min-h-100 w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/20 md:min-h-150">
              <div className="flex flex-col items-center gap-4 text-muted-foreground/40">
                <Component size={64} className="animate-pulse" />
                <p className="text-xl font-medium tracking-tight">
                  Dashboard Preview Placeholder
                </p>
                <p className="text-sm">
                  Replace this with your dashboard screenshot
                </p>
              </div>

              {/* Decorative elements to make it look like a UI */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="h-3 w-3 rounded-full bg-chart-4" />
                <div className="h-3 w-3 rounded-full bg-chart-3" />
                <div className="h-3 w-3 rounded-full bg-chart-2" />
              </div>
            </div>

            {/* Background Glow behind the frame */}
            <div className="absolute -inset-4 -z-10 rounded-[40px] bg-primary-1/5 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
          </div>
        </section>

        {/* Feature Highlights */}
        <Features/>

        {/* FAQ Section */}
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
