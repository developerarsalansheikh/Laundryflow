import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    {
      name: 'treat-js-files-as-jsx',
      async transform(code, id) {
        if (!id.match(/[\\/]src[\\/].*\.js$/)) return null;
        return transformWithEsbuild(code, id, {
          loader: 'jsx',
          jsx: 'automatic',
        });
      },
    },
    react(),
  ],
  root: path.resolve(__dirname),
  server: {
    port: 5174,
    open: false,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'reactNativeWebShim.js'),
      'react-native-mmkv': path.resolve(__dirname, 'mmkvStub.js'),
      'react-native-config': path.resolve(__dirname, 'configStub.js'),
      'react-native-gesture-handler': path.resolve(__dirname, 'gestureHandlerStub.js'),
      '@react-native-firebase/messaging': path.resolve(__dirname, 'firebaseStub.js'),
      '@react-native-firebase/app': path.resolve(__dirname, 'firebaseStub.js'),
      '@': path.resolve(__dirname, '../src'),
    },
    extensions: [
      '.web.jsx',
      '.web.js',
      '.jsx',
      '.js',
      '.json',
    ],
  },
  define: {
    __DEV__: true,
    global: 'window',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    esbuildOptions: {
      resolveExtensions: [
        '.web.jsx',
        '.web.js',
        '.jsx',
        '.js',
      ],
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
