import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { Navbar } from "@/components/home/Navbar"
import Footer from "@/components/home/Footer"
import { FAQ } from "@/components/home/FAQ"
import Features from "@/components/home/Features"
import CTA from "@/components/home/CTA"
import HowItWorks from "@/components/home/HowItWorks"
import { Hero } from "@/components/home/Hero"
import { DashboardPreview } from "@/components/home/DashboardPreview"
import { Playground } from "@/components/home/playground/Playground"

export const Home = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const handleStartMigrating = () => {
    navigate(isAuthenticated ? "/dashboard" : "/sign-up")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="bg-background text-foreground relative flex flex-1 flex-col items-center justify-center overflow-x-clip pb-6">
        {/* Hero Section */}
        <Hero onCtaClick={handleStartMigrating} />

        {/* Dashboard Preview Section */}
        <DashboardPreview />

        {/* Core Product Capabilities */}
        <Features />

        {/* Live SQL ⇄ NoSQL Conversion Playground */}
        <Playground />

        {/* 3-Step Interactive Migration Lifecycle */}
        <HowItWorks />

        {/* High-Intent Technical FAQ */}
        <FAQ />

        {/* Dramatic Minimal Closing CTA */}
        <CTA onCtaClick={handleStartMigrating} />
      </main>
      <Footer />
    </div>
  )
}

export default Home
