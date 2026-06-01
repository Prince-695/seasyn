import { NavLink } from "react-router-dom"
import { Sun, Moon, Menu } from "lucide-react"
import { useTheme } from "../theme-provider"
import { useState } from "react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const navItems = [
  { name: "Home", path: "/" },
  { name: "Docs", path: "/docs" },
  { name: "Migration", path: "/migration" },
]

export const Navbar = () => {
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Placeholder for authentication state
  const isAuthenticated = false

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
        <div className="flex items-center gap-8">
          <NavLink
            to="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
          >
            <div className="flex h-10 w-10 items-center justify-center">
              <img
                src="image.svg"
                alt="Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary-1">
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
                  `transition-colors hover:text-primary-2 ${isActive ? "text-primary-1" : "text-muted-foreground"}`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            {isAuthenticated ? (
              <NavLink to="/profile">
                <Button
                  variant="default"
                  className="h-9 bg-primary-1 text-white hover:bg-primary-1/90"
                >
                  Profile
                </Button>
              </NavLink>
            ) : (
              <>
                <NavLink to="/login">
                  <Button variant="ghost" className="mr-2 h-9 hover:bg-muted">
                    Log in
                  </Button>
                </NavLink>
                <NavLink to="/register">
                  <Button
                    variant="default"
                    className="h-9 border-none bg-primary-1 text-white shadow-lg shadow-primary-1/20 hover:bg-primary-1/90"
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
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <div className="flex flex-col gap-4 p-4 shadow-sm">
              <nav className="flex flex-col gap-3 text-sm font-medium">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-foreground/80 hover:text-primary-1"
                  >
                    {item.name}
                  </NavLink>
                ))}
              </nav>

              <div className="h-px w-full bg-border" />

              <div className="flex flex-col gap-2">
                {isAuthenticated ? (
                  <NavLink
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button className="w-full justify-start bg-primary-1 text-white">
                      Profile
                    </Button>
                  </NavLink>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Log in
                      </Button>
                    </NavLink>
                    <NavLink
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button className="w-full justify-start bg-primary-1 text-white">
                        Get Started
                      </Button>
                    </NavLink>
                  </>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark")
                    setIsMobileMenuOpen(false)
                  }}
                >
                  {theme === "dark" ? (
                    <>
                      <Moon className="h-4 w-4" /> Light Mode
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4" /> Dark Mode
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

export default Navbar
