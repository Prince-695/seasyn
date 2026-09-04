import { NavLink } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon } from "lucide-react"
import { Button } from "../ui/button"

import type { Theme } from "../theme-provider"

interface NavItem {
  name: string
  path: string
}

interface NavbarMobileProps {
  isOpen: boolean
  onClose: () => void
  navItems: NavItem[]
  isAuthenticated: boolean
  user: {
    name?: string
    first_name?: string
    username?: string
    email: string
  } | null
  handleLogout: () => void
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const NavbarMobile = ({
  isOpen,
  onClose,
  navItems,
  isAuthenticated,
  user,
  handleLogout,
  theme,
  setTheme,
}: NavbarMobileProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-border bg-background overflow-hidden border-t md:hidden"
        >
          <div className="flex flex-col gap-4 p-4 shadow-sm">
            <nav className="flex flex-col gap-3 text-sm font-medium">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className="text-foreground/80 hover:text-primary"
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>

            <div className="bg-border h-px w-full" />

            <div className="flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/dashboard"
                    onClick={onClose}
                    className="border-border bg-card hover:bg-muted flex items-center gap-2 rounded-lg border p-3 transition-colors"
                  >
                    <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold">
                      {(
                        user?.first_name?.[0] ||
                        user?.name?.[0] ||
                        user?.username?.[0] ||
                        user?.email?.[0] ||
                        "U"
                      ).toUpperCase()}
                    </div>
                    <span className="text-foreground text-sm font-medium">
                      {user?.first_name ||
                        (user?.name ? user.name.split(" ")[0] : null) ||
                        (user?.username ? `@${user.username}` : null) ||
                        (user?.email ? user.email.split("@")[0] : "User")}
                    </span>
                  </NavLink>

                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full justify-start"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <NavLink to="/sign-up" onClick={onClose}>
                    <Button className="bg-primary text-primary-foreground w-full justify-start">
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
                  onClose()
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
  )
}

export default NavbarMobile
