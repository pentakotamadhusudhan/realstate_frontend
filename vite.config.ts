import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Forces Vite to resolve the import to the raw path directly 
      'leaflet-draw': 'leaflet-draw/dist/leaflet.draw.js'
    }
  }
})
