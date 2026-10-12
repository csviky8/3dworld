import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const backendOrigin = env.VITE_METAWEB_BACKEND_ORIGIN || 'http://localhost'
  const backendPath = (env.VITE_METAWEB_BACKEND_PATH || '/metaweb').replace(/\/$/, '')
  const proxyRoute = {
    target: backendOrigin,
    changeOrigin: false,
    rewrite: (path) => `${backendPath}${path}`,
  }

  return {
    base: env.VITE_METAWEB_BASE_PATH || '/',
    plugins: [react()],
    server: {
      proxy: {
        '/api': proxyRoute,
        '/sanctum': proxyRoute,
      },
    },
  }
})
