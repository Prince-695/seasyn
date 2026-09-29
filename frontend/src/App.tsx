import type { ReactNode } from "react"
import { RouterProvider } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { router } from "./router"
import { queryClient } from "./lib/queryClient"
import { ThemeProvider } from "@/components/theme-provider"
import { useAuth } from "@/hooks/useAuth"

function AuthInitializer({ children }: { children: ReactNode }) {
  useAuth()
  return <>{children}</>
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthInitializer>
          <RouterProvider router={router} />
        </AuthInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
