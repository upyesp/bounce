import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Custom domain (bounce.upyesp.org) → the site is served from the root.
export default defineConfig({
  base: '/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Bounce',
        short_name: 'Bounce',
        description: 'A 3D physics puzzle — shape a cloth trampoline to bounce the ball into the hole.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        // TODO: add 192/512 icons so the app becomes installable.
        icons: [],
      },
      workbox: {
        // include wasm (ammo.js) so the service worker caches physics for offline play
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        // orillusion + ammo.js produce a large bundle; raise the precache cap so it caches for offline.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
});
