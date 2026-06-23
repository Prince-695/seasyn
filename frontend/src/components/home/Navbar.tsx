import { NavLink, useNavigate } from "react-router-dom"
import { Sun, Moon, Menu, User } from "lucide-react"
import { useTheme } from "../theme-provider"
import { useState } from "react"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/authStore"
import { NavbarMobile } from "./NavbarMobile"

const navItems = [
  { name: "Home", path: "/" },
  { name: "Docs", path: "/docs" },
  { name: "Migration", path: "/migration" },
]

export const Navbar = () => {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isAuthenticated, user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    setIsMobileMenuOpen(false)
    navigate("/sign-in")
  }

  return (
    <motion.header
      initial={{ y: -100, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed inset-x-0 top-6 z-50 mx-auto w-[95%] max-w-5xl rounded-xl border border-border bg-background/80 shadow-sm backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Logo & Navigation */}
        <NavLink
          to="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="relative flex h-8 w-8 items-center justify-start">
            {/* First Ring: Database Source */}
            <div className="absolute h-7 w-7 rotate-[-15deg] rounded-[6px] border-4 border-primary bg-transparent" />
            {/* Second Ring: Database Target */}
            <div className="absolute h-7 w-7 translate-x-2 translate-y-1 rotate-[-15deg] rounded-[6px] border-4 border-secondary bg-transparent" />
          </div>
          <span className="ml-1 text-xl font-bold tracking-tight text-foreground">
            Seasyn
          </span>
        </NavLink>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `transition-colors hover:text-secondary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          <div className="hidden items-center gap-2 sm:flex">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/dashboard"
                  className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-1.5 transition-colors hover:bg-muted"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {user?.name?.[0]?.toUpperCase() || (
                      <User className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {user?.name ? user.name.split(" ")[0] : user?.email}
                  </span>
                </NavLink>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="h-9 px-3 text-xs"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/sign-up">
                  <Button
                    variant="default"
                    className="h-9 border-none bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                  >
                    Get Started
                  </Button>
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted sm:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <NavbarMobile
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems}
        isAuthenticated={isAuthenticated}
        user={user}
        handleLogout={handleLogout}
        theme={theme}
        setTheme={setTheme}
      />
    </motion.header>
  )
}

export default Navbar
