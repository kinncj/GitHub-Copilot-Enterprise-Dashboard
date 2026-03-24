import { defineConfig } from 'vite';

// GitHub Pages serves project repos at /repo-name/ — Vite must know the base
// so generated asset paths are correct. Falls back to '/' for local dev.
const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/';

export default defineConfig({
  base,
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html'
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
