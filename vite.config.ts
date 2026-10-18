import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // Guard against stray React 18 copies pulled in by transitive tooling, which
    // otherwise cause "A React Element from an older version of React".
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    // Bind to all network interfaces (not just localhost) so the dev server
    // is reachable from other devices on the same LAN, e.g. a phone hitting
    // http://<your-pc-ip>:5173.
    host: true,
  },
  build: {
    outDir: 'dist',
    // Hashed bundles live under /_static so they can be cached immutably without
    // colliding with the hand-authored files in public/assets/.
    assetsDir: '_static',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Exact package paths: a bare 'node_modules/react' prefix also matched
          // react-router, react-day-picker and others, pulling them (and the
          // date libraries behind the calendar) into every page's first load.
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/clsx') || id.includes('node_modules/class-variance-authority')) {
            return 'vendor-ui'
          }
          if (id.includes('node_modules/pdf-lib') || id.includes('node_modules/@pdf-lib')) {
            return 'vendor-pdf'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
})
