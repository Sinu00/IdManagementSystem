import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  server: {
    watch: {
      usePolling: true
    },
    hmr: {
      overlay: false
    }
  },
  resolve: {
    alias: {
      'jspdf': 'jspdf/dist/jspdf.es.min.js',
    }
  }
})
