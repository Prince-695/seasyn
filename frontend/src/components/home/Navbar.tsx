import { useState, useRef, useEffect } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  LogIn,
  LayoutDashboard,
  Sparkles,
  FileText,
} from "lucide-react"
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion"
import { useTheme } from "../theme-provider"
import { Button } from "../ui/button"
import { Logo } from "@/components/Logo"
import { cn } from "@/lib/utils"
import { authApi } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"

export const Navbar = () => {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user, clearAuth } = useAuthStore()
  const menuContainerRef = useRef<HTMLDivElement>(null)

  const { scrollY } = useScroll()
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)

  // Scroll visibility management
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current
    lastScrollY.current = latest

    if (latest <= 20) {
      setIsVisible(true)
      return
    }

    const diff = latest - previous
    if (Math.abs(diff) < 6) return

    if (diff > 0) {
      setIsVisible(false)
      setIsMenuOpen(false)
    } else {
      setIsVisible(true)
    }
  })

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMenuOpen])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Backend logout failed - proceed with local clearance
    } finally {
      clearAuth()
      setIsMenuOpen(false)
      navigate("/sign-in")
    }
  }

  // Display user information
  const userName =
    user?.first_name ||
    user?.name ||
    (user?.username ? `@${user.username}` : null) ||
    "Seasyn User"
  const userSub =
    user?.email ||
    (user?.username ? `@${user.username}` : "Stateless Migration Engine")

  return (
    <motion.header
      ref={menuContainerRef}
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: isVisible || isMenuOpen ? 0 : -100,
        opacity: isVisible || isMenuOpen ? 1 : 0,
      }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "border-border bg-background/80 fixed inset-x-0 top-3 z-50 mx-auto w-[95%] max-w-5xl rounded-xl border backdrop-blur-md"
      )}
    >
      {/* Top Navbar Row */}
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Logo */}
        <NavLink
          to="/"
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <Logo showText size={28} />
        </NavLink>

        {/* Right Side: Get Started / Profile to Dash + Dark/Light Theme Toggle + Borderless Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct CTA / Profile navigation button in Navbar */}
          {isAuthenticated ? (
            <NavLink
              to="/dashboard"
              className="border-border/70 bg-card/60 hover:bg-muted flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
            >
              <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium">
                {(
                  user?.first_name?.[0] ||
                  user?.name?.[0] ||
                  user?.username?.[0] ||
                  user?.email?.[0] ||
                  "U"
                ).toUpperCase()}
              </div>
              <span className="text-foreground hidden sm:inline">
                {user?.first_name ||
                  (user?.name ? user.name.split(" ")[0] : null) ||
                  (user?.username ? `@${user.username}` : null) ||
                  (user?.email ? user.email.split("@")[0] : "User")}
              </span>
            </NavLink>
          ) : (
            <NavLink to="/sign-up">
              <Button
                variant="default"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary/30 h-8.5 rounded-md border px-3.5 text-xs font-medium transition-all active:translate-y-px"
              >
                Get Started
              </Button>
            </NavLink>
          )}

          {/* Theme Toggle Button (Directly in Actual Navbar) */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:bg-muted hover:text-foreground h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Borderless Hamburger Menu Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "text-foreground hover:bg-muted flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors",
              isMenuOpen && "bg-muted text-primary"
            )}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-4.5 w-4.5" />
            ) : (
              <Menu className="h-4.5 w-4.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Floating Popover Dropdown Card */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="border-border/80 bg-card/95 text-foreground absolute top-18 right-3 z-50 w-72 rounded-2xl border p-2 shadow-2xl backdrop-blur-xl sm:right-6 sm:w-80"
          >
            {/* Section 1: User / Workspace Header */}
            <div className="px-3 py-2.5">
              <p className="text-foreground truncate text-sm font-medium">
                {userName}
              </p>
              <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
                {userSub}
              </p>
            </div>

            <div className="bg-border/60 my-1 h-px" />

            {/* Section 2: Navigation Links (Including Docs) */}
            <div className="flex flex-col gap-0.5 py-1">
              <NavLink
                to="/docs"
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary/15 text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  )
                }
              >
                <FileText className="h-4 w-4 opacity-70" />
                <span>Documentation</span>
              </NavLink>

              {isAuthenticated && (
                <NavLink
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-secondary/15 text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    )
                  }
                >
                  <LayoutDashboard className="h-4 w-4 opacity-70" />
                  <span>Dashboard Workspace</span>
                </NavLink>
              )}
            </div>

            <div className="bg-border/60 my-1 h-px" />

            {/* Section 3: Auth Actions */}
            <div className="flex flex-col gap-0.5 py-1">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-destructive hover:bg-destructive/10 flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  <LogOut className="text-destructive h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <>
                  <NavLink
                    to="/sign-in"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-foreground/80 hover:text-foreground hover:bg-muted/70 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  >
                    <LogIn className="text-muted-foreground h-4 w-4" />
                    <span>Sign In</span>
                  </NavLink>

                  <NavLink
                    to="/sign-up"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-primary hover:bg-primary/10 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  >
                    <Sparkles className="text-primary h-4 w-4" />
                    <span>Get Started</span>
                  </NavLink>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

export default Navbar
