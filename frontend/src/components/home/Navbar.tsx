import { NavLink, useNavigate } from "react-router-dom"
import { Sun, Moon, Menu } from "lucide-react"
import { useTheme } from "../theme-provider"
import { useState, useRef } from "react"
import { Button } from "../ui/button"
import { Logo } from "@/components/Logo"
import { cn } from "@/lib/utils"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { authApi } from "@/api/auth"
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

  const { scrollY } = useScroll()
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current
    lastScrollY.current = latest

    // Always visible at the top of the page
    if (latest <= 20) {
      setIsVisible(true)
      return
    }

    const diff = latest - previous
    // Ignore minor jitters
    if (Math.abs(diff) < 6) return

    if (diff > 0) {
      // Scrolling down the page -> hide navbar into top
      setIsVisible(false)
    } else {
      // Scrolling up the page -> reveal navbar
      setIsVisible(true)
    }
  })

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Backend logout failed (e.g. offline) - proceed with client clearance
    } finally {
      clearAuth()
      setIsMobileMenuOpen(false)
      navigate("/sign-in")
    }
  }

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: isVisible || isMobileMenuOpen ? 0 : -100,
        opacity: isVisible || isMobileMenuOpen ? 1 : 0,
      }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "border-border bg-background/80 fixed inset-x-0 top-3 z-50 mx-auto w-[95%] max-w-5xl rounded-xl border-2 backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Logo & Navigation */}
        <NavLink
          to="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <Logo showText size={28} />
        </NavLink>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground hidden h-9 w-9 items-center justify-center rounded-md border bg-transparent transition-colors sm:flex"
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
                  className="border-border bg-card/50 hover:bg-muted flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors"
                >
                  <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
                    {(
                      user?.first_name?.[0] ||
                      user?.name?.[0] ||
                      user?.username?.[0] ||
                      user?.email?.[0] ||
                      "U"
                    ).toUpperCase()}
                  </div>
                  <span className="text-foreground text-xs font-medium">
                    {user?.first_name ||
                      (user?.name ? user.name.split(" ")[0] : null) ||
                      (user?.username ? `@${user.username}` : null) ||
                      (user?.email ? user.email.split("@")[0] : "User")}
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
                    className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary/30 h-9 rounded-md border text-xs font-semibold transition-all active:translate-y-px"
                  >
                    Get Started
                  </Button>
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-foreground hover:bg-muted flex h-9 w-9 items-center justify-center rounded-md sm:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
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
