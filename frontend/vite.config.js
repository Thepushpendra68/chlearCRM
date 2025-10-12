import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const manualChunks = {
  react: ['react', 'react-dom'],
  router: ['react-router-dom'],
  supabase: ['@supabase/supabase-js'],
}

const splitVendorChunk = (id) => {
  if (!id.includes('node_modules')) {
    return null
  }

  const normalizedId = id.split('\0')[0]

  for (const [chunkName, deps] of Object.entries(manualChunks)) {
    if (deps.some((dep) => normalizedId.includes(`${path.sep}${dep}${path.sep}`))) {
      return `vendor-${chunkName}`
    }
  }

  return 'vendor-misc'
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const chunkName = splitVendorChunk(id)
          if (chunkName) {
            return chunkName
          }
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (!name) return 'assets/[name]-[hash][extname]'

          if (/\.(css)$/i.test(name)) {
            return 'assets/styles/[name]-[hash][extname]'
          }
          if (/\.(woff2?|ttf|otf|eot)$/i.test(name)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(name)) {
            return 'assets/images/[name]-[hash][extname]'
          }

          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    minify: 'esbuild',
    cssCodeSplit: true,
  },
  define: {
    // Default to the local API unless explicitly overridden
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:5000/api'
    ),
  },
})
