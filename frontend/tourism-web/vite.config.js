import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '^/api/ai': {
        target: 'http://localhost:18080',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:5252',
        changeOrigin: true,
      },
    },
  },
})