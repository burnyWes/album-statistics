import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const applicationBasePath = '/album-statistics/'

export default defineConfig({
  base: applicationBasePath,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Album-Statistics',
        short_name: 'Alben',
        description: 'Statistiken zu Alben',
        lang: 'de',
        dir: 'ltr',
        start_url: applicationBasePath,
        scope: applicationBasePath,
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1e3a8a',
        background_color: '#ffffff',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
})
