import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-files',
      closeBundle() {
        // 复制 manifest.json 到 dist
        copyFileSync('public/manifest.json', 'dist/manifest.json');

        // 复制 content.css 到 dist
        copyFileSync('src/content/content.css', 'dist/content.css');

        // 复制图标
        const iconsDir = 'public/icons';
        const distIconsDir = 'dist/icons';

        if (existsSync(iconsDir)) {
          mkdirSync(distIconsDir, { recursive: true });
          const files = readdirSync(iconsDir);
          files.forEach(file => {
            copyFileSync(`${iconsDir}/${file}`, `${distIconsDir}/${file}`);
          });
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'content') return 'content.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
