import { ShieldCheck, FastForward, Database } from "lucide-react"

const Features = () => {
  return (
    <section className="relative z-10 mt-32 flex flex-col gap-9">
        <h1 className="mx-auto mb-12 max-w-3xl text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Why Choose <span className="text-primary-2">Seasyn?</span>
        </h1>
        <div className="relative z-10  grid w-full max-w-5xl gap-6 sm:grid-cols-3">
            <div className="group flex flex-col items-center rounded-2xl border border-border bg-card/50 p-8 text-center text-foreground backdrop-blur-sm transition-colors hover:border-primary-1/20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-1/10 text-primary-1 transition-transform group-hover:scale-110">
                <ShieldCheck size={28} />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Stateless Security</h3>
            <p className="text-sm text-muted-foreground">
                We don't keep your data. Per-request credentials ensure total
                privacy.
            </p>
            </div>

            <div className="group flex flex-col items-center rounded-2xl border border-border bg-card/50 p-8 text-center text-foreground backdrop-blur-sm transition-colors hover:border-primary-2/20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-2/10 text-primary-2 transition-transform group-hover:scale-110">
                <FastForward size={28} />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
                Real-time Translation
            </h3>
            <p className="text-sm text-muted-foreground">
                Automatic schema introspection and instant conversions across
                engines.
            </p>
            </div>

            <div className="group flex flex-col items-center rounded-2xl border border-border bg-card/50 p-8 text-center text-foreground backdrop-blur-sm transition-colors hover:border-primary-1/20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-1/10 text-primary-1 transition-transform group-hover:scale-110">
                <Database size={28} />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
                Universal Compatibility
            </h3>
            <p className="text-sm text-muted-foreground">
                Seamlessly move data between SQL variants and NoSQL databases
                easily.
            </p>
            </div>
        </div>
        <div className="relative z-10  grid w-full max-w-5xl gap-6 sm:grid-cols-3">
            <div className="group flex flex-col items-center rounded-2xl border border-border bg-card/50 p-8 text-center text-foreground backdrop-blur-sm transition-colors hover:border-primary-1/20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-1/10 text-primary-1 transition-transform group-hover:scale-110">
                <ShieldCheck size={28} />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Stateless Security</h3>
            <p className="text-sm text-muted-foreground">
                We don't keep your data. Per-request credentials ensure total
                privacy.
            </p>
            </div>

            <div className="group flex flex-col items-center rounded-2xl border border-border bg-card/50 p-8 text-center text-foreground backdrop-blur-sm transition-colors hover:border-primary-2/20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-2/10 text-primary-2 transition-transform group-hover:scale-110">
                <FastForward size={28} />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
                Real-time Translation
            </h3>
            <p className="text-sm text-muted-foreground">
                Automatic schema introspection and instant conversions across
                engines.
            </p>
            </div>

            <div className="group flex flex-col items-center rounded-2xl border border-border bg-card/50 p-8 text-center text-foreground backdrop-blur-sm transition-colors hover:border-primary-1/20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-1/10 text-primary-1 transition-transform group-hover:scale-110">
                <Database size={28} />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
                Universal Compatibility
            </h3>
            <p className="text-sm text-muted-foreground">
                Seamlessly move data between SQL variants and NoSQL databases
                easily.
            </p>
            </div>
        </div>
    </section>
  )
}

export default Features
