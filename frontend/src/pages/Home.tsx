import { Navbar } from "@/components/shared/Navbar"
import Footer from "@/components/shared/Footer"
import { HeroSection } from "@/components/shared/HeroSection"
import { PlatformShowcase } from "@/components/shared/PlatformShowcase"
import { UseCases } from "@/components/shared/UseCases"
import { FeatureHighlight } from "@/components/shared/FeatureHighlight"
import { Testimonials } from "@/components/shared/Testimonials"
import { StatsSection } from "@/components/shared/StatsSection"
import { CTASection } from "@/components/shared/CTASection"
import { FAQ } from "@/components/shared/FAQ"

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
