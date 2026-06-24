import { RouterProvider } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { router } from "./router"
import { queryClient } from "./lib/queryClient"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthInitializer } from "@/components/auth"

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
