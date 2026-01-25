import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-ui': ['clsx', 'class-variance-authority'],
                    'vendor-map': ['leaflet', 'react-leaflet', 'lucide-react'],
                },
            },
        },
        chunkSizeWarningLimit: 1500,
    },
});
