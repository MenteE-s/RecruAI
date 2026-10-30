import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Admin dashboard: same backend, separate frontend.
// Dev: `npm run dev` serves :5173 and proxies /api to the Flask backend.
// Prod: build to dist/ and serve statically; set VITE_API_BASE_URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
  },
})
