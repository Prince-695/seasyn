import { Navbar } from "@/components/home/Navbar"
import Footer from "@/components/home/Footer"
import { HeroSection } from "@/components/home/HeroSection"
import { PlatformShowcase } from "@/components/home/PlatformShowcase"
import { UseCases } from "@/components/home/UseCases"
import { FeatureHighlight } from "@/components/home/FeatureHighlight"
import { Testimonials } from "@/components/home/Testimonials"
import { StatsSection } from "@/components/home/StatsSection"
import { CTASection } from "@/components/home/CTASection"
import { FAQ } from "@/components/home/FAQ"

export const Home = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">
        {/* 1. Hero — light bg, big serif heading */}
        <HeroSection />

        {/* 2. Platform Showcase — dark bg, floating DB icons, terminal mockup */}
        <PlatformShowcase />

        {/* 3. Use Cases — dark bg continues, "Made for the way you migrate" */}
        <UseCases />

        {/* 4. Feature Highlights — light bg, alternating visual/text */}
        <FeatureHighlight />

        {/* 5. Testimonials — dark bg, scrolling cards */}
        <Testimonials />

        {/* 6. Stats — dark bg continues, colored metric cards */}
        <StatsSection />

        {/* 7. FAQ — light bg */}
        <FAQ />

        {/* 8. CTA — dark bg, "Start migrating" */}
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
