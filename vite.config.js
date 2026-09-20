import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envDir: '..',
  server: {
    proxy: {
      // All Spring Boot API calls
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // All Node.js API calls (used by api.js NODE_BASE on localhost)
      '/node-api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/node-api/, '/api'),
      },
    },
  },
});