import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://127.0.0.1:8008',
      '/ingest': 'http://127.0.0.1:8008',
      '/query': 'http://127.0.0.1:8008',
      '/ws': {
        target: 'ws://127.0.0.1:8008',
        ws: true
      }
    }
  }
})

