
import { ArrowRight, Database, FastForward, ShieldCheck, Server, HardDrive, Box, Cloud, Hexagon, Component } from "lucide-react"
import { Navbar } from "../components/shared/Navbar"
import Footer from "../components/shared/Footer"

export const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="relative flex-1 flex flex-col items-center justify-center overflow-x-hidden bg-background px-6 text-foreground pb-32">
        {/* Background Glows */}
        {/* <div className="absolute top-[-120px] left-[-120px] h-[320px] w-[320px] rounded-full bg-primary/20 blur-[100px] transform-gpu will-change-transform" />
        <div className="absolute right-[-100px] bottom-[-150px] h-[350px] w-[350px] rounded-full bg-accent/20 blur-[100px] transform-gpu will-change-transform" /> */}

        {/* Hero Section */}
        <section className="relative z-10 flex w-full max-w-6xl flex-col lg:flex-row items-center justify-between gap-16 mt-42 text-left">
          
          {/* Left: Text Content */}
          <div className="flex flex-1 flex-col items-start">
            {/* Headline */}
            <h1 className="text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl lg:leading-[1.1] text-foreground text-left">
              Fluid Database <span className="bg-linear-to-r from-primary to-secondary/40 bg-clip-text text-transparent italic">Migrations,</span> <br />
              <span className="">
                Zero Friction.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl text-left">
              The intelligent, stateless bridge between Postgres, MySQL, SQLite, and MongoDB. No persistent data, no stored credentials—just fast, secure migrations.
            </p>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center w-full sm:justify-start">
              <button className="group flex h-14 items-center justify-center gap-3 rounded-xl px-6 text-primary font-medium border border-primary transition-all ">
                Start Migrating
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Right: Architecture Diagram */}
          <div className="flex flex-1 items-center justify-center w-full min-h-100 relative">
            
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(to_right,var(--border)_1px,transparent_1px)] bg-size-[60px_60px] opacity-50" />
          {/* Background Concentric Rings */}
          <div className="absolute h-105 w-105 rounded-full border border-border/40 bg-card/5 shadow-[0_0_60px_-15px_rgba(22,162,73,0.1)]" />
          <div className="absolute h-65 w-65 rounded-full border border-primary/20 bg-primary/5" />
          <div className="absolute h-30 w-30 rounded-full border border-primary/40 bg-primary/10" />

          {/* Connection Lines */}
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
            viewBox="0 0 1000 500"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="line-gradient-left" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="line-gradient-right" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Left side connections */}
            <path
              d="M 500 250 C 420 250, 320 180, 60 120"
              stroke="url(#line-gradient-left)"
              strokeWidth="2"
              strokeDasharray="6 5"
            />
            <path
              d="M 500 250 C 400 250, 250 250, 60 250"
              stroke="url(#line-gradient-left)"
              strokeWidth="2"
              strokeDasharray="6 5"
            />
            <path
              d="M 500 250 C 420 250, 320 320, 60 380"
              stroke="url(#line-gradient-left)"
              strokeWidth="2"
              strokeDasharray="6 5"
            />

            {/* Right side connections */}
            <path
              d="M 500 250 C 580 250, 680 180, 940 120"
              stroke="url(#line-gradient-right)"
              strokeWidth="2"
              strokeDasharray="6 5"
            />
            <path
              d="M 500 250 C 600 250, 750 250, 940 250"
              stroke="url(#line-gradient-right)"
              strokeWidth="2"
              strokeDasharray="6 5"
            />
            <path
              d="M 500 250 C 580 250, 680 320, 940 380"
              stroke="url(#line-gradient-right)"
              strokeWidth="2"
              strokeDasharray="6 5"
            />
          </svg>

          {/* Central Hub */}
          <div className="relative z-20 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/30 transform transition-transform hover:scale-105">
            <Database className="h-10 w-10" />
          </div>

          {/* Left Column Items (Inputs) */}
          <div className="absolute left-0 z-10 flex flex-col gap-8">
            <div className="group flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border shadow-md transition-all hover:border-chart-1 hover:shadow-chart-1/20">
              <Server className="h-7 w-7 text-chart-1" />
            </div>
            <div className="group flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border shadow-md transition-all hover:border-chart-2 hover:shadow-chart-2/20">
              <HardDrive className="h-7 w-7 text-chart-2" />
            </div>
            <div className="group flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border shadow-md transition-all hover:border-chart-3 hover:shadow-chart-3/20">
              <Box className="h-7 w-7 text-chart-3" />
            </div>
          </div>

          {/* Right Column Items (Outputs) */}
          <div className="absolute right-0 z-10 flex flex-col gap-8">
            <div className="group flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border shadow-md transition-all hover:border-chart-4 hover:shadow-chart-4/20">
              <Cloud className="h-7 w-7 text-chart-4" />
            </div>
            <div className="group flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border shadow-md transition-all hover:border-chart-5 hover:shadow-chart-5/20">
              <Hexagon className="h-7 w-7 text-chart-5" />
            </div>
            <div className="group flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border shadow-md transition-all hover:border-primary hover:shadow-primary/20">
              <Component className="h-7 w-7 text-primary" />
            </div>
          </div>

          </div>

        </section>

        {/* Feature Highlights */}
        <section className="relative z-10 mt-32 grid w-full max-w-5xl gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card/50 p-8 text-center backdrop-blur-sm text-foreground">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-chart-4/10 text-chart-4">
              <ShieldCheck size={28} />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Stateless Security</h3>
            <p className="text-sm text-muted-foreground">We don't keep your data. Per-request credentials ensure total privacy.</p>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-border bg-card/50 p-8 text-center backdrop-blur-sm text-foreground">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-chart-1/10 text-chart-1">
              <FastForward size={28} />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Real-time Translation</h3>
            <p className="text-sm text-muted-foreground">Automatic schema introspection and instant conversions across engines.</p>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-border bg-card/50 p-8 text-center backdrop-blur-sm text-foreground">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-chart-2/10 text-chart-2">
              <Database size={28} />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Universal Compatibility</h3>
            <p className="text-sm text-muted-foreground">Seamlessly move data between SQL variants and NoSQL databases easily.</p>
          </div>
        </section>

        
      </main>
      <Footer />
    </div>
  )
}
