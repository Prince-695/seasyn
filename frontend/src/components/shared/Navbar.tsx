import { NavLink } from "react-router-dom"
import { Database, Sun, Moon, Menu } from "lucide-react"
import { useTheme } from "../theme-provider"
import { useState } from "react"
import { Button } from "../ui/button"

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
    <header className="fixed top-6 left-1/2 z-50 w-[95%] max-w-5xl -translate-x-1/2 rounded-2xl border border-border bg-background/80 px-2 backdrop-blur-md transform-gpu transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-2 md:px-4">
        
        {/* Left Side: Logo & Navigation */}
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">Seasyn</span>
          </NavLink>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `transition-colors hover:text-foreground/80 ${isActive ? "text-foreground" : "text-foreground/60"}`
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
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>

          <div className="hidden sm:flex items-center gap-2">
            {isAuthenticated ? (
              <NavLink to="/profile">
                <Button variant="default" className="h-9">
                  Profile
                </Button>
              </NavLink>
            ) : (
              <>
                {/* <NavLink to="/login">
                  <Button variant="ghost" className="h-9">
                    Login
                  </Button>
                </NavLink> */}
                <NavLink to="/signup">
                  <Button variant="default" className="h-9">
                    Get Started
                  </Button>
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="flex sm:hidden h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 flex flex-col gap-4 shadow-sm animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-3 text-sm font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-foreground/80 hover:text-foreground"
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
          
          <div className="h-px w-full bg-border" />
          
          <div className="flex flex-col gap-2">
            {isAuthenticated ? (
              <NavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full justify-start">Profile</Button>
              </NavLink>
            ) : (
              <>
                {/* <NavLink to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start">Login</Button>
                </NavLink> */}
                <NavLink to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-start">Get Started</Button>
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
                <><Moon className="h-4 w-4" /> Light Mode</>
              ) : (
                <><Sun className="h-4 w-4" /> Dark Mode</>
              )}
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
