import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Bind to all network interfaces
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://192.168.10.6:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate React and React-DOM
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separate chart libraries if you have them
          'charts': ['recharts'],
          // UI components
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog'],
        },
      },
    },
    // Increase chunk size warning limit since we're splitting properly
    chunkSizeWarningLimit: 600,
    // Use esbuild for faster minification
    minify: 'esbuild',
    target: 'esnext',
  },
})
