import path from "path";


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import viteSitemap from 'vite-plugin-sitemap'; // Adjust the import


export default defineConfig({
  plugins: [
    react(),
    viteSitemap({
      hostname: 'https://getmaterial.vercel.app/', // Replace with your website's domain
      dynamicRoutes: [],  // Add dynamic routes if applicable
    }),
  ],  server: {
    historyApiFallback: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
})