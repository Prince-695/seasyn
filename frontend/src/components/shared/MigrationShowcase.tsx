import { useState, useEffect } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"

// Structured dataset showing database formats
const migrationData = [
  {
    name: "MongoDB",
    title: "MongoDB User Document",
    code: `{
  "_id": "65b2f8a1c9e8",
  "email": "alex.rivera@seasyn.com",
  "name": "Alex Rivera",
  "role": "admin",
  "status": "active",
  "settings": {
    "theme": "dark",
    "notifications": true
  },
  "createdAt": "2026-06-19T12:00:00Z"
}`,
  },
  {
    name: "PostgreSQL",
    title: "PostgreSQL Schema Definition",
    code: `CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'active',
  settings JSONB DEFAULT '{"theme": "dark", "notifications": true}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
  },
  {
    name: "MySQL",
    title: "MySQL Schema Definition",
    code: `CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'active',
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
  },
  {
    name: "DynamoDB",
    title: "DynamoDB Attribute Map",
    code: `{
  "PK": { "S": "USER#65b2f8a1c9e8" },
  "SK": { "S": "PROFILE" },
  "Email": { "S": "alex.rivera@seasyn.com" },
  "Name": { "S": "Alex Rivera" },
  "Role": { "S": "admin" },
  "Status": { "S": "active" },
  "Settings": { "M": {
    "Theme": { "S": "dark" },
    "Notifications": { "BOOL": true }
  }},
  "CreatedAt": { "S": "2026-06-19T12:00:00Z" }
}`,
  },
]

// Live typing effect to animate database transitions
const TypedCode = ({ code }: { code: string }) => {
  const [prevCode, setPrevCode] = useState(code)
  const [displayedCode, setDisplayedCode] = useState("")

  if (code !== prevCode) {
    setPrevCode(code)
    setDisplayedCode("")
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedCode((prev) => {
        if (prev.length >= code.length) {
          clearInterval(interval)
          return prev
        }
        return prev + code.charAt(prev.length)
      })
    }, 8)
    return () => clearInterval(interval)
  }, [code])

  return <code className="font-mono">{displayedCode}</code>
}

export const MigrationShowcase = () => {
  const [activeDbIndex, setActiveDbIndex] = useState(0)

  // Autoplay functionality: switches active database every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDbIndex((prev) => (prev + 1) % migrationData.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [activeDbIndex])

  const activeItem = migrationData[activeDbIndex]

  return (
    <section className="relative z-10 mt-40 w-full max-w-none overflow-hidden py-20 pr-0 pl-6 lg:pl-[max(24px,calc((100vw-1152px)/2+24px))]">
      {/* Decorative Radial Background Lights */}
      {/* <div className="pointer-events-none absolute -left-1/4 top-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-primary/8 blur-[130px]" />
      <div className="pointer-events-none absolute -right-1/4 bottom-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-secondary/8 blur-[130px]" /> */}

      <div className="relative grid grid-cols-1 items-center gap-8 rounded-2xl border border-border/20 bg-secondary/60 p-10 pr-6 lg:grid-cols-12 lg:rounded-r-none lg:border-r-0 lg:pr-16">
        <div className="relative -top-20 z-20 flex flex-col justify-center border bg-card p-7 text-card-foreground lg:col-span-4 lg:scale-[1.05]">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Bridging <br />
            engines with <br />
            <span className="bg-linear-to-b from-primary to-secondary bg-clip-text font-serif text-transparent italic">
              Zero Friction
            </span>
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Watch schemas adapt instantly. Seasyn introspects your database
            structures and translates query compatibility in real-time, bridging
            document models and relational engines fluidly.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button className="group relative inline-flex items-center justify-center gap-2 rounded-2xl p-4.5 hover:bg-primary/90">
              Start Free Migration
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        <div className="relative lg:col-span-6">
          <div className="relative h-80 overflow-hidden rounded-xl bg-accent/10 p-8 font-mono text-xs">
            <div className="mb-4 flex items-center justify-between pb-4">
              <span className="rounded-md bg-card/50 px-3 py-1 text-sm font-bold text-primary uppercase">
                {activeItem.title}
              </span>
              <span className="rounded border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground uppercase">
                {activeItem.name === "MongoDB" || activeItem.name === "DynamoDB"
                  ? "JSON"
                  : "SQL"}
              </span>
            </div>
            <pre className="h-full overflow-x-auto pt-2 leading-relaxed whitespace-pre-wrap text-foreground select-none">
              <TypedCode code={activeItem.code} />
            </pre>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 lg:col-span-2 lg:flex-col">
          {migrationData.map((db, index) => {
            const isActive = index === activeDbIndex
            return (
              <button
                key={db.name}
                onClick={() => setActiveDbIndex(index)}
                className={cn(
                  "relative w-auto rounded-full border px-4 py-3 text-center font-mono text-sm tracking-wider uppercase transition-all duration-300 lg:w-full",
                  isActive
                    ? "border-primary/50 bg-primary text-accent shadow-md shadow-primary/30"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                aria-label={`Select ${db.name} template`}
              >
                {db.name}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default MigrationShowcase
