import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        importScripts: ['notify-sw.js'],
      },
      includeAssets: ['icons/icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'JuegaNosotros',
        short_name: 'JuegaNosotros',
        description: 'Minijuegos en grupo. Siguiente ronda cuando todos hayan jugado.',
        theme_color: '#28DAD4',
        background_color: '#28DAD4',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        lang: 'es',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
