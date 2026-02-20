import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      // Proxy /api/* → local Express email server during dev
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Log a helpful message if the API server is not running
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('\n🔴 [Vite Proxy] Cannot reach local email server at :3001');
            console.error('   → Run this in a NEW terminal tab:');
            console.error('     node api/server.js\n');
          });
        },
      },
    },
  },
})

