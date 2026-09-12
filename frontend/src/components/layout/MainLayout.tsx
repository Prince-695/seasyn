import { useEffect, useRef } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { PageTransition } from "./PageTransition"
import { useUIStore } from "@/store/uiStore"

export function MainLayout() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore()

  // Reset scroll position on route change
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="bg-background text-foreground flex h-screen w-screen overflow-hidden font-sans antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden h-full shrink-0 md:flex">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="bg-background/80 fixed inset-0 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="animate-in bg-card slide-in-from-left relative z-50 flex h-full w-72 max-w-[85vw] flex-col shadow-2xl duration-200">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main App Container */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Scrollable Content Canvas */}
        <main
          ref={mainRef}
          className="from-background via-background to-muted/15 flex-1 overflow-y-auto bg-linear-to-b px-4 py-6 sm:px-8 sm:py-8"
        >
          <div className="mx-auto w-full max-w-7xl">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
