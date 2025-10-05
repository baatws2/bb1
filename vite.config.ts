import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';

// Clean Vite config for web preview using React + react-native-web
export default defineConfig({
  plugins: [react()],
  root: 'web',
  cacheDir: path.resolve(__dirname, 'node_modules/.vite-web'),
  resolve: {
    alias: [
      // Map react-native imports to react-native-web for the web build
      { find: /^react-native(\/.*)?$/, replacement: 'react-native-web$1' },
      { find: '@', replacement: path.resolve(__dirname, '.') },
      { find: '@app', replacement: path.resolve(__dirname, 'app') },
    ],
    dedupe: ['react', 'react-dom', 'react-native-web'],
  },
  define: {
    __DEV__: true,
    // Some RN libs assume global exists
    global: 'window',
  },
  build: {
    outDir: 'dist',
  },
  // Keep root served at '/'; adjust if deploying under a subpath
  base: '/',
  server: {
    host: true,
    fs: {
      strict: true,
      allow: [path.resolve(__dirname, 'web')],
    },
  },
  optimizeDeps: {
    entries: [path.resolve(__dirname, 'web/main.tsx')],
    noDiscovery: true,
    include: ['react', 'react-dom', 'react-native-web'],
    exclude: ['react-native', 'expo', 'lucide-react-native', 'react-native-webview'],
    esbuildOptions: {
      plugins: [
        {
          name: 'alias-react-native-to-web',
          setup(build) {
            build.onResolve({ filter: /^react-native(\/.*)?$/ }, (args) => ({ path: 'react-native-web' + (args.path.replace(/^react-native/, '') || '') }));
          },
        },
      ],
    },
  },
});
