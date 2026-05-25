import { NavLink } from "react-router-dom"
import { Home, FileText, ArrowRightLeft, User, Sun, Moon } from "lucide-react"
import { useTheme } from "../theme-provider"

const navItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Docs", path: "/docs", icon: FileText },
  { name: "Migration", path: "/migration", icon: ArrowRightLeft },
  { name: "Profile", path: "/profile", icon: User },
]

export const BottomBar = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
      {/* Main Navigation Bar Container */}
      <nav className="flex h-17 items-center justify-center gap-2 rounded-4xl border border-border bg-card px-6 shadow-lg">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `group relative flex w-15 flex-col items-center justify-center transition-all duration-300 ${
                isActive ? "-translate-y-7" : ""
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active Indicator Icon Background */}
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-[6px] transition-all duration-300 ${
                    isActive
                      ? "border-accent bg-card shadow-none"
                      : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`h-6 w-6 transition-all duration-300 ${
                      isActive ? "text-primary" : ""
                    }`}
                  />
                </div>

                {/* Text Label */}
                {/* <NavLink
                <span
                  className={`absolute -bottom-2 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "translate-y-2 opacity-100 text-foreground font-bold"
                      : "translate-y-0 opacity-100 text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {item.name}
                </span> */}
              </>
            )}
          </NavLink>
        ))}

        {/* Theme Toggle Separator */}
        <div className="mx-2 h-10 w-px bg-border" />

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="group relative flex w-15 flex-col items-center justify-center transition-all duration-300"
          aria-label="Toggle theme"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-transparent text-muted-foreground transition-all duration-300 hover:text-foreground">
            {theme === "dark" ? (
              <Moon className="h-6 w-6" strokeWidth={2} />
            ) : (
              <Sun className="h-6 w-6" strokeWidth={2} />
            )}
          </div>
          {/* <span className="absolute -bottom-5 text-sm font-medium translate-y-0 opacity-100 text-muted-foreground group-hover:text-foreground transition-all duration-300">
            {theme === "dark" ? "Dark" : "Light"}
          </span> */}
        </button>
      </nav>
    </div>
  )
}
