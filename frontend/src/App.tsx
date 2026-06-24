import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthInitializer } from "@/components/auth"

export function App() {
  return (
    <ThemeProvider>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
    </ThemeProvider>
  )
}

export default App
