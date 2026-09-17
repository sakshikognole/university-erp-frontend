import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: '..',
  server: {
    proxy: {
      // Clubs and Event Booking → Spring Boot :8080
      '/api/clubs': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/events': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
