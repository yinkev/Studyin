import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    host: 'localhost',
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      overlay: false,
    },
    // Proxy API and WebSocket traffic to the backend during dev
    // Keeps same-origin requests (no CORS) and ensures WS works reliably
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
        ws: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
  preview: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks to improve caching
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          'icons-vendor': ['lucide-react'],
          'utils-vendor': ['sonner', 'dompurify'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
