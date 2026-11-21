import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxy: any request to /api is forwarded to the FastAPI backend,
// so the browser never has to deal with CORS during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
