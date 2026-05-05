import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Skicka alla anrop som börjar på /api till backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})