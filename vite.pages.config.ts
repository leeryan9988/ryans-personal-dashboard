import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];

export default defineConfig({
  base: repositoryName ? `/${repositoryName}/` : '/',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  build: { outDir: 'dist-pages', emptyOutDir: true },
});
