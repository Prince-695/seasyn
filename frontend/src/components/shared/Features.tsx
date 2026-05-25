
import { ShieldCheck, FastForward, Database, Zap, Activity, Search } from "lucide-react"
import { motion, useScroll, useTransform, type Variants } from "framer-motion"
import { useRef } from "react"
import { cn } from "../../lib/utils"

const features = [
  {
    title: "Stateless Security",
    description: "We don't keep your data. Per-request credentials ensure total privacy and zero data retention.",
    icon: ShieldCheck,
    color: "primary-1"
  },
  {
    title: "Real-time Translation",
    description: "Automatic schema introspection and instant conversions across multiple database engines.",
    icon: FastForward,
    color: "primary-2"
  },
  {
    title: "Universal Compatibility",
    description: "Seamlessly move data between SQL variants and NoSQL databases like MongoDB and Postgres.",
    icon: Database,
    color: "primary-1"
  },
  {
    title: "Zero Configuration",
    description: "Connect and migrate instantly without installing any middle-man agents or server components.",
    icon: Zap,
    color: "primary-2"
  },
  {
    title: "Streaming Efficiency",
    description: "High-performance data streaming ensures even the largest databases migrate with minimal overhead.",
    icon: Activity,
    color: "primary-1"
  },
  {
    title: "Smart Introspection",
    description: "Intelligent discovery of database relationships, types, and indexes for accurate mapping.",
    icon: Search,
    color: "primary-2"
  }
]

const Features = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Track scroll progress of the features section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 60%", "end 20%"]
  })

  return (
    <section ref={containerRef} className="relative z-10 mt-32 flex flex-col items-center gap-16 px-6">
      {/* Section Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
          Why Choose <span className="text-primary-1">Seasyn?</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The most powerful, secure, and flexible database migration bridge ever built.
        </p>
      </motion.div>

      {/* Features Grid */}
      <div className="grid w-full max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          // Each card appears in a specific window of the scroll progress
          // Card 0 starts at 0, Card 1 at 0.1, etc.
          const start = index * 0.12
          const end = start + 0.15
          
          // Use scroll-driven transforms
          // Note: index === 0 is always visible when the section starts
          const opacity = useTransform(scrollYProgress, [start, end], [index === 0 ? 1 : 0, 1])
          const y = useTransform(scrollYProgress, [start, end], [index === 0 ? 0 : 30, 0])
          const scale = useTransform(scrollYProgress, [start, end], [index === 0 ? 1 : 0.95, 1])

          return (
            <motion.div 
              key={index}
              style={{ opacity, y, scale }}
              className={cn(
                "group relative flex flex-col items-start p-8 rounded-sm border-2 border-border bg-card/40 backdrop-blur-sm transition-all duration-300",
                feature.color === "primary-1" ? "hover:border-primary-1/30 hover:shadow-primary-1/5" : "hover:border-primary-2/30 hover:shadow-primary-2/5",
                "hover:shadow-2xl "
              )}
            >
              {/* Icon Container */}
              <div className={cn(
                "mb-6 flex h-14 w-14 items-center justify-center rounded-sm transition-all duration-500 shadow-sm",
                feature.color === "primary-1" ? "bg-primary-1/10 text-primary-1 group-hover:bg-primary-1/20" : "bg-primary-2/10 text-primary-2 group-hover:bg-primary-2/20"
              )}>
                <feature.icon size={30} />
              </div>

              {/* Content */}
              <h3 className="mb-3 text-xl font-bold text-foreground tracking-tight">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Decorative Corner Accent */}
              <div className={cn(
                "absolute top-4 right-4 h-2 w-2 rounded-full opacity-0 transition-opacity group-hover:opacity-100",
                feature.color === "primary-1" ? "bg-primary-1" : "bg-primary-2"
              )} />
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

export default Features
