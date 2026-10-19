import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In development every /api request is proxied to the ASP.NET Core server,
// so the browser talks to a single origin and no CORS setup is needed.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'http://localhost:5080',
          changeOrigin: true,
        },
      },
    },
  };
});
