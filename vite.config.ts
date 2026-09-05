import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, open: false },
  // The pdf.js worker is wrapped in our own module so the browser stand-ins
  // load before it starts, which needs the worker built as a module.
  worker: { format: 'es' },
})
