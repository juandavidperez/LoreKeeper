import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.js',
    exclude: ['**/node_modules/**', '**/e2e/**'],
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
        theme_color: '#f4ead5',
        background_color: '#f4ead5',
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
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshots/bitacora.png',
            sizes: '1000x1514',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Bitácora — Registro de crónicas de lectura'
          },
          {
            src: 'screenshots/archivo.png',
            sizes: '1000x1514',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'El Archivo — Enciclopedia de personajes y lugares'
          },
          {
            src: 'screenshots/plan.png',
            sizes: '1000x1514',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Plan Maestro — Organiza tu lectura por semanas'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't let the service worker intercept Supabase API calls
        navigateFallbackDenylist: [/^\/auth/, /^\/rest/, /^\/storage/, /v1beta\/models/],
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
            // Google Fonts Stylesheets
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            // Google Fonts Files
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Gemini API & Supabase calls: always go to network
            urlPattern: ({ url }) => 
              url.hostname.endsWith('.supabase.co') || 
              url.hostname === 'generativelanguage.googleapis.com',
            handler: 'NetworkOnly',
          }
        ]
      }
    })
  ],
})
