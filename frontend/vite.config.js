import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-сервер на 5173; /api уходит на Spring (8095), как same-origin для cookie-сессий.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8095',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
