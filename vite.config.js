import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.js',
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Lorekeeper: The Golden Archive',
        short_name: 'Lorekeeper',
        description: 'Archivo digital para guardianes del conocimiento literario. Gestiona lecturas, captura reflexiones y explora un archivo de conocimiento.',
        lang: 'es',
        categories: ['books', 'education'],
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't let the service worker intercept Supabase API calls
        navigateFallbackDenylist: [/^\/auth/, /^\/rest/, /^\/storage/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkOnly',
            options: {
              precacheFallback: {
                fallbackURL: '/offline.html'
              }
            }
          },
          {
            // Supabase calls: always go to network
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
            handler: 'NetworkOnly',
          }
        ]
      }
    })
  ],
})
