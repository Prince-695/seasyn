import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { PageTransition } from "./PageTransition"

export function RootLayout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    } else {
      const id = hash.replace("#", "")
      const timer = setTimeout(() => {
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: "smooth" })
        }
      }, 60)
      return () => clearTimeout(timer)
    }
  }, [pathname, hash])

  return <Outlet />
}

export function PublicTransitionLayout() {
  const location = useLocation()
  return (
    <PageTransition
      key={location.pathname}
      preset="fade"
      className="flex min-h-screen flex-col"
    >
      <Outlet />
    </PageTransition>
  )
}
