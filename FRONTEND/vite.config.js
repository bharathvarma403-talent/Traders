import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Split CSS per chunk to avoid one large CSS file
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Split large vendor libraries into a separate chunk
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('lucide')) {
              return 'vendor-icons';
            }
            if (id.includes('axios') || id.includes('three') || id.includes('@react-three')) {
              return 'vendor-libs';
            }
            return 'vendor';
          }
        },
      },
    },
  },
})
