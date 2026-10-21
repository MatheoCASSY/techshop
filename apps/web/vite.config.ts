import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En dev, le front appelle /api et Vite relaie vers l'API : pas de CORS à gérer
    proxy: { '/api': process.env.VITE_API_PROXY ?? 'http://localhost:3000' },
  },
  build: {
    rolldownOptions: {
      output: {
        // Bibliothèques dans des fichiers séparés : elles changent rarement et restent en cache
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
            },
            { name: 'vendor', test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
