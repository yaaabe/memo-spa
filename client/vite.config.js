import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /api へのリクエストを Express 側(4000)に中継
      '/api': 'http://localhost:4000'
    }
  }
})
