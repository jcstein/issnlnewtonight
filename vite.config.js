import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [
    react(),
    {
      name: "clean-contact-url",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/contact" || req.url === "/contact/") {
            req.url = "/contact.html"
          }
          next()
        })
      },
    },
  ],
  test: {
    environment: "node",
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: new URL("./index.html", import.meta.url).pathname,
        contact: new URL("./contact.html", import.meta.url).pathname,
      },
    },
  },
})
