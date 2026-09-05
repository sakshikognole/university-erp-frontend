import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // bind to 0.0.0.0 — required for Docker
    port: 5173,
    proxy: {
      // /api/* → Spring Boot (books, clubs, sports, certificates)
      '/api': {
        target: process.env.VITE_SPRING_API_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
      // /node-api/* → Node/Express (auth, super-admin, venues)
      '/node-api': {
        target: process.env.VITE_NODE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/node-api/, ''),
      },
    },
  },
});
