import {
  ArrowRight,
  // Database,
  // Server,
  // HardDrive,
  // Box,
  // Cloud,
  // Hexagon,
  Component,
} from "lucide-react"
import { motion, type Variants } from "framer-motion"
import { Navbar } from "../components/shared/Navbar"
import Footer from "../components/shared/Footer"
import { FAQ } from "../components/shared/FAQ"
import Features from "@/components/shared/Features"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/shared/Slider"
import { MigrationShowcase } from "@/components/shared/MigrationShowcase"

const curtainRevealVariants: Variants = {
  hidden: { y: 300 },
  visible: { y: 0, transition: { duration: 2, ease: [0.16, 1, 0.3, 1] } },
}

export const Home = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-x-clip bg-background px-6 pb-10 text-foreground">
        {/* Hero Section */}
        <section className="relative z-10 mt-40 flex w-full max-w-6xl">
          <div
            className="w-full pt-10"
            // style={{
            //   clipPath:
            //     "polygon(-100% -100%, 200% -100%, 200% 100%, -100% 100%)",
            // }}
          >
            <motion.div
              className="flex w-full flex-col items-center justify-between gap-16 lg:flex-row"
              variants={curtainRevealVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Left: Text Content */}
              <div className="flex flex-1 flex-col items-center">
                <h1 className="text-center text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl lg:leading-[1.1]">
                  Fluid Database Migrations,
                  <br />
                  <span className="">Zero Friction.</span>
                </h1>

                <p className="mt-6 max-w-3xl text-center text-lg leading-relaxed text-muted-foreground md:text-xl">
                  The intelligent, stateless bridge between Postgres, MySQL,
                  SQLite, and MongoDB. No persistent data, no stored
                  credentials—just fast, secure migrations.
                </p>

                <div className="relative mt-10 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Button
                    // variant="outline"
                    className="group relative flex items-center justify-center gap-3 border border-primary bg-primary/5 p-6 font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                  >
                    Start Migrating
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="relative z-10 mt-25 w-full max-w-6xl bg-background px-4">
          <div className="group relative rounded-3xl border border-border bg-card/50 p-2 shadow-xl backdrop-blur-sm transition-all hover:border-primary/30">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-b from-primary/5 to-transparent" />
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
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="h-3 w-3 rounded-full bg-chart-4" />
                <div className="h-3 w-3 rounded-full bg-chart-3" />
                <div className="h-3 w-3 rounded-full bg-chart-2" />
              </div>
            </div>
            <div className="absolute -inset-4 -z-10 rounded-[40px] bg-primary/5 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
          </div>
        </section>

        {/* Why Choose Seasyn Section */}
        <Features />

        {/* Database Slider Section */}
        <Slider />

        <MigrationShowcase />

        {/* FAQ Section */}
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
