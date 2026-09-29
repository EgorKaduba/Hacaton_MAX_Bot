import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.BACKEND_URL || 'http://127.0.0.1:8000';

  const proxy = {
    '/api': {
      target: backend,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  };

  return {
    plugins: [react()],
    base: './',
    server: {
      host: true,
      port: 5173,
      proxy,
    },
    preview: {
      proxy,
    },
  };
});
