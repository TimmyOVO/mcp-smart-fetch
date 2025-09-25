import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],

  // GitHub Pages部署配置
  base: process.env.NODE_ENV === 'production' ? '/mcp-smart-fetch/' : '/',

  // 构建优化
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          animation: ['framer-motion'],
          ui: ['lucide-react'],
          syntax: ['react-syntax-highlighter'],
        },
      },
    },
  },

  // 服务器配置
  server: {
    host: true,
    port: 5173,
  },

  // 预览配置
  preview: {
    host: true,
    port: 4173,
  },
})
