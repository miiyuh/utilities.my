import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
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
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                        return 'vendor-react';
                    }
                    if (id.includes('node_modules/clsx') || id.includes('node_modules/class-variance-authority')) {
                        return 'vendor-ui';
                    }
                    if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
                        return 'vendor-map';
                    }
                },
            },
        },
        chunkSizeWarningLimit: 1500,
    },
});
