import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
export default defineConfig({
  // base absoluta: los assets se cargan desde /assets/... sin importar la
  // profundidad de la ruta. Con './' (relativa) las rutas de 2+ segmentos
  // como /pago/:id o /admin/cotizaciones cargaban mal el JS y salían en blanco.
  base: '/',
  plugins: [inspectAttr(), react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Separa las librerías pesadas para que se cacheen aparte y no
        // se vuelvan a descargar en cada deploy del código de la app.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion': ['framer-motion'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
});
