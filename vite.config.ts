import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'node:path';

// Renderer is bundled to `out/`, while the Electron main + preload land in
// `dist-electron/`. electron-builder then emits the installer into `dist/`.
export default defineConfig({
  base: './',
  build: {
    outDir: 'out',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'src/main/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              output: { entryFileNames: 'main.js', format: 'cjs' },
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'src/preload/preload.ts'),
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              output: { entryFileNames: 'preload.js', format: 'cjs' },
            },
          },
        },
      },
    }),
  ],
});
