import {
  ShieldCheck,
  FastForward,
  Database,
  Zap,
  Activity,
  Search,
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const features = [
  {
    title: "Stateless Security",
    description:
      "We don't keep your data. Per-request credentials ensure total privacy and zero data retention.",
    icon: ShieldCheck,
    color: "primary",
  },
  {
    title: "Real-time Translation",
    description:
      "Automatic schema introspection and instant conversions across multiple database engines.",
    icon: FastForward,
    color: "secondary",
  },
  {
    title: "Universal Compatibility",
    description:
      "Seamlessly move data between SQL variants and NoSQL databases like MongoDB and Postgres.",
    icon: Database,
    color: "secondary",
  },
  {
    title: "Zero Configuration",
    description:
      "Connect and migrate instantly without installing any middle-man agents or server components.",
    icon: Zap,
    color: "primary",
  },
  {
    title: "Streaming Efficiency",
    description:
      "High-performance data streaming ensures even the largest databases migrate with minimal overhead.",
    icon: Activity,
    color: "primary",
  },
  {
    title: "Smart Introspection",
    description:
      "Intelligent discovery of database relationships, types, and indexes for accurate mapping.",
    icon: Search,
    color: "secondary",
  },
]

const FeatureCard = ({
  feature,
  index,
}: {
  feature: (typeof features)[0]
  index: number
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 1.8,
        ease: "easeOut",
        delay: (index % 2) * 0.15,
      }}
      className={cn(
        "group border-border bg-card/40 relative flex h-full flex-col items-start rounded-sm border-2 p-8 backdrop-blur-sm transition-all duration-300",
        feature.color === "primary"
          ? "hover:border-primary/30 hover:shadow-primary/5"
          : "hover:border-secondary/30 hover:shadow-secondary/5",
        "hover:shadow-2xl"
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          "mb-6 flex h-14 w-14 items-center justify-center rounded-sm shadow-sm transition-all duration-500",
          feature.color === "primary"
            ? "bg-primary/10 text-primary group-hover:bg-primary/20"
            : "bg-secondary/10 text-secondary group-hover:bg-secondary/20"
        )}
      >
        <feature.icon size={30} />
      </div>

      {/* Content */}
      <h3 className="text-foreground mb-3 text-xl font-bold tracking-tight">
        {feature.title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {feature.description}
      </p>

      {/* Decorative Corner Accent */}
      <div
        className={cn(
          "absolute top-4 right-4 h-2 w-2 rounded-full opacity-0 transition-opacity group-hover:opacity-100",
          feature.color === "primary" ? "bg-primary" : "bg-secondary"
        )}
      />
    </motion.div>
  )
}

const Features = () => {
  return (
    <section className="z-10 mt-45 w-full max-w-6xl px-6">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Sticky Left Column: Section Header */}
        <div className="text-center lg:sticky lg:top-32 lg:col-span-4 lg:h-fit lg:text-left">
          <h2 className="text-foreground mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            Why Choose <span className="text-primary">Seasyn?</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg lg:mx-0">
            The most powerful, secure, and flexible database migration bridge
            ever built.
          </p>
        </div>

        {/* Right Column: Features Grid */}
        <div className="grid w-full gap-6 sm:grid-cols-2 lg:col-span-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
