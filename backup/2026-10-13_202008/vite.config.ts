import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // FR-UI / 3.2 — PWA: manifest, ikon, service worker, start_url=/dashboard
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon-64.png', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/dashboard',
        name: 'SIPANDU',
        short_name: 'SIPANDU',
        description:
          'SIPANDU — Sistem Presensi & Jurnal Digital: presensi guru dan pegawai dengan GPS dan foto, jurnal pembelajaran, serta laporan resmi.',
        lang: 'id',
        dir: 'ltr',
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        categories: ['education', 'productivity', 'business'],
        background_color: '#CFE3F1',
        theme_color: '#1E2A8A',
        // FR-UI / 3.2 — ikon PNG (bukan SVG/emoji): 192, 512, dan satu maskable.
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        // Pintasan layar utama: langsung ke aksi yang paling sering dipakai.
        shortcuts: [
          { name: 'Presensi sekarang', short_name: 'Presensi', url: '/presensi' },
          { name: 'Beranda', short_name: 'Beranda', url: '/dashboard' },
          { name: 'Riwayat presensi', short_name: 'Riwayat', url: '/presensi/riwayat' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ['**/*.{js,css,html,png,svg,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
