import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { Navbar } from "@/components/home/Navbar"
import Footer from "@/components/home/Footer"
import { FAQ } from "@/components/home/FAQ"
import Features from "@/components/home/Features"
import CTA from "@/components/home/CTA"
import HowItWorks from "@/components/home/HowItWorks"
import { Hero } from "@/components/home/Hero"
import { DatabaseTiles } from "@/components/home/DatabaseTiles"

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

        {/* 3D Floating Database Tiles */}
        <DatabaseTiles />

        {/* Core Product Capabilities */}
        <Features />

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
