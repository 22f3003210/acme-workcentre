import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'esnext',
    minify: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (id.includes('@supabase/supabase-js') || id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            if (
              id.includes('react-router-dom') ||
              id.includes('react-dom') ||
              id.includes('/react/') ||
              id.includes('\\react\\') ||
              id.endsWith('/react') ||
              id.endsWith('\\react')
            ) {
              return 'vendor-react'
            }
          }
        }
      }
    }
  },
  server: {
    port: 8080,
    strictPort: false
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  }
})
