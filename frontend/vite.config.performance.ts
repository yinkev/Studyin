import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    // Gzip compression for production builds
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files larger than 10kb
    }),
    // Brotli compression for better compression ratios
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
    }),
    // Bundle analyzer
    visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: 'localhost',
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'],
      },
    },
    // Report compressed size
    reportCompressedSize: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunks for optimal caching
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-core';
          }
          // UI components and utilities
          if (id.includes('@radix-ui') || id.includes('class-variance-authority') ||
              id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'ui-core';
          }
          // Icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // Charts and visualization
          if (id.includes('echarts')) {
            return 'charts';
          }
          // Markdown and text processing
          if (id.includes('react-markdown') || id.includes('remark')) {
            return 'markdown';
          }
          // State management
          if (id.includes('zustand')) {
            return 'state';
          }
          // HTTP and networking
          if (id.includes('axios')) {
            return 'network';
          }
          // Utilities
          if (id.includes('dompurify') || id.includes('jwt-decode') || id.includes('sonner')) {
            return 'utils';
          }
          // Node modules that don't fit other categories
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Asset naming for better caching
        entryFileNames: 'assets/js/[name].[hash].js',
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/${facadeModuleId}/[name].[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name].[hash][extname]`;
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return `assets/css/[name].[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name].[hash][extname]`;
          }
          return `assets/[ext]/[name].[hash][extname]`;
        },
      },
      // Tree-shaking optimization
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false,
      },
    },
    // Source map for production debugging (external)
    sourcemap: 'hidden',
    // CSS code splitting
    cssCodeSplit: true,
    // Asset inlining threshold
    assetsInlineLimit: 4096, // 4kb
  },
  // CSS optimization
  css: {
    devSourcemap: false,
    modules: {
      localsConvention: 'camelCase',
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'axios',
      'zustand',
      'react-markdown',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  // Enable experimental features for better performance
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return {
          runtime: `window.__dynamicImportHandler(${JSON.stringify(filename)})`,
        };
      }
    },
  },
});