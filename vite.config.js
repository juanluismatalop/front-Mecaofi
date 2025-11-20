// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/LibroVisitas/',
  plugins: [react()],

  server: {
    host: true, 
    port: 5173,
    // AÑADIDO: Configuración de Proxy para redirigir /api/ a tu Backend
    proxy: {
      '/api': {
        // Asume que tu backend (PHP) corre en el puerto 8000
        target: 'http://localhost:8000', 
        changeOrigin: true, // Importante para peticiones CORS
        rewrite: (path) => path.replace(/^\/api/, '/api'), // Mantiene la ruta /api
      },
    },
  }
});