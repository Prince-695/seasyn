import { Component } from "lucide-react"

interface DashboardPreviewProps {
  title?: string
  description?: string
}

export const DashboardPreview = ({
  title = "Dashboard Preview Placeholder",
  description = "Replace this with your dashboard screenshot",
}: DashboardPreviewProps) => {
  return (
    <section className="bg-background relative z-10 mt-25 w-full max-w-6xl px-4">
      <div className="group border-border bg-card/50 hover:border-primary/30 relative rounded-3xl border p-2 shadow-xl backdrop-blur-sm transition-all">
        <div className="from-primary/5 pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-b to-transparent" />
        <div className="border-border bg-muted/20 relative flex min-h-100 w-full items-center justify-center overflow-hidden rounded-2xl border md:min-h-150">
          <div className="text-muted-foreground/40 flex flex-col items-center gap-4">
            <Component size={64} className="animate-pulse" />
            <p className="text-xl font-medium tracking-tight">{title}</p>
            <p className="text-sm">{description}</p>
          </div>
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="bg-mac-close h-3 w-3 rounded-full" />
            <div className="bg-mac-minimize h-3 w-3 rounded-full" />
            <div className="bg-mac-maximize h-3 w-3 rounded-full" />
          </div>
        </div>
        <div className="bg-primary/5 absolute -inset-4 -z-10 rounded-[40px] opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
      </div>
    </section>
  )
}

export default DashboardPreview
