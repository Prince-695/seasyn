import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // This tells Vite: "If a request starts with /api, secretly forward it to port 5000"
      "/api": {
        target: "https://seasyn.onrender.com/v1",
        changeOrigin: true,
      },
    },
  },
})
