import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "./components/ui/button"

const App = () => {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f1115] px-6 text-white">
      {/* Background Glow */}
      <div className="absolute top-[-120px] left-[-120px] h-[320px] w-[320px] rounded-full bg-green-500/20 blur-3xl" />
      <div className="absolute right-[-100px] bottom-[-150px] h-[350px] w-[350px] rounded-full bg-emerald-400/10 blur-3xl" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Card */}
      <section className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-xl">
        {/* Badge */}
        <div className="mb-6 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-300">
            <Sparkles size={16} />
            Building the future of seamless database workflows
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-5 text-center">
          <h1 className="text-5xl leading-tight font-bold tracking-tight md:text-6xl">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
              Seasyn
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-300">
            A modern platform crafted to simplify database workflows, connect
            data, and create a truly seamless digital experience.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button className="h-12 rounded-xl bg-green-600 px-8 text-base font-medium text-white transition-all duration-300 hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/30">
            Launching Soon
            <ArrowRight className="ml-2" size={18} />
          </Button>

          <Button
            variant="outline"
            className="h-12 rounded-xl border-white/20 bg-white/5 px-8 text-base text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
          >
            Learn More
          </Button>
        </div>
      </section>
    </main>
  )
}

export default App
