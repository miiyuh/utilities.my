import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

/**
 * The AVIF and JPEG XL encoders pick a multi-threaded build only when
 * SharedArrayBuffer exists, which needs cross-origin isolation (COEP). The
 * site can't turn that on without blocking cross-origin images, so those
 * builds never run. Pointing them at the single-threaded build keeps about
 * 7 MB of unused WASM and workers out of every deployment.
 */
function singleThreadEncoders(): Plugin {
  const THREADED = /^\.\/codec\/enc\/(avif|jxl)_enc_mt(?:_simd)?\.js$/
  return {
    name: 'single-thread-encoders',
    enforce: 'pre',
    resolveId(source, importer) {
      const match = source.match(THREADED)
      if (!match || !importer?.includes('@jsquash')) return null
      return this.resolve(`./codec/enc/${match[1]}_enc.js`, importer, { skipSelf: true })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), singleThreadEncoders()],
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
    // Source maps are about 10 MB a build. Local builds keep them for
    // debugging; Vercel deployments leave them out (the source is on GitHub).
    sourcemap: !process.env.VERCEL,
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
