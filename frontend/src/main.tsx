import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"

import "./index.css"
import { router } from "./router"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { AuthInitializer } from "@/components/auth"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
    </ThemeProvider>
  </StrictMode>
)
