import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envDir: '..',
  server: {
    host: '0.0.0.0',   // exposes the dev server on all interfaces
    port: 5173,        // keep the same port docker-compose maps
  },
});
