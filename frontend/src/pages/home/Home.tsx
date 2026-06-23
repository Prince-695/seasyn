import { Navbar } from "@/components/home/Navbar"
import Footer from "@/components/home/Footer"
import { FAQ } from "@/components/home/FAQ"
import Features from "@/components/home/Features"
import { Slider } from "@/components/home/Slider"
import { MigrationShowcase } from "@/components/home/MigrationShowcase"
import { Hero } from "@/components/home/Hero"
import { DashboardPreview } from "@/components/home/DashboardPreview"

export const Home = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-x-clip bg-background pb-10 text-foreground">
        {/* Hero Section */}
        <Hero />

        <DashboardPreview />

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
