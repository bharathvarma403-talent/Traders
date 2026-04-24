import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Split CSS per chunk to avoid one large CSS file
    cssCodeSplit: true,
  },
})
