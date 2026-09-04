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
      // This tells Vite: "If a request starts with /v1, secretly forward it to port 5000"
      "/v1": {
        target:
          process.env.VITE_API_PROXY_TARGET || "https://seasyn.onrender.com",
        changeOrigin: true,
        cookieDomainRewrite: "localhost", // Crucial: rewrites backend cookie domain to localhost
      },
    },
  },
})
