import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/';

export default defineConfig({
  base,
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: { input: 'index.html' }
  },
  server: { port: 3000 }
});
