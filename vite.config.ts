
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Increase limit slightly for heavy pages, but splitting handles the rest
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false, // Speed up builds
    rollupOptions: {
      output: {
        // Manual chunking strategy to isolate large dependencies
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('jspdf') || id.includes('xlsx')) return 'vendor-docs';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react')) return 'vendor-core';
            return 'vendor-misc';
          }
        },
        // Ensure consistent naming for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // Use Terser for superior minification if available (requires npm add -D terser)
    minify: 'esbuild', 
  }
})
