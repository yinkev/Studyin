import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Personal use optimizations - focus on DX and perceived performance
export default defineConfig({
  plugins: [
    react({
      // Use SWC for faster dev rebuilds (personal use = your CPU time matters)
      fastRefresh: true,
      // Reduce React overhead for dev
      jsxRuntime: 'automatic',
    })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Dev server optimizations for instant feedback
  server: {
    port: 5173,
    // Warm up critical modules
    warmup: {
      clientFiles: [
        './src/App.tsx',
        './src/pages/Dashboard.tsx',
        './src/components/NavBar.tsx',
      ],
    },
  },

  // Build optimizations for personal use
  build: {
    // Don't worry about 500KB for personal use
    chunkSizeWarningLimit: 600,

    // Optimize for modern browsers only (your machine)
    target: 'esnext',

    // Better source maps for debugging
    sourcemap: true,

    rollupOptions: {
      output: {
        // Smart chunking for better caching
        manualChunks: {
          // React ecosystem in one chunk
          'react-vendor': ['react', 'react-dom'],

          // Markdown/chat dependencies
          'markdown': ['react-markdown', 'remark-gfm', 'dompurify'],

          // UI utilities
          'ui': ['sonner', 'lucide-react', '@radix-ui/react-slot'],

          // State/network
          'core': ['zustand', 'axios', 'jwt-decode'],
        },
      },
    },

    // Faster builds with esbuild
    minify: 'esbuild',

    // CSS optimizations
    cssCodeSplit: true,
    cssMinify: 'lightningcss',
  },

  // Optimize dependencies
  optimizeDeps: {
    // Pre-bundle heavy deps
    include: [
      'react',
      'react-dom',
      'react-markdown',
      'lucide-react',
      'zustand',
      'axios',
    ],

    // Exclude rarely used deps
    exclude: ['@testing-library/react'],
  },

  // Performance hints for personal use
  esbuild: {
    // Faster parsing
    legalComments: 'none',

    // Drop console.logs in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});