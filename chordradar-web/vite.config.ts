import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/docs': {
        target: 'http://localhost:3030', // Backend server
        changeOrigin: true
      }
    }
  }
});